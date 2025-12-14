import type { Network } from "@x402/core/types";

export type Ping402SolanaNetwork = "solana-devnet" | "solana";

export function solanaChainIdForNetwork(network: Ping402SolanaNetwork): Network {
  switch (network) {
    case "solana-devnet":
      return "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";
    case "solana":
      return "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
  }
}
