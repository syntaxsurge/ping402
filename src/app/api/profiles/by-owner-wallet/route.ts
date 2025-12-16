import { NextResponse } from "next/server";

import { getProfileByOwnerWallet } from "@/lib/db/convex/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const requestId = req.headers.get("x-request-id") ?? "unknown";
  const url = new URL(req.url);
  const walletPubkey = (url.searchParams.get("walletPubkey") ?? "").trim();
  if (!walletPubkey || walletPubkey.length < 20) {
    return NextResponse.json(
      { error: { code: "INVALID_WALLET" }, requestId },
      { status: 400 },
    );
  }

  let profile: Awaited<ReturnType<typeof getProfileByOwnerWallet>> | null;
  try {
    profile = await getProfileByOwnerWallet(walletPubkey);
  } catch {
    return NextResponse.json(
      { error: { code: "PROFILE_LOOKUP_UNAVAILABLE" }, requestId },
      { status: 503, headers: { "retry-after": "1" } },
    );
  }
  if (!profile) return NextResponse.json({ profile: null });

  return NextResponse.json({
    profile: {
      handle: profile.handle,
      displayName: profile.displayName,
    },
  });
}
