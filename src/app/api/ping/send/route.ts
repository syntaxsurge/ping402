import { NextRequest, NextResponse } from "next/server";
import type { Address } from "viem";
import { withX402 } from "x402-next";
import { z } from "zod";

import { getEnvServer } from "@/lib/env/env.server";
import { createPaidMessageForHandle } from "@/lib/db/convex/server";
import { parseXPaymentHeader } from "@/lib/x402/parseXPayment";
import { getX402FacilitatorConfig } from "@/lib/x402/facilitator";
import { logger } from "@/lib/observability/logger";
import { solanaExplorerTxUrl } from "@/lib/solana/explorer";
import { getPingTierConfig, PingTierSchema, type PingTier } from "@/lib/ping/tiers";
import { getErrorCode, getErrorData } from "@/lib/utils/errorData";

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

async function parseRequestBody(req: NextRequest) {
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
  const env = getEnvServer();

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

  const xPayment = req.headers.get("x-payment");
  if (!xPayment) {
    return NextResponse.json(
      { error: { code: "PAYMENT_REQUIRED" }, requestId },
      { status: 402 }
    );
  }

  let payment: ReturnType<typeof parseXPaymentHeader>;
  try {
    payment = parseXPaymentHeader(xPayment);
  } catch (err: unknown) {
    logger.error({ requestId, err }, "ping402.x402.parse_x_payment_failed");
    return NextResponse.json(
      { error: { code: "INVALID_X_PAYMENT" }, requestId },
      { status: 400 }
    );
  }

  try {
    const result = await createPaidMessageForHandle({
      toHandle: body.to,
      tier,
      body: body.body,
      senderName: body.senderName?.trim() || undefined,
      senderContact: body.senderContact?.trim() || undefined,
      payer: payment.payer,
      paymentTxSig: payment.paymentTxSig,
      xPaymentB64: xPayment,
      x402Network: payment.network,
      x402Scheme: payment.scheme,
      x402Version: payment.x402Version,
    });

    const explorerUrl = solanaExplorerTxUrl(payment.paymentTxSig, env.NEXT_PUBLIC_NETWORK);

    logger.info(
      {
        requestId,
        toHandle: body.to,
        tier,
        payer: payment.payer,
        paymentTxSig: payment.paymentTxSig,
        deduped: result.deduped,
      },
      "ping402.ping.created"
    );

    const wantsHtml = (req.headers.get("accept") ?? "").includes("text/html");
    if (wantsHtml) {
      const redirectUrl = new URL(`/u/${encodeURIComponent(body.to)}`, req.nextUrl.origin);
      redirectUrl.searchParams.set("sent", "1");
      redirectUrl.searchParams.set("tx", payment.paymentTxSig);
      return NextResponse.redirect(redirectUrl, 303);
    }

    return NextResponse.json(
      {
        ok: true,
        ...result,
        tier,
        toHandle: body.to,
        payer: payment.payer,
        paymentTxSig: payment.paymentTxSig,
        explorerUrl,
        requestId,
      },
      { status: 200 }
    );
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

let cachedPost: ReturnType<typeof withX402> | undefined;

function getPaywalledPost() {
  if (cachedPost) return cachedPost;

  const env = getEnvServer();
  cachedPost = withX402(
    handler,
    env.NEXT_PUBLIC_WALLET_ADDRESS as Address,
    async (req) => {
      const tier = getTierFromUrl(req);
      const tierConfig = getPingTierConfig(tier);

      return {
        price: tierConfig.priceUsd,
        network: env.NEXT_PUBLIC_NETWORK,
        config: {
          description: `${tierConfig.label} ping: send a paid message to a ping402 inbox`,
          mimeType: "application/json",
          maxTimeoutSeconds: 120,
          discoverable: true,
          inputSchema: {
            queryParams: { tier },
            bodyType: "json",
            bodyFields: {
              to: { type: "string", description: "Recipient handle (3-32 chars)." },
              body: { type: "string", description: "Message body (max 280 chars)." },
              senderName: { type: "string", description: "Optional display name." },
              senderContact: {
                type: "string",
                description: "Optional contact (email, handle, wallet).",
              },
            },
          },
          outputSchema: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              messageId: { type: "string" },
              deduped: { type: "boolean" },
              tier: { type: "string" },
              toHandle: { type: "string" },
              payer: { type: "string" },
              paymentTxSig: { type: "string" },
              explorerUrl: { type: "string" },
              requestId: { type: "string" },
            },
            required: [
              "ok",
              "messageId",
              "deduped",
              "tier",
              "toHandle",
              "payer",
              "paymentTxSig",
              "explorerUrl",
              "requestId",
            ],
          },
        },
      };
    },
    getX402FacilitatorConfig(),
    {
      cdpClientKey: env.NEXT_PUBLIC_CDP_CLIENT_KEY,
      appName: "ping402",
      appLogo: "/favicon.ico",
      sessionTokenEndpoint: "/api/x402/session-token",
    }
  );

  return cachedPost;
}

export const POST = (req: NextRequest) => getPaywalledPost()(req);
