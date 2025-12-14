import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "x402-next";
import type { SolanaAddress } from "x402-next";
import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";

import { claimHandle, consumeAuthNonce, getProfileByHandle } from "@/lib/db/convex/server";
import { getEnvServer } from "@/lib/env/env.server";
import { setOwnerSession } from "@/lib/auth/ownerSession";
import { solanaChainIdForNetwork } from "@/lib/solana/chain";
import { buildPing402SignInMessage } from "@/lib/solana/siwsMessage";
import { logger } from "@/lib/observability/logger";
import { getErrorCode, getErrorData } from "@/lib/utils/errorData";
import { parseHandle } from "@/lib/utils/handles";
import { getX402FacilitatorConfig } from "@/lib/x402/facilitator";
import { parseXPaymentHeader } from "@/lib/x402/parseXPayment";

const BodySchema = z.object({
  publicKey: z.string().min(32),
  signature: z.union([
    z.array(z.number().int().min(0).max(255)),
    z.string().min(1),
  ]),
  nonce: z.string().min(10),
  issuedAt: z.string().datetime(),
  handle: z.string().min(1),
  displayName: z.string().max(64).optional(),
  bio: z.string().max(280).optional(),
});

export const runtime = "nodejs";

const HANDLE_CLAIM_PRICE_USD = "$0.10" as const;

function resolveClaimPayToWallet(): SolanaAddress | null {
  const value = getEnvServer().PING402_CLAIM_PAY_TO_WALLET?.trim();
  if (!value) return null;
  return value as SolanaAddress;
}

async function parseRequestBody(req: Request): Promise<z.infer<typeof BodySchema>> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return BodySchema.parse(await req.json());
  }

  const data = await req.formData();
  return BodySchema.parse({
    publicKey: data.get("publicKey"),
    signature: data.get("signature"),
    nonce: data.get("nonce"),
    issuedAt: data.get("issuedAt"),
    handle: data.get("handle"),
    displayName: data.get("displayName") || undefined,
    bio: data.get("bio") || undefined,
  });
}

function redirectBackToOwnerSignin(req: NextRequest, input: { handle?: string; error: string }) {
  const url = new URL("/owner-signin", req.nextUrl.origin);
  if (input.handle) url.searchParams.set("handle", input.handle);
  url.searchParams.set("error", input.error);
  return NextResponse.redirect(url, 303);
}

function redirectToDashboard(req: NextRequest) {
  return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin), 303);
}

function responseError(req: NextRequest, input: { requestId: string; handle?: string; code: string; status: number }) {
  const wantsHtml = (req.headers.get("accept") ?? "").includes("text/html");
  if (wantsHtml) {
    return redirectBackToOwnerSignin(req, { handle: input.handle, error: input.code });
  }

  return NextResponse.json(
    { error: { code: input.code }, requestId: input.requestId },
    { status: input.status }
  );
}

function decodeSignatureBytes(signature: z.infer<typeof BodySchema>["signature"]): Uint8Array {
  if (Array.isArray(signature)) return new Uint8Array(signature);
  const buf = Buffer.from(signature, "base64");
  return new Uint8Array(buf);
}

