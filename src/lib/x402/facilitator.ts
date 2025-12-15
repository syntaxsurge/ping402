import "server-only";

import { HTTPFacilitatorClient } from "@x402/core/server";

import { getEnvServer } from "@/lib/env/env.server";

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/$/, "");
}

let cached: HTTPFacilitatorClient | undefined;

export function getX402FacilitatorClient(): HTTPFacilitatorClient {
  if (cached) return cached;

  const env = getEnvServer();
  const url = normalizeUrl(env.X402_FACILITATOR_URL);

  cached = new HTTPFacilitatorClient({ url });
  return cached;
}
