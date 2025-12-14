import "server-only";

import { x402ResourceServer } from "@x402/core/server";
import { registerExactSvmScheme } from "@x402/svm/exact/server";

import { getX402FacilitatorClient } from "@/lib/x402/facilitator";

let cached: x402ResourceServer | undefined;

export function getX402Server(): x402ResourceServer {
  if (cached) return cached;

  const server = new x402ResourceServer(getX402FacilitatorClient());
  registerExactSvmScheme(server);

  cached = server;
  return cached;
}

