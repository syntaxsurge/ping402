"use client";

import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { Button } from "@/components/ui/button";
import { useWalletModal } from "@/components/solana/WalletModal";

function shortAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function WalletConnectButton() {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const pubkeyBase58 = useMemo(() => publicKey?.toBase58() ?? null, [publicKey]);

  if (!connected || !pubkeyBase58) {
    return (
      <Button type="button" variant="brand" className="w-full" onClick={() => setVisible(true)}>
        Connect wallet
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <div className="text-sm font-medium">Wallet connected</div>
        <div className="font-mono text-xs text-muted-foreground" title={pubkeyBase58}>
          {shortAddress(pubkeyBase58)}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setVisible(true)}>
          Change
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void disconnect()}
        >
          Disconnect
        </Button>
      </div>
    </div>
  );
}
