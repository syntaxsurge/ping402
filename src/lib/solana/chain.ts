export type Ping402SolanaNetwork = "solana-devnet" | "solana";

export function solanaChainIdForNetwork(network: Ping402SolanaNetwork): string {
  switch (network) {
    case "solana-devnet":
      return "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";
    case "solana":
      return "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
  }
}

