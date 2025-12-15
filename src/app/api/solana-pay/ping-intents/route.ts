import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Keypair, PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { x402Version } from "@x402/core";

import { getProfileByHandle, createSolanaPayPingIntent } from "@/lib/db/convex/server";
import { getEnvServer } from "@/lib/env/env.server";
import { getSolanaConnection } from "@/lib/solana/connection";
import { buildSolanaPayTransferRequestUrl } from "@/lib/solana/pay";
import { logger } from "@/lib/observability/logger";
import { getPingTierConfig, PingTierSchema } from "@/lib/ping/tiers";
import { getX402ServerInitialized } from "@/lib/x402/server";

export const runtime = "nodejs";

const BodySchema = z.object({
  toHandle: z.string().min(3).max(32),
  tier: PingTierSchema,
  body: z.string().min(1).max(280),
  senderName: z.string().max(80).optional(),
  senderContact: z.string().max(120).optional(),
});

async function getTokenDecimals(mint: PublicKey): Promise<number> {
  const connection = getSolanaConnection();
  const info = await connection.getParsedAccountInfo(mint, "confirmed");
  const data = info.value?.data as unknown;

  if (data && typeof data === "object" && "parsed" in data) {
    const parsed = (data as { parsed?: { info?: { decimals?: unknown } } }).parsed;
    const decimals = parsed?.info?.decimals;
    if (typeof decimals === "number") return decimals;
  }

  throw new Error(`Failed to read mint decimals for ${mint.toBase58()}.`);
}

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? "unknown";

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_BODY" }, requestId },
      { status: 400 },
    );
  }

  const tierConfig = getPingTierConfig(body.tier);

  const recipient = await getProfileByHandle(body.toHandle);
  if (!recipient) {
    return NextResponse.json(
      { error: { code: "RECIPIENT_NOT_FOUND" }, requestId },
      { status: 404 },
    );
  }

  const env = getEnvServer();
  const payTo = recipient.ownerWallet;

  let paymentRequirement;
  try {
    const server = await getX402ServerInitialized();
    const requirements = await server.buildPaymentRequirementsFromOptions(
      [
        {
          scheme: "exact",
          payTo,
          price: tierConfig.priceUsd,
          network: env.X402_NETWORK,
          maxTimeoutSeconds: 120,
        },
      ],
      {},
    );
    paymentRequirement = requirements[0];
  } catch (err: unknown) {
    logger.error({ requestId, err }, "ping402.solana_pay.build_payment_requirements_failed");
    return NextResponse.json(
      { error: { code: "PAYMENT_REQUIREMENTS_FAILED" }, requestId },
      { status: 500 },
    );
  }

  const reference = Keypair.generate().publicKey.toBase58();

  let assetDecimals: number;
  try {
    assetDecimals = await getTokenDecimals(new PublicKey(paymentRequirement.asset));
  } catch (err: unknown) {
    logger.error({ requestId, err }, "ping402.solana_pay.resolve_mint_decimals_failed");
    return NextResponse.json(
      { error: { code: "ASSET_DECIMALS_FAILED" }, requestId },
      { status: 500 },
    );
  }

  const amountTokens = new BigNumber(paymentRequirement.amount).shiftedBy(-assetDecimals);
  if (!amountTokens.isFinite() || amountTokens.lte(0)) {
    return NextResponse.json(
      { error: { code: "INVALID_PAYMENT_AMOUNT" }, requestId },
      { status: 500 },
    );
  }

  const { intentId } = await createSolanaPayPingIntent({
    toHandle: body.toHandle,
    tier: body.tier,
    body: body.body,
    senderName: body.senderName?.trim() || undefined,
    senderContact: body.senderContact?.trim() || undefined,
    reference,
    assetDecimals,
    x402Network: paymentRequirement.network,
    x402Scheme: paymentRequirement.scheme,
    x402Version: x402Version,
    x402Asset: paymentRequirement.asset,
    x402Amount: paymentRequirement.amount,
    x402PayTo: paymentRequirement.payTo,
  });

  const label = "ping402";
  const message = `Paid ping to @${recipient.handle} (${tierConfig.label})`;
  const memo = `ping402:intent:${intentId}`;

  const solanaPayUrl = buildSolanaPayTransferRequestUrl({
    recipient: paymentRequirement.payTo,
    splToken: paymentRequirement.asset,
    amount: amountTokens.toString(10),
    reference,
    label,
    message,
    memo,
  });

  return NextResponse.json(
    {
      ok: true,
      intentId,
      reference,
      solanaPayUrl,
      asset: paymentRequirement.asset,
      amount: amountTokens.toString(10),
      amountBaseUnits: paymentRequirement.amount,
      assetDecimals,
      payTo: paymentRequirement.payTo,
      network: paymentRequirement.network,
      requestId,
    },
    { status: 200 },
  );
}

