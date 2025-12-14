import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getEnvServer } from "@/lib/env/env.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const QuerySchema = z.object({
  type: z.string().optional().default("http"),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  offset: z.coerce.number().int().min(0).optional(),
  cursor: z.coerce.number().int().min(0).optional(),
});

export async function GET(req: NextRequest) {
  const env = getEnvServer();
  const parsed = QuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams.entries())
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "INVALID_QUERY", issues: parsed.error.issues } },
      { status: 400 }
    );
  }

  const base = env.NEXT_PUBLIC_FACILITATOR_URL.endsWith("/")
    ? env.NEXT_PUBLIC_FACILITATOR_URL
    : `${env.NEXT_PUBLIC_FACILITATOR_URL}/`;

  const url = new URL("discovery/resources", base);
  url.searchParams.set("type", parsed.data.type);
  url.searchParams.set("limit", String(parsed.data.limit));
  const offset = parsed.data.offset ?? parsed.data.cursor;
  if (typeof offset === "number") url.searchParams.set("offset", String(offset));

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  return NextResponse.json(
    {
      ok: res.ok,
      facilitatorUrl: env.NEXT_PUBLIC_FACILITATOR_URL,
      data: body,
    },
    { status: res.ok ? 200 : 502 }
  );
}
