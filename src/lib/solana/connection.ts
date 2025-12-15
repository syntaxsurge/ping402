import "server-only";

import { Connection, clusterApiUrl } from "@solana/web3.js";

import { getEnvServer } from "@/lib/env/env.server";
import { isSolanaDevnet } from "@/lib/solana/chain";

let cached: Connection | undefined;

export function getSolanaConnection(): Connection {
  if (cached) return cached;

  const env = getEnvServer();
  const endpoint =
    env.SOLANA_RPC_URL ??
    clusterApiUrl(isSolanaDevnet(env.X402_NETWORK) ? "devnet" : "mainnet-beta");

  cached = new Connection(endpoint, {
    commitment: "confirmed",
    wsEndpoint: env.SOLANA_WS_URL,
  });
  return cached;
}
