import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { PublicKey } from "@solana/web3.js";

import { getEnvServer } from "@/lib/env/env.server";
import { getX402PaywallConfig, getX402PaywallProvider } from "@/lib/x402/paywall";
import { getX402Server } from "@/lib/x402/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEMO_PRICE_USD = "$0.01" as const;

function resolveDemoPayToWallet(): string {
  return new PublicKey(getEnvServer().PING402_CLAIM_PAY_TO_WALLET).toBase58();
}

async function handler(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? "unknown";
  return NextResponse.json({
    ok: true,
    requestId,
    message: "x402 demo resource unlocked",
  });
}

export async function GET(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? "unknown";
  const payTo = resolveDemoPayToWallet();

  const env = getEnvServer();

  const routeConfig = {
    accepts: {
      scheme: "exact",
      price: DEMO_PRICE_USD,
      network: env.X402_NETWORK,
      payTo,
      maxTimeoutSeconds: 120,
    },
    description: "x402 demo endpoint (inspect payment-required headers)",
    mimeType: "application/json",
    unpaidResponseBody: () => ({
      contentType: "application/json",
      body: { error: { code: "PAYMENT_REQUIRED" }, requestId },
    }),
  } as const;

  const protectedGet = withX402(
    handler,
    routeConfig,
    getX402Server(),
    getX402PaywallConfig(),
    getX402PaywallProvider(),
  );

  return protectedGet(req);
}
