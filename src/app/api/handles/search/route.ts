import { NextResponse } from "next/server";

import { getProfileByHandle } from "@/lib/db/convex/server";
import { isValidHandle, normalizeHandle } from "@/lib/utils/handles";

export const runtime = "nodejs";

type HandleSearchResult = {
  handle: string;
  exists: boolean;
  displayName?: string;
};

function buildSuggestions(base: string): string[] {
  const results = new Set<string>();
  const add = (value: string) => {
    if (value.length > 32) return;
    if (!isValidHandle(value)) return;
    results.add(value);
  };

  add(base);

  const suffixes = ["_hq", "_pro", "_vip", "_sol", "_x402", "_inbox", "_pay"] as const;
  for (const suffix of suffixes) {
    add(`${base}${suffix}`);
  }

  const prefixes = ["the_", "get_", "hi_"] as const;
  for (const prefix of prefixes) {
    add(`${prefix}${base}`);
  }

  return Array.from(results).slice(0, 10);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get("query") ?? "";
  const normalized = normalizeHandle(query);

  if (!normalized) {
    return NextResponse.json({ query, normalized, results: [] satisfies HandleSearchResult[] });
  }

  if (normalized.length < 3) {
    return NextResponse.json({
      query,
      normalized,
      error: { code: "TOO_SHORT" },
      results: [] satisfies HandleSearchResult[],
    });
  }

  if (normalized.length > 32) {
    return NextResponse.json({
      query,
      normalized,
      error: { code: "TOO_LONG" },
      results: [] satisfies HandleSearchResult[],
    });
  }

  if (!isValidHandle(normalized)) {
    return NextResponse.json({
      query,
      normalized,
      error: { code: "INVALID_HANDLE" },
      results: [] satisfies HandleSearchResult[],
    });
  }

  const suggestions = buildSuggestions(normalized);
  const profiles = await Promise.all(
    suggestions.map(async (handle) => {
      const profile = await getProfileByHandle(handle);
      if (!profile) return { handle, exists: false } satisfies HandleSearchResult;
      return {
        handle: profile.handle,
        exists: true,
        displayName: profile.displayName,
      } satisfies HandleSearchResult;
    })
  );

  return NextResponse.json({ query, normalized, results: profiles });
}

