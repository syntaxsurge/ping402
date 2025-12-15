#!/usr/bin/env tsx

import { readFile } from "node:fs/promises";

import bs58 from "bs58";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  createInitializeNonTransferableMintInstruction,
  getMintLen,
  getMinimumBalanceForRentExemptMintWithExtensions,
} from "@solana/spl-token";

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
  const secretKey = process.env.PING402_BADGE_AUTHORITY_SECRET_KEY?.trim();
  if (secretKey) {
    return Keypair.fromSecretKey(parseSecretKey(secretKey));
  }

  const keypairPath = process.env.PING402_BADGE_AUTHORITY_KEYPAIR_PATH?.trim();
  if (keypairPath) {
    const file = await readFile(keypairPath, "utf8");
    const parsed = JSON.parse(file) as unknown;
    if (!Array.isArray(parsed) || parsed.some((v) => typeof v !== "number")) {
      throw new Error("Badge authority keypair file must be a JSON array of numbers.");
    }
    return Keypair.fromSecretKey(new Uint8Array(parsed));
  }

  throw new Error(
    "Set PING402_BADGE_AUTHORITY_SECRET_KEY (recommended) or PING402_BADGE_AUTHORITY_KEYPAIR_PATH before running this script.",
  );
}

function explorerClusterParam(rpcUrl: string): string | null {
  if (rpcUrl.includes("devnet")) return "devnet";
  if (rpcUrl.includes("testnet")) return "testnet";
  return null;
}

async function main() {
  const rpcUrl = (process.env.SOLANA_RPC_URL ?? clusterApiUrl("devnet")).trim();
  const connection = new Connection(rpcUrl, { commitment: "confirmed" });

  const authority = await loadAuthorityKeypair();
  const mintKeypair = Keypair.generate();

  const extensions = [ExtensionType.NonTransferable];
  const mintLen = getMintLen(extensions);
  const lamports = await getMinimumBalanceForRentExemptMintWithExtensions(connection, extensions);

  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: authority.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      lamports,
      space: mintLen,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeNonTransferableMintInstruction(mintKeypair.publicKey, TOKEN_2022_PROGRAM_ID),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      0,
      authority.publicKey,
      null,
      TOKEN_2022_PROGRAM_ID,
    ),
  );

  const signature = await sendAndConfirmTransaction(connection, tx, [authority, mintKeypair], {
    commitment: "confirmed",
  });

  const mint = mintKeypair.publicKey.toBase58();
  const cluster = explorerClusterParam(rpcUrl);
  const explorerUrl = new URL(`https://explorer.solana.com/address/${encodeURIComponent(mint)}`);
  if (cluster) explorerUrl.searchParams.set("cluster", cluster);

  console.log("Badge authority:", authority.publicKey.toBase58());
  console.log("Badge mint:", mint);
  console.log("Mint tx:", signature);
  console.log("Explorer:", explorerUrl.toString());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
