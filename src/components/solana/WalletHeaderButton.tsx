"use client";

import { useMemo } from "react";
import { Wallet } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function shortAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function WalletHeaderButton() {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const pubkeyBase58 = useMemo(() => publicKey?.toBase58() ?? null, [publicKey]);

  if (!connected || !pubkeyBase58) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setVisible(true)}>
        <Wallet className="h-4 w-4" aria-hidden="true" />
        Connect
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="font-mono">
          {shortAddress(pubkeyBase58)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setVisible(true)}>Change wallet</DropdownMenuItem>
        <DropdownMenuItem onClick={() => void disconnect()}>Disconnect</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
