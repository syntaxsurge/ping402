import "server-only";

import { declareDiscoveryExtension } from "@x402/extensions/bazaar";

type DiscoveryOutput = { example?: unknown; schema?: Record<string, unknown> };

export function declareBazaarBodyDiscoveryExtension(config: {
  bodyType: "json" | "form-data" | "text";
  input?: Record<string, unknown>;
  inputSchema?: Record<string, unknown>;
  output?: DiscoveryOutput;
}): ReturnType<typeof declareDiscoveryExtension> {
  return declareDiscoveryExtension(
    config as unknown as Parameters<typeof declareDiscoveryExtension>[0],
  );
}
