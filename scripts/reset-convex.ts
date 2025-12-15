#!/usr/bin/env tsx

import { readFile } from "node:fs/promises";

import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";

type LoadedFrom = "env" | ".env" | ".env.local";

async function loadEnvFiles(): Promise<void> {
  const loadedFrom = new Map<string, LoadedFrom>();

  const applyLine = (rawLine: string, source: LoadedFrom) => {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) return;

    const idx = line.indexOf("=");
    if (idx <= 0) return;

    const key = line.slice(0, idx).trim();
    if (!key) return;

    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] !== undefined && loadedFrom.get(key) === "env") return;
    process.env[key] = value;
    loadedFrom.set(key, source);
  };

  const load = async (path: ".env" | ".env.local") => {
    try {
      const file = await readFile(path, "utf8");
      for (const line of file.split(/\r?\n/)) applyLine(line, path);
    } catch {
      // Ignore missing env files.
    }
  };

  for (const [key] of Object.entries(process.env)) loadedFrom.set(key, "env");

  await load(".env");
  await load(".env.local");
}

function resolveConvexUrl(): string {
  const candidates = [process.env.CONVEX_DEPLOYMENT, process.env.NEXT_PUBLIC_CONVEX_URL];

  const url = candidates.find((value) => typeof value === "string" && value.trim().length > 0);
  if (!url) {
    throw new Error("Set NEXT_PUBLIC_CONVEX_URL before running convex:reset.");
  }

  const normalized = url.trim();
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }

  if (normalized.startsWith("dev:")) {
    return process.env.NEXT_PUBLIC_CONVEX_URL ?? "http://127.0.0.1:8000";
  }

  throw new Error(
    `Unsupported Convex deployment value "${normalized}". Provide an https:// URL or dev: identifier.`,
  );
}

async function main() {
  await loadEnvFiles();

  const url = resolveConvexUrl();
  const secret = process.env.CONVEX_RESET_TOKEN?.trim();
  const batchSize = Number(process.env.CONVEX_RESET_BATCH ?? "128");

  if (!secret) {
    throw new Error("Set CONVEX_RESET_TOKEN in .env.local before running convex:reset.");
  }

  const client = new ConvexHttpClient(url);
  console.log(`Resetting Convex deployment at ${url}…`);
  const result = (await client.mutation(anyApi.admin.truncateAll, {
    secret,
    batchSize,
  })) as Record<string, number>;

  console.log("Truncated tables:");
  for (const [table, count] of Object.entries(result)) {
    console.log(`- ${table}: ${count} rows deleted`);
  }
  console.log("Convex reset complete.");
}

main().catch((error) => {
  console.error("Failed to reset Convex deployment:", error);
  process.exitCode = 1;
});
