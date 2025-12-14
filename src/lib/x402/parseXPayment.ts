import bs58 from "bs58";
import { VersionedTransaction } from "@solana/web3.js";

type X402PaymentProof = {
  x402Version?: number;
  scheme?: string;
  network?: string;
  payload?: { serializedTransaction?: string };
};

export function parseXPaymentHeader(xPaymentB64: string) {
  const raw = Buffer.from(xPaymentB64, "base64").toString("utf8");
  const parsed = JSON.parse(raw) as X402PaymentProof;

  const serializedTx = parsed.payload?.serializedTransaction;
  if (!serializedTx) {
    throw new Error("X-PAYMENT missing payload.serializedTransaction");
  }

  const txBytes = Buffer.from(serializedTx, "base64");
  const tx = VersionedTransaction.deserialize(txBytes);

  const payerKey = tx.message.staticAccountKeys[0];
  if (!payerKey) {
    throw new Error("Unable to determine payer from serialized transaction");
  }
  const payer = payerKey.toBase58();

  const sig0 = tx.signatures?.[0];
  if (!sig0) {
    throw new Error("Serialized transaction missing signatures[0]");
  }

  const paymentTxSig = bs58.encode(sig0);

  return {
    payer,
    paymentTxSig,
    scheme: parsed.scheme,
    network: parsed.network,
    x402Version: parsed.x402Version,
  };
}
