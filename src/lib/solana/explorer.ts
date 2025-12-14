import bs58 from "bs58";

import { isSolanaDevnet, type Ping402SvmNetwork } from "@/lib/solana/chain";

export function isSolanaTxSignature(signature: string): boolean {
  try {
    return bs58.decode(signature).length === 64;
  } catch {
    return false;
  }
}

export function solanaExplorerTxUrl(signature: string, network: Ping402SvmNetwork): string {
  const url = new URL(`https://explorer.solana.com/tx/${encodeURIComponent(signature)}`);
  if (isSolanaDevnet(network)) url.searchParams.set("cluster", "devnet");
  return url.toString();
}
