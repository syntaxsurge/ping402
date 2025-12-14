import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

import { storeAuthNonce } from "@/lib/db/convex/server";
import { getEnvServer } from "@/lib/env/env.server";
import { logger } from "@/lib/observability/logger";

export async function POST(req: Request) {
  const requestId = req.headers.get("x-request-id") ?? "unknown";
  const nonce = nanoid(24);
  const createdAt = Date.now();

  await storeAuthNonce({ nonce, createdAt });

  const env = getEnvServer();
  const chainId = env.X402_NETWORK;

  logger.info({ requestId }, "ping402.auth.nonce_issued");

  return NextResponse.json({
    nonce,
    issuedAt: new Date(createdAt).toISOString(),
    chainId,
    requestId,
  });
}
