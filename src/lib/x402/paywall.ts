import "server-only";

import { createPaywall, svmPaywall } from "@x402/paywall";
import type { PaywallConfig, PaywallProvider } from "@x402/core/server";

import { siteConfig } from "@/lib/config/site";
import { getEnvServer } from "@/lib/env/env.server";
import { SOLANA_DEVNET_CHAIN_ID } from "@/lib/solana/chain";

let cachedPaywall: PaywallProvider | undefined;

export function getX402PaywallProvider(): PaywallProvider {
  if (cachedPaywall) return cachedPaywall;

  cachedPaywall = createPaywall().withNetwork(svmPaywall).build() as PaywallProvider;
  return cachedPaywall;
}

export function getX402PaywallConfig(): PaywallConfig {
  const env = getEnvServer();

  return {
    appName: siteConfig.name,
    appLogo: "/favicon.ico",
    testnet: env.X402_NETWORK === SOLANA_DEVNET_CHAIN_ID,
  };
}
