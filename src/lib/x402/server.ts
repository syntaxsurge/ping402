import "server-only";

import { x402ResourceServer } from "@x402/core/server";
import { bazaarResourceServerExtension } from "@x402/extensions/bazaar";
import { registerExactSvmScheme } from "@x402/svm/exact/server";

import { getX402FacilitatorClient } from "@/lib/x402/facilitator";

let cached: x402ResourceServer | undefined;
let initPromise: Promise<void> | undefined;

export function getX402Server(): x402ResourceServer {
  if (cached) return cached;

  const server = new x402ResourceServer(getX402FacilitatorClient());
  server.registerExtension(bazaarResourceServerExtension);
  registerExactSvmScheme(server);

  cached = server;
  return cached;
}

export async function getX402ServerInitialized(): Promise<x402ResourceServer> {
  const server = getX402Server();
  if (!initPromise) {
    initPromise = server.initialize();
  }
  await initPromise;
  return server;
}
