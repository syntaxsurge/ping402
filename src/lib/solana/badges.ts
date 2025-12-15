import "server-only";

import { readFile } from "node:fs/promises";

import bs58 from "bs58";
import {
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

import { getEnvServer } from "@/lib/env/env.server";
import { getSolanaConnection } from "@/lib/solana/connection";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

function parseSecretKey(raw: string): Uint8Array {
  const trimmed = raw.trim();

  if (trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(parsed) || parsed.some((v) => typeof v !== "number")) {
      throw new Error("Expected JSON array secret key.");
    }
    return new Uint8Array(parsed);
  }

  try {
    const bytes = bs58.decode(trimmed);
    if (bytes.length === 64) return bytes;
  } catch {
    // ignore
  }

  const decoded = Buffer.from(trimmed, "base64");
  if (decoded.length === 64) return new Uint8Array(decoded);

  throw new Error("Unsupported secret key format (expected JSON array, base58, or base64).");
}

async function loadAuthorityKeypair(): Promise<Keypair> {
  const env = getEnvServer();

  if (env.PING402_BADGE_AUTHORITY_SECRET_KEY) {
    const secretKey = parseSecretKey(env.PING402_BADGE_AUTHORITY_SECRET_KEY);
    return Keypair.fromSecretKey(secretKey);
  }

  if (env.PING402_BADGE_AUTHORITY_KEYPAIR_PATH) {
    const file = await readFile(env.PING402_BADGE_AUTHORITY_KEYPAIR_PATH, "utf8");
    const parsed = JSON.parse(file) as unknown;
    if (!Array.isArray(parsed) || parsed.some((v) => typeof v !== "number")) {
      throw new Error("Badge authority keypair file must be a JSON array of numbers.");
    }
    return Keypair.fromSecretKey(new Uint8Array(parsed));
  }

  throw new Error("Badge authority keypair not configured.");
}

export type MintSupporterBadgeResult =
  | { ok: true; signature: string }
  | { ok: false; reason: string };

export async function mintSupporterBadge(input: {
  recipientWallet: string;
  memo: string;
}): Promise<MintSupporterBadgeResult> {
  const env = getEnvServer();
  if (!env.PING402_BADGE_MINT) {
    return { ok: false, reason: "Supporter badges are not configured." };
  }

  const connection = getSolanaConnection();
  const authority = await loadAuthorityKeypair();

  const mint = new PublicKey(env.PING402_BADGE_MINT);
  const recipient = new PublicKey(input.recipientWallet);

  const recipientAta = await getAssociatedTokenAddress(
    mint,
    recipient,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  const ataIx = createAssociatedTokenAccountIdempotentInstruction(
    authority.publicKey,
    recipientAta,
    recipient,
    mint,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  const mintToIx = createMintToInstruction(
    mint,
    recipientAta,
    authority.publicKey,
    1,
    [],
    TOKEN_2022_PROGRAM_ID,
  );

  const memoIx = new TransactionInstruction({
    programId: MEMO_PROGRAM_ID,
    keys: [
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: recipient, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(input.memo, "utf8"),
  });

  const tx = new Transaction().add(ataIx, mintToIx, memoIx);
  tx.feePayer = authority.publicKey;

  try {
    const signature = await sendAndConfirmTransaction(connection, tx, [authority], {
      commitment: "confirmed",
    });

    return { ok: true, signature };
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Mint failed.";
    return { ok: false, reason };
  }
}

