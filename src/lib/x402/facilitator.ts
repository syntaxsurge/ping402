import "server-only";

import { createCdpAuthHeaders } from "@coinbase/x402";
import type { Resource, withX402 } from "x402-next";

import { getEnvServer } from "@/lib/env/env.server";

const CDP_FACILITATOR_URL = "https://api.cdp.coinbase.com/platform/v2/x402";

type FacilitatorConfig = NonNullable<Parameters<typeof withX402>[3]>;
type CreateHeaders = NonNullable<FacilitatorConfig["createAuthHeaders"]>;

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/$/, "");
}

export function getX402FacilitatorConfig(): FacilitatorConfig {
  const env = getEnvServer();
  const url = normalizeUrl(env.NEXT_PUBLIC_FACILITATOR_URL);

  if (url === CDP_FACILITATOR_URL) {
    const createAuthHeaders = createCdpAuthHeaders(
      env.CDP_API_KEY_ID,
      env.CDP_API_KEY_SECRET,
    ) as CreateHeaders;

    return {
      url: CDP_FACILITATOR_URL as Resource,
      createAuthHeaders,
    };
  }

  return { url: url as Resource };
}
