import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { declareDiscoveryExtension } from "@x402/extensions/bazaar";
import { z } from "zod";
import type { Id } from "@convex/_generated/dataModel";

import { getEnvServer } from "@/lib/env/env.server";
import { getProfileByHandle } from "@/lib/db/convex/server";
import {
  createPaidMessageForHandle,
  markMessagePaidForHandleSettled,
} from "@/lib/db/convex/server";
import { getX402PaywallConfig, getX402PaywallProvider } from "@/lib/x402/paywall";
import {
  getPaymentSignatureHeader,
  parsePaymentSignatureHeader,
  parsePaymentResponseHeader,
} from "@/lib/x402/parsePayment";
import { getX402Server } from "@/lib/x402/server";
import { logger } from "@/lib/observability/logger";
import { solanaChainIdForNetwork } from "@/lib/solana/chain";
import { getPingTierConfig, PingTierSchema, type PingTier } from "@/lib/ping/tiers";
import { getErrorCode, getErrorData } from "@/lib/utils/errorData";
import { parseHandle } from "@/lib/utils/handles";

export const runtime = "nodejs";

const BodySchema = z.object({
  to: z.string().min(3).max(32),
  body: z.string().min(1).max(280),
  senderName: z.string().max(80).optional(),
  senderContact: z.string().max(120).optional(),
});

function getTierFromUrl(req: NextRequest): PingTier {
  const tier = PingTierSchema.safeParse(req.nextUrl.searchParams.get("tier"));
  return tier.success ? tier.data : "standard";
}

async function parseRequestBody(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return BodySchema.parse(await req.json());
  }

  const data = await req.formData();
  return BodySchema.parse({
    to: data.get("to"),
    body: data.get("body"),
    senderName: (data.get("senderName") || undefined) as string | undefined,
    senderContact: (data.get("senderContact") || undefined) as string | undefined,
  });
}

const handler = async (req: NextRequest) => {
  const requestId = req.headers.get("x-request-id") ?? "unknown";

  const tier = getTierFromUrl(req);

  let body: z.infer<typeof BodySchema>;
  try {
    body = await parseRequestBody(req);
  } catch {
    const wantsHtml = (req.headers.get("accept") ?? "").includes("text/html");
    if (wantsHtml) {
      const redirectUrl = new URL(`/ping/${tier}`, req.nextUrl.origin);
      redirectUrl.searchParams.set("to", req.nextUrl.searchParams.get("to") ?? "");
      redirectUrl.searchParams.set("error", "invalid");
      return NextResponse.redirect(redirectUrl, 303);
    }

    return NextResponse.json(
      { error: { code: "INVALID_BODY" }, requestId },
      { status: 400 }
    );
  }

  const paymentSignature = getPaymentSignatureHeader(req.headers);
  if (!paymentSignature) {
    return NextResponse.json(
      { error: { code: "PAYMENT_REQUIRED" }, requestId },
      { status: 402 },
    );
  }

  let parsedPayment: ReturnType<typeof parsePaymentSignatureHeader>;
  try {
    parsedPayment = parsePaymentSignatureHeader(paymentSignature);
  } catch (err: unknown) {
    logger.error({ requestId, err }, "ping402.x402.parse_payment_signature_failed");
    return NextResponse.json(
      { error: { code: "INVALID_PAYMENT_SIGNATURE" }, requestId },
      { status: 400 },
    );
  }

  try {
    const result = await createPaidMessageForHandle({
      toHandle: body.to,
      tier,
      body: body.body,
      senderName: body.senderName?.trim() || undefined,
      senderContact: body.senderContact?.trim() || undefined,
      payer: parsedPayment.tokenPayer,
      paymentSignatureB64: paymentSignature,
      x402Network: parsedPayment.paymentPayload.accepted.network,
      x402Scheme: parsedPayment.paymentPayload.accepted.scheme,
      x402Version: parsedPayment.paymentPayload.x402Version,
      x402Asset: parsedPayment.paymentPayload.accepted.asset,
      x402Amount: parsedPayment.paymentPayload.accepted.amount,
      x402PayTo: parsedPayment.paymentPayload.accepted.payTo,
    });

    logger.info(
      {
        requestId,
        toHandle: body.to,
        tier,
        payer: parsedPayment.tokenPayer,
        deduped: result.deduped,
      },
      "ping402.ping.created"
    );

    const wantsHtml = (req.headers.get("accept") ?? "").includes("text/html");
    if (wantsHtml) {
      const redirectUrl = new URL(`/u/${encodeURIComponent(body.to)}`, req.nextUrl.origin);
      redirectUrl.searchParams.set("sent", "1");
      const res = NextResponse.redirect(redirectUrl, 303);
      res.headers.set("x-ping402-message-id", result.messageId);
      return res;
    }

    const res = NextResponse.json(
      {
        ok: true,
        ...result,
        tier,
        toHandle: body.to,
        payer: parsedPayment.tokenPayer,
        requestId,
      },
      { status: 200 },
    );
    res.headers.set("x-ping402-message-id", result.messageId);
    return res;
  } catch (err: unknown) {
    const data = getErrorData(err);
    const code = getErrorCode(data);
    const wantsHtml = (req.headers.get("accept") ?? "").includes("text/html");

    if (code === "RATE_LIMITED") {
      if (wantsHtml) {
        const redirectUrl = new URL(`/ping/${tier}`, req.nextUrl.origin);
        redirectUrl.searchParams.set("to", body.to);
        redirectUrl.searchParams.set("error", "rate_limited");
        return NextResponse.redirect(redirectUrl, 303);
      }
      return NextResponse.json({ error: data, requestId }, { status: 429 });
    }
    if (code) {
      if (wantsHtml) {
        const redirectUrl = new URL(`/ping/${tier}`, req.nextUrl.origin);
        redirectUrl.searchParams.set("to", body.to);
        redirectUrl.searchParams.set("error", String(code).toLowerCase());
        return NextResponse.redirect(redirectUrl, 303);
      }
      return NextResponse.json({ error: data, requestId }, { status: 400 });
    }

    logger.error({ requestId, err }, "ping402.ping.create_failed");
    if (wantsHtml) {
      const redirectUrl = new URL(`/ping/${tier}`, req.nextUrl.origin);
      redirectUrl.searchParams.set("to", body.to);
      redirectUrl.searchParams.set("error", "internal");
      return NextResponse.redirect(redirectUrl, 303);
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR" }, requestId },
      { status: 500 }
    );
  }
};

