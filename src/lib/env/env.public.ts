import "server-only";

import { z } from "zod";

import { SOLANA_DEVNET_CHAIN_ID, SOLANA_MAINNET_CHAIN_ID } from "@/lib/solana/chain";

const UrlString = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  return value.trim();
}, z.string().url());

const OptionalUrlString = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}, z.string().url().optional());

const PublicEnvSchema = z.object({
  X402_NETWORK: z
    .enum([SOLANA_DEVNET_CHAIN_ID, SOLANA_MAINNET_CHAIN_ID])
    .default(SOLANA_DEVNET_CHAIN_ID),
  X402_FACILITATOR_URL: UrlString.default("https://x402.org/facilitator").transform((v) =>
    v.replace(/\/$/, ""),
  ),

  SOLANA_RPC_URL: OptionalUrlString,
  SOLANA_WS_URL: OptionalUrlString,
});

export type EnvPublic = z.infer<typeof PublicEnvSchema>;

let cached: EnvPublic | undefined;

export function getEnvPublic(): EnvPublic {
  if (cached) return cached;
  cached = PublicEnvSchema.parse(process.env);
  return cached;
}

