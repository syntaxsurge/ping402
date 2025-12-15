import { encodeURL } from "@solana/pay";
import BigNumber from "bignumber.js";
import { Buffer } from "buffer";
import { Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

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

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

export type SolanaPayTransferTransactionInput = {
  connection: Connection;
  payer: PublicKey;
  recipient: string;
  splToken: string;
  amountBaseUnits: string;
  assetDecimals: number;
  reference: string;
  memo?: string;
};

export async function buildSolanaPayTransferTransaction(
  input: SolanaPayTransferTransactionInput,
): Promise<Transaction> {
  const mint = new PublicKey(input.splToken);
  const recipient = new PublicKey(input.recipient);
  const reference = new PublicKey(input.reference);

  const mintAccount = await input.connection.getAccountInfo(mint, "confirmed");
  if (!mintAccount) {
    throw new Error("MINT_NOT_FOUND");
  }

  const tokenProgramId = mintAccount.owner.equals(TOKEN_2022_PROGRAM_ID)
    ? TOKEN_2022_PROGRAM_ID
    : TOKEN_PROGRAM_ID;

  const senderAta = getAssociatedTokenAddressSync(
    mint,
    input.payer,
    false,
    tokenProgramId,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  const recipientAta = getAssociatedTokenAddressSync(
    mint,
    recipient,
    false,
    tokenProgramId,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  const [senderAtaInfo, recipientAtaInfo] = await Promise.all([
    input.connection.getAccountInfo(senderAta, "confirmed"),
    input.connection.getAccountInfo(recipientAta, "confirmed"),
  ]);

  const instructions: TransactionInstruction[] = [];

  const memo = input.memo?.trim();
  if (memo) {
    instructions.push(
      new TransactionInstruction({
        programId: MEMO_PROGRAM_ID,
        keys: [],
        data: Buffer.from(memo, "utf8"),
      }),
    );
  }

  if (!senderAtaInfo) {
    instructions.push(
      createAssociatedTokenAccountInstruction(
        input.payer,
        senderAta,
        input.payer,
        mint,
        tokenProgramId,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
    );
  }

  if (!recipientAtaInfo) {
    instructions.push(
      createAssociatedTokenAccountInstruction(
        input.payer,
        recipientAta,
        recipient,
        mint,
        tokenProgramId,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
    );
  }

  const transferIx = createTransferCheckedInstruction(
    senderAta,
    mint,
    recipientAta,
    input.payer,
    BigInt(input.amountBaseUnits),
    input.assetDecimals,
    [],
    tokenProgramId,
  );
  transferIx.keys.push({ pubkey: reference, isWritable: false, isSigner: false });
  instructions.push(transferIx);

  const tx = new Transaction().add(...instructions);
  tx.feePayer = input.payer;
  tx.recentBlockhash = (await input.connection.getLatestBlockhash("confirmed")).blockhash;
  return tx;
}
