import { NextResponse } from "next/server";

import { clearOwnerSession } from "@/lib/auth/ownerSession";

export async function POST(req: Request) {
  await clearOwnerSession();

  const requestId = req.headers.get("x-request-id") ?? "unknown";
  const wantsHtml = (req.headers.get("accept") ?? "").includes("text/html");

  if (wantsHtml) {
    return NextResponse.redirect(new URL("/", req.url), 303);
  }

  return NextResponse.json({ ok: true, requestId });
}

