#!/usr/bin/env tsx

import "dotenv/config";

import { readFile } from "node:fs/promises";

import bs58 from "bs58";
import { z } from "zod";
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactSvmScheme } from "@x402/svm/exact/client";
import { createKeyPairSignerFromBytes } from "@solana/kit";

type FetchWithPayment = ReturnType<typeof wrapFetchWithPayment>;

const EnvSchema = z
  .object({
    PING402_BASE_URL: z.string().url().default("http://localhost:3000"),

    PING402_BUYER_SECRET_KEY: z.string().optional(),
    PING402_BUYER_KEYPAIR_PATH: z.string().optional(),

    PING402_DISCOVERY_URL: z.string().url().optional(),

    PING402_BUYER_MODE: z.enum(["demo", "ping"]).optional().default("demo"),

    PING402_TO_HANDLE: z.string().optional(),
    PING402_MESSAGE: z.string().optional(),
    PING402_TIER: z.enum(["standard", "priority", "vip"]).optional().default("standard"),
    PING402_SENDER_NAME: z.string().optional(),
    PING402_SENDER_CONTACT: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    if (!env.PING402_BUYER_SECRET_KEY && !env.PING402_BUYER_KEYPAIR_PATH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["PING402_BUYER_SECRET_KEY"],
        message: "Set PING402_BUYER_SECRET_KEY or PING402_BUYER_KEYPAIR_PATH.",
      });
    }

    if (env.PING402_BUYER_MODE === "ping" && !env.PING402_TO_HANDLE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["PING402_TO_HANDLE"],
        message: "Set PING402_TO_HANDLE when PING402_BUYER_MODE=ping.",
      });
    }

    if (env.PING402_BUYER_MODE === "ping" && !env.PING402_MESSAGE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["PING402_MESSAGE"],
        message: "Set PING402_MESSAGE when PING402_BUYER_MODE=ping.",
      });
    }
  });

type Env = z.infer<typeof EnvSchema>;

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

async function loadBuyerKeypair(env: Env): Promise<Uint8Array> {
  if (env.PING402_BUYER_SECRET_KEY) return parseSecretKey(env.PING402_BUYER_SECRET_KEY);

  if (env.PING402_BUYER_KEYPAIR_PATH) {
    const file = await readFile(env.PING402_BUYER_KEYPAIR_PATH, "utf8");
    const parsed = JSON.parse(file) as unknown;
    if (!Array.isArray(parsed) || parsed.some((v) => typeof v !== "number")) {
      throw new Error("Buyer keypair file must be a JSON array of numbers.");
    }
    const bytes = new Uint8Array(parsed);
    if (bytes.length !== 64) {
      throw new Error("Buyer keypair file must contain 64 secret key bytes.");
    }
    return bytes;
  }

  throw new Error("Buyer keypair not configured.");
}

function formatBody(text: string): string {
  return text.length > 4000 ? `${text.slice(0, 4000)}…` : text;
}

function extractDiscoveredUrls(raw: unknown): string[] {
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;

  const tryFromArray = (value: unknown, field: "url" | "resourceUrl" | "resource") => {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>)[field] : null))
      .filter((v): v is string => typeof v === "string");
  };

  return [
    ...tryFromArray(obj.resources, "url"),
    ...tryFromArray(obj.resources, "resourceUrl"),
    ...tryFromArray(obj.resources, "resource"),
    ...tryFromArray(obj.items, "url"),
    ...tryFromArray(obj.items, "resourceUrl"),
    ...tryFromArray(obj.items, "resource"),
  ];
}

async function discover(baseUrl: string, discoveryUrl?: string): Promise<string[]> {
  const url =
    discoveryUrl ??
    new URL("/api/x402/discovery/resources?type=http&limit=200", baseUrl).toString();

  try {
    const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
    const contentType = res.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json") ? await res.json() : await res.text();

    const raw = (() => {
      if (body && typeof body === "object" && !Array.isArray(body)) {
        const record = body as Record<string, unknown>;
        if ("data" in record) return record.data;
      }
      return body;
    })();
    const urls = extractDiscoveredUrls(raw);
    const matching = urls.filter((item) => item.startsWith(baseUrl));

    console.log("Discovery URL:", url);
    console.log("Discovered resources:", urls.length);
    console.log("Matching this app:", matching.length);
    for (const item of matching.slice(0, 8)) {
      console.log("-", item);
    }
    return matching;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Discovery failed.";
    console.log("Discovery failed:", message);
    return [];
  }
}

async function callDemo(fetchWithPayment: FetchWithPayment, endpointUrl: string) {
  const url = new URL(endpointUrl);
  const res = await fetchWithPayment(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const text = await res.text();
  console.log("GET", url.toString());
  console.log("status", res.status);
  console.log(formatBody(text));
}

async function callPing(fetchWithPayment: FetchWithPayment, endpointUrl: string, env: Env) {
  const url = new URL(endpointUrl);
  url.searchParams.set("tier", env.PING402_TIER);

  const res = await fetchWithPayment(url.toString(), {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      to: env.PING402_TO_HANDLE,
      body: env.PING402_MESSAGE,
      senderName: env.PING402_SENDER_NAME,
      senderContact: env.PING402_SENDER_CONTACT,
    }),
  });

  const text = await res.text();
  console.log("POST", url.toString());
  console.log("status", res.status);
  console.log(formatBody(text));
}

async function main() {
  const env = EnvSchema.parse(process.env);

  const secretKeyBytes = await loadBuyerKeypair(env);
  const signer = await createKeyPairSignerFromBytes(secretKeyBytes);

  const client = new x402Client();
  registerExactSvmScheme(client, { signer });

  const fetchWithPayment = wrapFetchWithPayment(fetch, client);

  console.log("Buyer wallet:", signer.address.toString());
  console.log("Base URL:", env.PING402_BASE_URL);
  console.log("Mode:", env.PING402_BUYER_MODE);

  const discovered = await discover(env.PING402_BASE_URL, env.PING402_DISCOVERY_URL);

  if (env.PING402_BUYER_MODE === "ping") {
    const discoveredPing = discovered.find((item) => new URL(item).pathname === "/api/ping/send");
    const fallbackPing = new URL("/api/ping/send", env.PING402_BASE_URL).toString();
    await callPing(fetchWithPayment, discoveredPing ?? fallbackPing, env);
    return;
  }

  const discoveredDemo = discovered.find((item) => new URL(item).pathname === "/api/x402/demo");
  const fallbackDemo = new URL("/api/x402/demo", env.PING402_BASE_URL).toString();
  await callDemo(fetchWithPayment, discoveredDemo ?? fallbackDemo);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
