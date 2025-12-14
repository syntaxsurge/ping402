import { NextResponse } from "next/server";
import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";

import { consumeAuthNonce } from "@/lib/db/convex/server";
import { getEnvServer } from "@/lib/env/env.server";
import { setOwnerSession } from "@/lib/auth/ownerSession";
import { solanaChainIdForNetwork } from "@/lib/solana/chain";
import { buildPing402SignInMessage } from "@/lib/solana/siwsMessage";
import { logger } from "@/lib/observability/logger";
import { getErrorCode, getErrorData } from "@/lib/utils/errorData";

const BodySchema = z.object({
  publicKey: z.string().min(32),
  signature: z.array(z.number().int().min(0).max(255)),
  nonce: z.string().min(10),
  issuedAt: z.string().datetime(),
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

  const env = getEnvServer();
  if (body.publicKey !== env.NEXT_PUBLIC_WALLET_ADDRESS) {
    return NextResponse.json(
      { error: { code: "NOT_OWNER" }, requestId },
      { status: 403 }
    );
  }

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

  await setOwnerSession(body.publicKey);
  logger.info({ requestId, owner: body.publicKey }, "ping402.auth.signed_in");

  return NextResponse.json({ ok: true, requestId });
}
