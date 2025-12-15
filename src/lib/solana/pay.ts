import { encodeURL } from "@solana/pay";
import BigNumber from "bignumber.js";
import { PublicKey } from "@solana/web3.js";

export type SolanaPayTransferRequestInput = {
  recipient: string;
  splToken: string;
  amount: string;
  reference: string;
  label: string;
  message: string;
  memo: string;
};

export function buildSolanaPayTransferRequestUrl(input: SolanaPayTransferRequestInput): string {
  const url = encodeURL({
    recipient: new PublicKey(input.recipient),
    amount: new BigNumber(input.amount),
    splToken: new PublicKey(input.splToken),
    reference: new PublicKey(input.reference),
    label: input.label,
    message: input.message,
    memo: input.memo,
  });

  return url.toString();
}

