import "server-only";

import { z } from "zod";

const OptionalNonEmptyString = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}, z.string().optional());

const UrlString = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  return value.trim();
}, z.string().url());

const ServerEnvSchema = z.object({
  NEXT_PUBLIC_CONVEX_URL: UrlString,

  NEXT_PUBLIC_NETWORK: z.enum(["solana-devnet", "solana"]).default("solana-devnet"),
  NEXT_PUBLIC_FACILITATOR_URL: UrlString.default("https://x402.org/facilitator").transform((v) =>
    v.replace(/\/$/, ""),
  ),
  NEXT_PUBLIC_CDP_CLIENT_KEY: OptionalNonEmptyString.pipe(z.string().min(1).optional()),

  CDP_API_KEY_ID: OptionalNonEmptyString.pipe(z.string().min(1).optional()),
  CDP_API_KEY_SECRET: OptionalNonEmptyString.pipe(z.string().min(1).optional()),

  PING402_JWT_SECRET: z.string().min(32),
  PING402_CLAIM_PAY_TO_WALLET: OptionalNonEmptyString.pipe(z.string().min(32).optional()),
})
.superRefine((env, ctx) => {
  const needsCdpKeys =
    env.NEXT_PUBLIC_FACILITATOR_URL === "https://api.cdp.coinbase.com/platform/v2/x402" ||
    Boolean(env.NEXT_PUBLIC_CDP_CLIENT_KEY);

  if (needsCdpKeys && !env.CDP_API_KEY_ID) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["CDP_API_KEY_ID"],
      message: "CDP_API_KEY_ID is required when using the CDP facilitator or Coinbase Onramp.",
    });
  }

  if (needsCdpKeys && !env.CDP_API_KEY_SECRET) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["CDP_API_KEY_SECRET"],
      message: "CDP_API_KEY_SECRET is required when using the CDP facilitator or Coinbase Onramp.",
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
