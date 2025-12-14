import "server-only";

import { decodePaymentResponseHeader, decodePaymentSignatureHeader } from "@x402/core/http";
import type { PaymentPayload, SettleResponse } from "@x402/core/types";
import { decodeTransactionFromPayload, getTokenPayerFromTransaction } from "@x402/svm";

type SvmTransactionPayload = { transaction?: string };

export type ParsedPaymentSignature = {
  paymentPayload: PaymentPayload;
  tokenPayer: string;
  transactionBase64: string;
};

export function getPaymentSignatureHeader(headers: Headers): string | null {
  return headers.get("payment-signature") ?? headers.get("x-payment");
}

export function parsePaymentSignatureHeader(paymentSignatureB64: string): ParsedPaymentSignature {
  const paymentPayload = decodePaymentSignatureHeader(paymentSignatureB64);

  const payload = paymentPayload.payload as SvmTransactionPayload;
  if (!payload?.transaction) {
    throw new Error("PAYMENT-SIGNATURE missing payload.transaction");
  }

  const transactionBase64 = payload.transaction;
  const tx = decodeTransactionFromPayload({ transaction: transactionBase64 });
  const tokenPayer = getTokenPayerFromTransaction(tx);

  return { paymentPayload, tokenPayer, transactionBase64 };
}

export function parsePaymentResponseHeader(paymentResponseB64: string): SettleResponse {
  return decodePaymentResponseHeader(paymentResponseB64);
}

