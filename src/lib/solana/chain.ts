export const SOLANA_DEVNET_CHAIN_ID = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1" as const;
export const SOLANA_MAINNET_CHAIN_ID = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" as const;

export type Ping402SvmNetwork = typeof SOLANA_DEVNET_CHAIN_ID | typeof SOLANA_MAINNET_CHAIN_ID;

export function isPing402SvmNetwork(value: string): value is Ping402SvmNetwork {
  return value === SOLANA_DEVNET_CHAIN_ID || value === SOLANA_MAINNET_CHAIN_ID;
}

export function isSolanaDevnet(network: Ping402SvmNetwork): boolean {
  return network === SOLANA_DEVNET_CHAIN_ID;
}

export function solanaNetworkLabel(network: Ping402SvmNetwork): "devnet" | "mainnet" {
  return isSolanaDevnet(network) ? "devnet" : "mainnet";
}
