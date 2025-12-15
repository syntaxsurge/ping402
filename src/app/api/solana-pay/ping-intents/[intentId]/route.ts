import { NextRequest, NextResponse } from "next/server";
import bs58 from "bs58";
import BigNumber from "bignumber.js";
import { findReference } from "@solana/pay";
import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { encodePaymentSignatureHeader } from "@x402/core/http";
import { x402Version } from "@x402/core";
import type { Network, PaymentPayload } from "@x402/core/types";
import type { Id } from "@convex/_generated/dataModel";

import { getSolanaPayPingIntent, markSolanaPayPingIntentConfirmed } from "@/lib/db/convex/server";
import { getEnvServer } from "@/lib/env/env.server";
import { getSolanaConnection } from "@/lib/solana/connection";
import { solanaExplorerTxUrl } from "@/lib/solana/explorer";
import { logger } from "@/lib/observability/logger";

export const runtime = "nodejs";

function sumTokenBalancesForOwnerMint(
  balances: Array<{
    owner?: string;
    mint: string;
    uiTokenAmount: { amount: string };
  }> | null | undefined,
  input: { owner: string; mint: string },
): bigint {
  let sum = BigInt(0);
  for (const balance of balances ?? []) {
    if (balance.mint !== input.mint) continue;
    if (balance.owner !== input.owner) continue;
    sum += BigInt(balance.uiTokenAmount.amount);
  }
  return sum;
}

function getFeePayerFromMessage(message: unknown): string {
  if (message && typeof message === "object") {
    if ("accountKeys" in message && Array.isArray((message as { accountKeys?: unknown }).accountKeys)) {
      const key = (message as { accountKeys: PublicKey[] }).accountKeys[0];
      return key?.toBase58?.() ?? String(key);
    }
    if (
      "staticAccountKeys" in message &&
      Array.isArray((message as { staticAccountKeys?: unknown }).staticAccountKeys)
    ) {
      const key = (message as { staticAccountKeys: PublicKey[] }).staticAccountKeys[0];
      return key?.toBase58?.() ?? String(key);
    }
  }

  throw new Error("Unable to resolve fee payer from transaction message.");
}

function serializeWireTransactionBase64(tx: {
  transaction: { message: unknown; signatures: string[] };
}): string {
  const message = tx.transaction.message as unknown;
  const signatures = tx.transaction.signatures;

  if (message && typeof message === "object" && "accountKeys" in message) {
    const populated = Transaction.populate(message as never, signatures);
    const bytes = populated.serialize({ requireAllSignatures: false, verifySignatures: false });
    return Buffer.from(bytes).toString("base64");
  }

  const versionedMessage = message as never;
  const versionedTx = new VersionedTransaction(versionedMessage);
  versionedTx.signatures = signatures.map((sig) => bs58.decode(sig));
  const bytes = versionedTx.serialize();
  return Buffer.from(bytes).toString("base64");
}

export async function GET(
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

  if (intent.status === "confirmed" || intent.status === "consumed") {
    const res = NextResponse.json(
      {
        ok: true,
        status: intent.status,
        intentId: intent._id,
        payer: intent.payer ?? null,
        paymentTxSig: intent.paymentTxSig ?? null,
        explorerUrl:
          intent.paymentTxSig ? solanaExplorerTxUrl(intent.paymentTxSig, getEnvServer().X402_NETWORK) : null,
        consumedMessageId: intent.consumedMessageId ?? null,
        requestId,
      },
      { status: 200 },
    );
    if (intent.paymentTxSig) res.headers.set("x-ping402-payment-tx", intent.paymentTxSig);
    if (intent.consumedMessageId) res.headers.set("x-ping402-message-id", intent.consumedMessageId);
    return res;
  }

  const connection = getSolanaConnection();

  try {
    const sigInfo = await findReference(connection, new PublicKey(intent.reference), {
      finality: "confirmed",
    });

    const signature = sigInfo.signature;
    const tx = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!tx || !tx.meta) {
      return NextResponse.json(
        { ok: true, status: "pending", intentId: intent._id, requestId },
        { status: 200 },
      );
    }

    if (tx.meta.err) {
      return NextResponse.json(
        { error: { code: "TRANSACTION_FAILED" }, requestId },
        { status: 400 },
      );
    }

    const expectedOwner = intent.x402PayTo;
    const expectedMint = intent.x402Asset;
    const expectedDelta = BigInt(intent.x402Amount);

    const pre = sumTokenBalancesForOwnerMint(tx.meta.preTokenBalances as never, {
      owner: expectedOwner,
      mint: expectedMint,
    });
    const post = sumTokenBalancesForOwnerMint(tx.meta.postTokenBalances as never, {
      owner: expectedOwner,
      mint: expectedMint,
    });

    if (post - pre !== expectedDelta) {
      return NextResponse.json(
        { error: { code: "TRANSFER_MISMATCH" }, requestId },
        { status: 400 },
      );
    }

    const payer = getFeePayerFromMessage(tx.transaction.message);
    const transactionBase64 = serializeWireTransactionBase64(tx as never);

    const paymentPayload: PaymentPayload = {
      x402Version,
      resource: {
        url: `/api/ping/send?tier=${encodeURIComponent(intent.tier)}&to=${encodeURIComponent(intent.toHandle)}`,
        description: "ping402 Solana Pay checkout",
        mimeType: "application/json",
      },
      accepted: {
        scheme: intent.x402Scheme,
        network: intent.x402Network as Network,
        asset: intent.x402Asset,
        amount: intent.x402Amount,
        payTo: intent.x402PayTo,
        maxTimeoutSeconds: 120,
        extra: {},
      },
      payload: { transaction: transactionBase64 },
    };

    const paymentSignatureB64 = encodePaymentSignatureHeader(paymentPayload);

    await markSolanaPayPingIntentConfirmed({
      intentId: intent._id,
      payer,
      paymentTxSig: signature,
      paymentSignatureB64,
    });

    const env = getEnvServer();
    const amountTokens = new BigNumber(intent.x402Amount).shiftedBy(-intent.assetDecimals);

    const res = NextResponse.json(
      {
        ok: true,
        status: "confirmed",
        intentId: intent._id,
        payer,
        paymentTxSig: signature,
        amount: amountTokens.toString(10),
        amountBaseUnits: intent.x402Amount,
        asset: intent.x402Asset,
        payTo: intent.x402PayTo,
        explorerUrl: solanaExplorerTxUrl(signature, env.X402_NETWORK),
        requestId,
      },
      { status: 200 },
    );
    res.headers.set("x-ping402-payment-tx", signature);
    return res;
  } catch (err: unknown) {
    const isNotFound = err instanceof Error && err.name === "FindReferenceError";
    if (isNotFound) {
      return NextResponse.json(
        { ok: true, status: "pending", intentId: intent._id, requestId },
        { status: 200 },
      );
    }

    logger.error({ requestId, err }, "ping402.solana_pay.check_failed");
    return NextResponse.json(
      { error: { code: "VERIFY_FAILED" }, requestId },
      { status: 500 },
    );
  }
}
