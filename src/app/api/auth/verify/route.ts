import { NextResponse } from "next/server";
import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";

import { claimHandle, consumeAuthNonce } from "@/lib/db/convex/server";
import { getEnvServer } from "@/lib/env/env.server";
import { setOwnerSession } from "@/lib/auth/ownerSession";
import { solanaChainIdForNetwork } from "@/lib/solana/chain";
import { buildPing402SignInMessage } from "@/lib/solana/siwsMessage";
import { logger } from "@/lib/observability/logger";
import { getErrorCode, getErrorData } from "@/lib/utils/errorData";
import { parseHandle } from "@/lib/utils/handles";

const BodySchema = z.object({
  publicKey: z.string().min(32),
  signature: z.array(z.number().int().min(0).max(255)),
  nonce: z.string().min(10),
  issuedAt: z.string().datetime(),
  handle: z.string().min(1),
  displayName: z.string().max(64).optional(),
  bio: z.string().max(280).optional(),
});

export async function POST(req: Request) {
  const requestId = req.headers.get("x-request-id") ?? "unknown";

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_BODY" }, requestId },
      { status: 400 }
    );
  }

  const handle = parseHandle(body.handle);
  if (!handle) {
    return NextResponse.json(
      { error: { code: "INVALID_HANDLE" }, requestId },
      { status: 400 }
    );
  }

  const env = getEnvServer();
  try {
    await consumeAuthNonce({ nonce: body.nonce });
  } catch (err: unknown) {
    const data = getErrorData(err);
    const code = getErrorCode(data);
    if (code === "RATE_LIMITED") {
      return NextResponse.json({ error: data, requestId }, { status: 429 });
    }
    if (code) {
      return NextResponse.json({ error: data, requestId }, { status: 400 });
    }
    logger.error({ requestId, err }, "ping402.auth.consume_nonce_failed");
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR" }, requestId },
      { status: 500 }
    );
  }

  const url = new URL(req.url);
  const domain = req.headers.get("host") ?? url.host;
  const uri = url.origin;
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
  const signatureBytes = new Uint8Array(body.signature);

  const verified = nacl.sign.detached.verify(
    encodedMessage,
    signatureBytes,
    new PublicKey(body.publicKey).toBytes()
  );

  if (!verified) {
    return NextResponse.json(
      { error: { code: "INVALID_SIGNATURE" }, requestId },
      { status: 401 }
    );
  }

  const displayName = body.displayName?.trim() || undefined;
  if (displayName && displayName.length < 2) {
    return NextResponse.json(
      { error: { code: "INVALID_DISPLAY_NAME" }, requestId },
      { status: 400 }
    );
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
      return NextResponse.json(
        { error: { code: "HANDLE_TAKEN" }, requestId },
        { status: 403 }
      );
    }
    logger.error({ requestId, err }, "ping402.auth.claim_handle_failed");
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR" }, requestId },
      { status: 500 }
    );
  }

  await setOwnerSession({ walletPubkey: body.publicKey, handle });
  logger.info({ requestId, wallet: body.publicKey, handle }, "ping402.auth.signed_in");

  return NextResponse.json({ ok: true, requestId });
}
