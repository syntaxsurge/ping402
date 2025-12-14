import "server-only";

import { createCdpAuthHeaders } from "@coinbase/x402";
import { HTTPFacilitatorClient, type FacilitatorConfig } from "@x402/core/server";

import { getEnvServer } from "@/lib/env/env.server";

const CDP_FACILITATOR_URL = "https://api.cdp.coinbase.com/platform/v2/x402";

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/$/, "");
}

let cached: HTTPFacilitatorClient | undefined;

export function getX402FacilitatorClient(): HTTPFacilitatorClient {
  if (cached) return cached;

  const env = getEnvServer();
  const url = normalizeUrl(env.X402_FACILITATOR_URL);

  const config: FacilitatorConfig = { url };

  if (url === CDP_FACILITATOR_URL) {
    config.createAuthHeaders = createCdpAuthHeaders(
      env.CDP_API_KEY_ID,
      env.CDP_API_KEY_SECRET,
    );
  }

  cached = new HTTPFacilitatorClient(config);
  return cached;
}
