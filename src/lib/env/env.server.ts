import "server-only";

import bs58 from "bs58";
import { z } from "zod";

import { SOLANA_DEVNET_CHAIN_ID, SOLANA_MAINNET_CHAIN_ID } from "@/lib/solana/chain";

const OptionalNonEmptyString = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}, z.string().optional());

const UrlString = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  return value.trim();
}, z.string().url());

function isSolanaPublicKey(address: string): boolean {
  try {
    return bs58.decode(address).length === 32;
  } catch {
    return false;
  }
}

const SolanaPublicKeyString = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  return value.trim();
}, z.string().refine(isSolanaPublicKey, "Invalid Solana public key."));

const ServerEnvSchema = z.object({
  NEXT_PUBLIC_CONVEX_URL: UrlString,

  X402_NETWORK: z
    .enum([SOLANA_DEVNET_CHAIN_ID, SOLANA_MAINNET_CHAIN_ID])
    .default(SOLANA_DEVNET_CHAIN_ID),
  X402_FACILITATOR_URL: UrlString.default("https://x402.org/facilitator").transform((v) =>
    v.replace(/\/$/, ""),
  ),

  CDP_API_KEY_ID: OptionalNonEmptyString.pipe(z.string().min(1).optional()),
  CDP_API_KEY_SECRET: OptionalNonEmptyString.pipe(z.string().min(1).optional()),

  PING402_JWT_SECRET: z.string().min(32),
  PING402_CLAIM_PAY_TO_WALLET: SolanaPublicKeyString,
})
.superRefine((env, ctx) => {
  const needsCdpKeys = env.X402_FACILITATOR_URL === "https://api.cdp.coinbase.com/platform/v2/x402";

  if (needsCdpKeys && !env.CDP_API_KEY_ID) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["CDP_API_KEY_ID"],
      message: "CDP_API_KEY_ID is required when using the CDP facilitator.",
    });
  }

  if (needsCdpKeys && !env.CDP_API_KEY_SECRET) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["CDP_API_KEY_SECRET"],
      message: "CDP_API_KEY_SECRET is required when using the CDP facilitator.",
    });
  }
});

export type EnvServer = z.infer<typeof ServerEnvSchema>;

let cached: EnvServer | undefined;

export function getEnvServer(): EnvServer {
  if (cached) return cached;
  cached = ServerEnvSchema.parse(process.env);
  return cached;
}