async function handler(req: NextRequest, input: { requiresPaymentForClaim: boolean }) {
  const requestId = req.headers.get("x-request-id") ?? "unknown";
  const wantsHtml = (req.headers.get("accept") ?? "").includes("text/html");

  let body: z.infer<typeof BodySchema>;
  try {
    body = await parseRequestBody(req);
  } catch {
    return responseError(req, { requestId, code: "INVALID_BODY", status: 400 });
  }

  const handle = parseHandle(body.handle);
  if (!handle) {
    return responseError(req, { requestId, code: "INVALID_HANDLE", status: 400 });
  }

  if (input.requiresPaymentForClaim) {
    const xPayment = req.headers.get("X-PAYMENT");
    if (!xPayment) {
      return responseError(req, { requestId, handle, code: "PAYMENT_REQUIRED", status: 402 });
    }

    try {
      const payment = parseXPaymentHeader(xPayment);
      if (payment.payer !== body.publicKey) {
        return responseError(req, {
          requestId,
          handle,
          code: "PAYMENT_PAYER_MISMATCH",
          status: 403,
        });
      }
    } catch (err: unknown) {
      logger.error({ requestId, err }, "ping402.auth.parse_x_payment_failed");
      return responseError(req, { requestId, handle, code: "INVALID_X_PAYMENT", status: 400 });
    }
  }

  const env = getEnvServer();
  try {
    await consumeAuthNonce({ nonce: body.nonce });
  } catch (err: unknown) {
    const data = getErrorData(err);
    const code = getErrorCode(data);
    if (code === "RATE_LIMITED") {
      if (wantsHtml) return redirectBackToOwnerSignin(req, { handle, error: "RATE_LIMITED" });
      return NextResponse.json({ error: data, requestId }, { status: 429 });
    }
    if (code) {
      if (wantsHtml) return redirectBackToOwnerSignin(req, { handle, error: code });
      return NextResponse.json({ error: data, requestId }, { status: 400 });
    }
    logger.error({ requestId, err }, "ping402.auth.consume_nonce_failed");
    return responseError(req, { requestId, handle, code: "INTERNAL_ERROR", status: 500 });
  }

  const domain = req.headers.get("host") ?? req.nextUrl.host;
  const uri = req.nextUrl.origin;
  const chainId = solanaChainIdForNetwork(env.NEXT_PUBLIC_NETWORK);

  const message = buildPing402SignInMessage({
    domain,
    uri,
    publicKey: body.publicKey,
    handle,
    nonce: body.nonce,
    issuedAt: body.issuedAt,
    chainId,
  });

  const encodedMessage = new TextEncoder().encode(message);
  let signatureBytes: Uint8Array;
  try {
    signatureBytes = decodeSignatureBytes(body.signature);
  } catch {
    return responseError(req, { requestId, handle, code: "INVALID_SIGNATURE", status: 400 });
  }

  const verified = nacl.sign.detached.verify(
    encodedMessage,
    signatureBytes,
    new PublicKey(body.publicKey).toBytes()
  );

  if (!verified) {
    return responseError(req, { requestId, handle, code: "INVALID_SIGNATURE", status: 401 });
  }

  const displayName = body.displayName?.trim() || undefined;
  if (displayName && displayName.length < 2) {
    return responseError(req, { requestId, handle, code: "INVALID_DISPLAY_NAME", status: 400 });
  }

  const bio = body.bio?.trim() || undefined;

  try {
    await claimHandle({
      handle,
      displayName: displayName || handle,
      ownerWallet: body.publicKey,
      bio,
    });
  } catch (err: unknown) {
    const data = getErrorData(err);
    const code = getErrorCode(data);
    if (code === "HANDLE_TAKEN") {
      return responseError(req, { requestId, handle, code: "HANDLE_TAKEN", status: 403 });
    }
    logger.error({ requestId, err }, "ping402.auth.claim_handle_failed");
    return responseError(req, { requestId, handle, code: "INTERNAL_ERROR", status: 500 });
  }

  await setOwnerSession({ walletPubkey: body.publicKey, handle });
  logger.info({ requestId, wallet: body.publicKey, handle }, "ping402.auth.signed_in");

  if (wantsHtml) return redirectToDashboard(req);
  return NextResponse.json({ ok: true, requestId });
}

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? "unknown";

  let body: z.infer<typeof BodySchema>;
  try {
    body = await parseRequestBody(req.clone());
  } catch {
    return responseError(req, { requestId, code: "INVALID_BODY", status: 400 });
  }

  const handle = parseHandle(body.handle);
  if (!handle) {
    return responseError(req, { requestId, code: "INVALID_HANDLE", status: 400 });
  }

  const existing = await getProfileByHandle(handle);
  if (existing && existing.ownerWallet !== body.publicKey) {
    return responseError(req, { requestId, handle, code: "HANDLE_TAKEN", status: 403 });
  }

  if (existing) {
    return handler(req, { requiresPaymentForClaim: false });
  }

  const payTo = resolveClaimPayToWallet();
  if (!payTo) {
    logger.error({ requestId }, "ping402.auth.claim_pay_to_wallet_missing");
    return responseError(req, { requestId, handle, code: "SERVER_NOT_CONFIGURED", status: 500 });
  }

  const env = getEnvServer();

  return withX402(
    (nextReq) => handler(nextReq, { requiresPaymentForClaim: true }),
    payTo,
    {
      price: HANDLE_CLAIM_PRICE_USD,
      network: env.NEXT_PUBLIC_NETWORK,
      config: {
        description: "Claim a ping402 handle (creator onboarding)",
        mimeType: "text/html",
        maxTimeoutSeconds: 120,
        discoverable: false,
        inputSchema: {
          bodyType: "form-data",
          bodyFields: {
            publicKey: { type: "string", description: "Solana wallet base58." },
            signature: { type: "string", description: "Base64-encoded signature." },
            nonce: { type: "string", description: "One-time nonce from /api/auth/nonce." },
            issuedAt: { type: "string", description: "ISO timestamp from /api/auth/nonce." },
            handle: { type: "string", description: "Desired handle (3-32 chars)." },
            displayName: { type: "string", description: "Optional display name." },
            bio: { type: "string", description: "Optional bio (max 280 chars)." },
          },
        },
        outputSchema: {
          type: "object",
          properties: {
            ok: { type: "boolean" },
            requestId: { type: "string" },
          },
          required: ["ok", "requestId"],
        },
      },
    },
    getX402FacilitatorConfig(),
    {
      cdpClientKey: env.NEXT_PUBLIC_CDP_CLIENT_KEY,
      appName: "ping402",
      appLogo: "/favicon.ico",
      sessionTokenEndpoint: "/api/x402/session-token",
    }
  )(req);
}
