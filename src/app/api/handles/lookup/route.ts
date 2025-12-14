import { NextResponse } from "next/server";

import { getProfileByHandle } from "@/lib/db/convex/server";
import { parseHandle } from "@/lib/utils/handles";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const handle = parseHandle(url.searchParams.get("handle") ?? "");
  if (!handle) {
    return NextResponse.json({ error: { code: "INVALID_HANDLE" } }, { status: 400 });
  }

  const profile = await getProfileByHandle(handle);
  if (!profile) return NextResponse.json({ exists: false, handle });

  return NextResponse.json({
    exists: true,
    handle: profile.handle,
    ownerWallet: profile.ownerWallet,
    displayName: profile.displayName,
  });
}
