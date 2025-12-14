import { config as loadEnv } from "dotenv";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { nanoid } from "nanoid";
import { randomBytes } from "node:crypto";
import bs58 from "bs58";

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
  NEXT_PUBLIC_NETWORK: z.enum(["solana-devnet", "solana"]).default("solana-devnet"),

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

function randomSolanaPubkey(): string {
  return bs58.encode(randomBytes(32));
}

function demoTxSig(): string {
  return `demo_${nanoid(24)}`;
}

function demoXPayment(payer: string, paymentTxSig: string, network: string): string {
  return Buffer.from(
    JSON.stringify({
      payer,
      paymentTxSig,
      network,
      scheme: "exact",
      x402Version: 1,
      demo: true,
    })
  ).toString("base64");
}

async function main() {
  const env = EnvSchema.parse(process.env);
  const client = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);

  await client.mutation(api.profiles.upsertOwnerProfile, {
    handle: env.PING402_OWNER_HANDLE,
    displayName: env.PING402_OWNER_DISPLAY_NAME,
    ownerWallet: env.NEXT_PUBLIC_WALLET_ADDRESS,
    bio: env.PING402_OWNER_BIO,
  });

  const stats = await client.query(api.messages.getStatsForHandle, {
    handle: env.PING402_OWNER_HANDLE,
  });

  if ((stats?.totalMessages ?? 0) > 0) {
    // eslint-disable-next-line no-console
    console.log("Demo seed skipped: inbox already has messages.");
    return;
  }

  const samples: Array<{
    tier: "standard" | "priority" | "vip";
    body: string;
    senderName?: string;
    senderContact?: string;
  }> = [
    {
      tier: "standard",
      body: "Quick question: are you open to a 15-min call next week?",
      senderName: "Alex",
      senderContact: "alex@example.com",
    },
    {
      tier: "priority",
      body: "I can send a concise proposal. What’s the best way to format it for review?",
      senderName: "Jamie",
      senderContact: "@jamie",
    },
    {
      tier: "vip",
      body: "If this is urgent: can you confirm receipt and next steps today?",
      senderName: "Morgan",
      senderContact: "morgan@example.com",
    },
  ];

  for (const sample of samples) {
    const payer = randomSolanaPubkey();
    const paymentTxSig = demoTxSig();

    await client.mutation(api.messages.createPaidForHandle, {
      toHandle: env.PING402_OWNER_HANDLE,
      tier: sample.tier,
      body: sample.body,
      senderName: sample.senderName,
      senderContact: sample.senderContact,
      payer,
      paymentTxSig,
      xPaymentB64: demoXPayment(payer, paymentTxSig, env.NEXT_PUBLIC_NETWORK),
      x402Network: env.NEXT_PUBLIC_NETWORK,
      x402Scheme: "exact",
      x402Version: 1,
    });
  }

  // eslint-disable-next-line no-console
  console.log("Seeded demo messages.");
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
