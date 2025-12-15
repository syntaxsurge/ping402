import { NextRequest, NextResponse } from "next/server";
import type { Id } from "@convex/_generated/dataModel";

import {
  consumeSolanaPayPingIntent,
  getPublicReceiptById,
  getSolanaPayPingIntent,
  setBadgeTxSigForHandle,
} from "@/lib/db/convex/server";
import { getEnvServer } from "@/lib/env/env.server";
import { mintSupporterBadge } from "@/lib/solana/badges";
import { solanaExplorerTxUrl } from "@/lib/solana/explorer";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ intentId: string }> },
) {
  const requestId = req.headers.get("x-request-id") ?? "unknown";
  const { intentId } = await params;

  const intent = await getSolanaPayPingIntent({ intentId: intentId as Id<"solanaPayIntents"> });
  if (!intent) {
    return NextResponse.json(
      { error: { code: "INTENT_NOT_FOUND" }, requestId },
      { status: 404 },
    );
  }

  if (intent.status !== "confirmed") {
    return NextResponse.json(
      { error: { code: "PAYMENT_NOT_CONFIRMED" }, status: intent.status, requestId },
      { status: 409 },
    );
  }

  const { messageId } = await consumeSolanaPayPingIntent({ intentId: intent._id });

  let badgeTxSig: string | null = null;
  let badgeError: string | null = null;

  const receipt = await getPublicReceiptById({ messageId });

  if (receipt?.badgeTxSig) {
    badgeTxSig = receipt.badgeTxSig;
  } else if (intent.payer) {
    const mint = await mintSupporterBadge({
      recipientWallet: intent.payer,
      memo: `ping402:badge:${messageId}`,
    });

    if (mint.ok) {
      badgeTxSig = mint.signature;
      await setBadgeTxSigForHandle({
        handle: intent.toHandle,
        messageId,
        badgeTxSig: mint.signature,
      });
    } else {
      badgeError = mint.reason;
    }
  }

  const env = getEnvServer();
  const paymentTxSig = intent.paymentTxSig ?? null;

  const redirectUrl = new URL(`/u/${encodeURIComponent(intent.toHandle)}`, req.nextUrl.origin);
  redirectUrl.searchParams.set("sent", "1");
  redirectUrl.searchParams.set("r", messageId);
  if (paymentTxSig) redirectUrl.searchParams.set("tx", paymentTxSig);
  if (badgeTxSig) redirectUrl.searchParams.set("badgeTx", badgeTxSig);

  const explorerUrl = paymentTxSig ? solanaExplorerTxUrl(paymentTxSig, env.X402_NETWORK) : null;

  const res = NextResponse.json(
    {
      ok: true,
      intentId: intent._id,
      messageId,
      toHandle: intent.toHandle,
      payer: intent.payer ?? null,
      paymentTxSig,
      paymentExplorerUrl: explorerUrl,
      badgeTxSig,
      badgeExplorerUrl: badgeTxSig ? solanaExplorerTxUrl(badgeTxSig, env.X402_NETWORK) : null,
      badgeError,
      redirectUrl: redirectUrl.toString(),
      requestId,
    },
    { status: 200 },
  );

  res.headers.set("x-ping402-message-id", messageId);
  if (paymentTxSig) res.headers.set("x-ping402-payment-tx", paymentTxSig);
  if (badgeTxSig) res.headers.set("x-ping402-badge-tx", badgeTxSig);

  return res;
}