async function getRecipientHandle(req: NextRequest): Promise<string | null> {
  const fromQuery = parseHandle(req.nextUrl.searchParams.get("to") ?? "");
  if (fromQuery) return fromQuery;

  try {
    const body = await parseRequestBody(req.clone());
    return parseHandle(body.to);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? "unknown";
  const tier = getTierFromUrl(req);

  const toHandle = await getRecipientHandle(req);
  if (!toHandle) {
    const wantsHtml = (req.headers.get("accept") ?? "").includes("text/html");
    if (wantsHtml) {
      const redirectUrl = new URL(`/ping/${tier}`, req.nextUrl.origin);
      redirectUrl.searchParams.set("error", "invalid");
      return NextResponse.redirect(redirectUrl, 303);
    }

    return NextResponse.json(
      { error: { code: "INVALID_RECIPIENT" }, requestId },
      { status: 400 }
    );
  }

  const recipient = await getProfileByHandle(toHandle);
  if (!recipient) {
    const wantsHtml = (req.headers.get("accept") ?? "").includes("text/html");
    if (wantsHtml) {
      const redirectUrl = new URL(`/ping/${tier}`, req.nextUrl.origin);
      redirectUrl.searchParams.set("to", toHandle);
      redirectUrl.searchParams.set("error", "not_found");
      return NextResponse.redirect(redirectUrl, 303);
    }

    return NextResponse.json(
      { error: { code: "RECIPIENT_NOT_FOUND" }, requestId },
      { status: 404 }
    );
  }

  const env = getEnvServer();
  const tierConfig = getPingTierConfig(tier);
  const payTo = recipient.ownerWallet;

  const routeConfig = {
    accepts: {
      scheme: "exact",
      price: tierConfig.priceUsd,
      network: solanaChainIdForNetwork(env.NEXT_PUBLIC_NETWORK),
      payTo,
      maxTimeoutSeconds: 120,
    },
    description: `${tierConfig.label} ping: send a paid message to a ping402 inbox`,
    mimeType: "application/json",
    unpaidResponseBody: () => ({
      contentType: "application/json",
      body: { error: { code: "PAYMENT_REQUIRED" }, requestId },
    }),
    extensions: {
      ...declareDiscoveryExtension({
        bodyType: "form-data",
        input: {
          to: toHandle,
          body: "Hello from ping402!",
          senderName: "Sender",
          senderContact: "@sender",
        },
        inputSchema: {
          type: "object",
          properties: {
            to: { type: "string", description: "Recipient handle (3-32 chars)." },
            body: { type: "string", description: "Message body (max 280 chars)." },
            senderName: { type: "string", description: "Optional display name." },
            senderContact: { type: "string", description: "Optional contact info." },
          },
          required: ["to", "body"],
          additionalProperties: false,
        },
        output: {
          example: {
            ok: true,
            messageId: "convex_message_id",
            deduped: false,
            tier,
            toHandle,
            payer: "sender_wallet",
            requestId,
          },
        },
      } as unknown as Parameters<typeof declareDiscoveryExtension>[0]),
    },
  } as const;

  const protectedPost = withX402(
    handler,
    routeConfig,
    getX402Server(),
    getX402PaywallConfig(),
    getX402PaywallProvider(),
  );

  const res = await protectedPost(req);

  const paymentResponseB64 =
    res.headers.get("payment-response") ?? res.headers.get("PAYMENT-RESPONSE");
  const messageId = res.headers.get("x-ping402-message-id");

  if (res.status < 400 && paymentResponseB64 && messageId) {
    try {
      const settle = parsePaymentResponseHeader(paymentResponseB64);
      const txSig = settle.transaction;
      if (txSig) {
        await markMessagePaidForHandleSettled({
          handle: toHandle,
          messageId: messageId as Id<"messages">,
          paymentTxSig: txSig,
        });

        const location = res.headers.get("location");
        if (location) {
          const url = new URL(location, req.nextUrl.origin);
          url.searchParams.set("tx", txSig);
          res.headers.set("location", url.toString());
        }
        res.headers.set("x-ping402-payment-tx", txSig);
      }
    } catch (err: unknown) {
      logger.warn({ requestId, err }, "ping402.x402.parse_payment_response_failed");
    }
  }

  return res;
}
