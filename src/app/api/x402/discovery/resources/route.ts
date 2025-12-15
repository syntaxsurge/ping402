import { NextRequest, NextResponse } from "next/server";
import { withBazaar } from "@x402/extensions/bazaar";
import { z } from "zod";

import { getEnvServer } from "@/lib/env/env.server";
import { getX402FacilitatorClient } from "@/lib/x402/facilitator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const QuerySchema = z.object({
  type: z.string().optional().default("http"),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  offset: z.coerce.number().int().min(0).optional(),
  cursor: z.coerce.number().int().min(0).optional(),
});

export async function GET(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? "unknown";
  const env = getEnvServer();
  const parsed = QuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams.entries())
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "INVALID_QUERY", issues: parsed.error.issues }, requestId },
      { status: 400 }
    );
  }

  const offset = parsed.data.offset ?? parsed.data.cursor;

  try {
    const facilitator = withBazaar(getX402FacilitatorClient());
    const data = await facilitator.extensions.discovery.listResources({
      type: parsed.data.type,
      limit: parsed.data.limit,
      offset,
    });

    return NextResponse.json({
      ok: true,
      facilitatorUrl: env.X402_FACILITATOR_URL,
      requestId,
      data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Facilitator request failed.";
    return NextResponse.json(
      {
        ok: false,
        facilitatorUrl: env.X402_FACILITATOR_URL,
        requestId,
        error: { code: "FACILITATOR_REQUEST_FAILED", message },
      },
      { status: 502 },
    );
  }
}
