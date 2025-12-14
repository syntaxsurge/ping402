import { config as loadEnv } from "dotenv";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

loadEnv({ path: ".env.local" });

const HANDLE_RE = /^[a-z0-9][a-z0-9_-]{2,31}$/;

const OptionalNonEmptyString = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}, z.string().optional());

const EnvSchema = z.object({
  NEXT_PUBLIC_CONVEX_URL: z.string().url(),

  NEXT_PUBLIC_WALLET_ADDRESS: z.string().min(1),
  PING402_OWNER_HANDLE: z
    .string()
    .transform((v) => v.trim().toLowerCase())
    .refine((v) => HANDLE_RE.test(v), {
      message:
        "PING402_OWNER_HANDLE must be 3-32 chars: letters, numbers, underscores, hyphens.",
    }),
  PING402_OWNER_DISPLAY_NAME: z.string().min(2).max(64),
  PING402_OWNER_BIO: OptionalNonEmptyString.pipe(z.string().max(280).optional()),
});

async function main() {
  const env = EnvSchema.parse(process.env);

  const client = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
  const id = await client.mutation(api.profiles.upsertOwnerProfile, {
    handle: env.PING402_OWNER_HANDLE,
    displayName: env.PING402_OWNER_DISPLAY_NAME,
    ownerWallet: env.NEXT_PUBLIC_WALLET_ADDRESS,
    bio: env.PING402_OWNER_BIO,
  });

  // eslint-disable-next-line no-console
  console.log("Seeded/updated owner profile:", id);
  // eslint-disable-next-line no-console
  console.log(
    "Public URL:",
    `http://localhost:3000/u/${encodeURIComponent(env.PING402_OWNER_HANDLE)}`
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
