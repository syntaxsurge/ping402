"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";

import { clusterApiUrl } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";

import "@solana/wallet-adapter-react-ui/styles.css";

import { isSolanaDevnet, type Ping402SvmNetwork } from "@/lib/solana/chain";

function getWalletNetwork(networkId: Ping402SvmNetwork): WalletAdapterNetwork {
  return isSolanaDevnet(networkId) ? WalletAdapterNetwork.Devnet : WalletAdapterNetwork.Mainnet;
}

export function SolanaProvider({
  children,
  networkId,
}: {
  children: ReactNode;
  networkId: Ping402SvmNetwork;
}) {
  const network = getWalletNetwork(networkId);
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network })],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
