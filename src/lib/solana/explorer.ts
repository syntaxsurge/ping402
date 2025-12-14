import bs58 from "bs58";

export type SolanaNetwork = "solana-devnet" | "solana";

export function isSolanaTxSignature(signature: string): boolean {
  try {
    return bs58.decode(signature).length === 64;
  } catch {
    return false;
  }
}

export function solanaExplorerTxUrl(signature: string, network: SolanaNetwork): string {
  const url = new URL(`https://explorer.solana.com/tx/${encodeURIComponent(signature)}`);
  if (network === "solana-devnet") url.searchParams.set("cluster", "devnet");
  return url.toString();
}
