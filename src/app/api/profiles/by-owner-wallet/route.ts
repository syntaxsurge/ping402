import { NextResponse } from "next/server";

import { getProfileByOwnerWallet } from "@/lib/db/convex/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const walletPubkey = (url.searchParams.get("walletPubkey") ?? "").trim();
  if (!walletPubkey || walletPubkey.length < 20) {
    return NextResponse.json({ error: { code: "INVALID_WALLET" } }, { status: 400 });
  }

  const profile = await getProfileByOwnerWallet(walletPubkey);
  if (!profile) return NextResponse.json({ profile: null });

  return NextResponse.json({
    profile: {
      handle: profile.handle,
      displayName: profile.displayName,
    },
  });
}

