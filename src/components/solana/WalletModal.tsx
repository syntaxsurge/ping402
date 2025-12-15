"use client";

import { WalletReadyState } from "@solana/wallet-adapter-base";
import type { WalletName } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type WalletModalContextValue = {
  visible: boolean;
  setVisible: (next: boolean) => void;
};

const WalletModalContext = createContext<WalletModalContextValue | null>(null);

export function useWalletModal(): WalletModalContextValue {
  const ctx = useContext(WalletModalContext);
  if (!ctx) {
    throw new Error("useWalletModal must be used within WalletModalProvider");
  }
  return ctx;
}

function shortAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

function readyStateLabel(state: WalletReadyState) {
  if (state === WalletReadyState.Installed) return "Installed";
  if (state === WalletReadyState.Loadable) return "Available";
  if (state === WalletReadyState.NotDetected) return "Not installed";
  return "Unsupported";
}

function dedupeWallets<T extends { adapter: { name: string } }>(wallets: T[]) {
  const seen = new Set<string>();
  return wallets.filter((wallet) => {
    const key = wallet.adapter.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function WalletModal() {
  const { visible, setVisible } = useWalletModal();
  const {
    wallets,
    wallet,
    publicKey,
    connected,
    connecting,
    disconnecting,
    select,
    connect,
    disconnect,
  } = useWallet();

  const connectedAddress = useMemo(() => publicKey?.toBase58() ?? null, [publicKey]);

  const walletOptions = useMemo(() => {
    const unique = dedupeWallets(wallets);
    return unique.slice().sort((a, b) => {
      const score = (w: typeof a) =>
        w.readyState === WalletReadyState.Installed
          ? 0
          : w.readyState === WalletReadyState.Loadable
            ? 1
            : w.readyState === WalletReadyState.NotDetected
              ? 2
              : 3;
      return score(a) - score(b);
    });
  }, [wallets]);

  const [pendingWallet, setPendingWallet] = useState<WalletName | null>(null);

  const close = useCallback(() => {
    setVisible(false);
    setPendingWallet(null);
  }, [setVisible]);

  const handleSelect = useCallback(
    (walletName: WalletName, readyState: WalletReadyState, url?: string) => {
      if (readyState === WalletReadyState.NotDetected) {
        if (url) window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      setPendingWallet(walletName);
      select(walletName);
    },
    [select],
  );

  useEffect(() => {
    if (!visible) return;
    if (!pendingWallet) return;
    if (wallet?.adapter.name !== pendingWallet) return;
    if (connecting || connected) return;

    void connect()
      .then(() => close())
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Wallet connection failed.";
        toast.error(msg);
      })
      .finally(() => setPendingWallet(null));
  }, [close, connect, connected, connecting, pendingWallet, visible, wallet?.adapter.name]);

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" aria-hidden="true" />
            Connect a wallet
          </DialogTitle>
          <DialogDescription>
            Choose a Solana wallet to sign in, claim a handle, and pay for pings.
          </DialogDescription>
        </DialogHeader>

        {connectedAddress ? (
          <div className="rounded-xl border bg-muted/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">Connected</div>
                <div className="font-mono text-xs text-muted-foreground" title={connectedAddress}>
                  {shortAddress(connectedAddress)}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disconnecting}
                onClick={() =>
                  void disconnect()
                    .then(() => close())
                    .catch(() => toast.error("Failed to disconnect wallet."))
                }
              >
                Disconnect
              </Button>
            </div>
          </div>
        ) : null}

        <Separator />

        <ScrollArea className="h-[320px] pr-2">
          <div className="grid gap-2">
            {walletOptions.map((walletOption) => {
              const name = walletOption.adapter.name;
              const ready = walletOption.readyState;
              const isSelected = wallet?.adapter.name === name;
              const disabled =
                ready === WalletReadyState.Unsupported || connecting || disconnecting;

              return (
                <button
                  key={name}
                  type="button"
                  className="group flex w-full items-center justify-between gap-3 rounded-xl border bg-card/50 p-3 text-left shadow-sm outline-none transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:pointer-events-none disabled:opacity-60"
                  onClick={() => handleSelect(name, ready, walletOption.adapter.url)}
                  disabled={disabled}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border">
                      {walletOption.adapter.icon ? (
                        <AvatarImage src={walletOption.adapter.icon} alt="" />
                      ) : null}
                      <AvatarFallback className="text-xs font-semibold">
                        {String(name).slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">{name}</div>
                      <div className="text-xs text-muted-foreground">
                        {isSelected ? "Selected" : readyStateLabel(ready)}
                      </div>
                    </div>
                  </div>

                  <Badge variant={ready === WalletReadyState.Installed ? "default" : "secondary"}>
                    {readyStateLabel(ready)}
                  </Badge>
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={close}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function WalletModalProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const value = useMemo(() => ({ visible, setVisible }), [visible]);

  return (
    <WalletModalContext.Provider value={value}>
      {children}
      <WalletModal />
    </WalletModalContext.Provider>
  );
}
