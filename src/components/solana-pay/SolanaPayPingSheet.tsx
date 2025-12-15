"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BigNumber from "bignumber.js";
import QRCode from "react-qr-code";
import { PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useWalletModal } from "@/components/solana/WalletModal";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getPingTierConfig, type PingTier } from "@/lib/ping/tiers";
import { buildSolanaPayTransferTransaction } from "@/lib/solana/pay";

type CreateIntentResponse = {
  ok: true;
  intentId: string;
  reference: string;
  solanaPayUrl: string;
  asset: string;
  amount: string;
  amountBaseUnits: string;
  assetDecimals: number;
  payTo: string;
  network: string;
  requestId: string;
};

type IntentStatusResponse =
  | {
      ok: true;
      status: "pending";
      intentId: string;
      requestId?: string;
    }
  | {
      ok: true;
      status: "confirmed" | "consumed";
      intentId: string;
      payer: string | null;
      paymentTxSig: string | null;
      explorerUrl: string | null;
      consumedMessageId: string | null;
      requestId?: string;
    };

type ConsumeResponse = {
  ok: true;
  messageId: string;
  redirectUrl: string;
  paymentTxSig: string | null;
  requestId: string;
};

function shortAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

function formatTokenBalance(baseUnits: bigint, decimals: number): string {
  const bn = new BigNumber(baseUnits.toString()).shiftedBy(-decimals);
  if (!bn.isFinite()) return "0";
  return bn.toFormat(decimals > 6 ? 6 : decimals);
}

export function SolanaPayPingSheet({
  toHandle,
  tier,
  body,
  senderName,
  senderContact,
  disabled,
}: {
  toHandle: string;
  tier: PingTier;
  body: string;
  senderName: string;
  senderContact: string;
  disabled?: boolean;
}) {
  const tierConfig = useMemo(() => getPingTierConfig(tier), [tier]);

  const { connection } = useConnection();
  const { publicKey, connected, sendTransaction } = useWallet();
  const { setVisible } = useWalletModal();

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [consuming, setConsuming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<CreateIntentResponse | null>(null);
  const [status, setStatus] = useState<IntentStatusResponse | null>(null);
  const [localTxSig, setLocalTxSig] = useState<string | null>(null);
  const [balances, setBalances] = useState<{
    solLamports: number;
    tokenBaseUnits: bigint;
  } | null>(null);
  const [balancesLoading, setBalancesLoading] = useState(false);

  const pollTimer = useRef<number | null>(null);

  const trimmedBody = body.trim();
  const trimmedSenderName = senderName.trim();
  const trimmedSenderContact = senderContact.trim();

  const sheetDisabled = disabled || !toHandle || !trimmedBody;

  const payLinkLabel = useMemo(() => {
    if (!intent) return "Open in wallet";
    return `Pay ${intent.amount} (Solana Pay)`;
  }, [intent]);

  const startPolling = useCallback((intentId: string) => {
    if (pollTimer.current) window.clearInterval(pollTimer.current);
    setConfirming(true);
    pollTimer.current = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/solana-pay/ping-intents/${encodeURIComponent(intentId)}`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return;
        const data = (await res.json()) as IntentStatusResponse;
        if (!data.ok) return;
        setStatus(data);
        if (data.status === "confirmed" || data.status === "consumed") {
          setConfirming(false);
          if (pollTimer.current) window.clearInterval(pollTimer.current);
          pollTimer.current = null;
        }
      } catch {
        // Ignore polling errors; user may retry.
      }
    }, 1500);
  }, []);

  useEffect(() => {
    return () => {
      if (pollTimer.current) window.clearInterval(pollTimer.current);
    };
  }, []);

  useEffect(() => {
    if (open) return;
    if (pollTimer.current) window.clearInterval(pollTimer.current);
    pollTimer.current = null;
  }, [open]);

  const reset = useCallback(() => {
    setCreating(false);
    setPaying(false);
    setConfirming(false);
    setConsuming(false);
    setError(null);
    setIntent(null);
    setStatus(null);
    setLocalTxSig(null);
    setBalances(null);
    setBalancesLoading(false);
  }, []);

  const openSheet = useCallback(() => {
    setOpen(true);
    reset();
  }, [reset]);

  const closeSheet = useCallback(() => {
    setOpen(false);
  }, []);

  async function createIntent() {
    setError(null);
    setCreating(true);
    try {
      if (!trimmedBody) {
        throw new Error("Message is required.");
      }

      const res = await fetch("/api/solana-pay/ping-intents", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          toHandle,
          tier,
          body: trimmedBody,
          senderName: trimmedSenderName || undefined,
          senderContact: trimmedSenderContact || undefined,
        }),
      });

      const json = (await res.json()) as { ok?: boolean; error?: { code?: string } };
      if (!res.ok || !json.ok) {
        const code = json.error?.code ?? "REQUEST_FAILED";
        throw new Error(code);
      }

      const created = json as CreateIntentResponse;
      setIntent(created);
      startPolling(created.intentId);
    } finally {
      setCreating(false);
    }
  }

  const paymentComplete = status?.ok && (status.status === "confirmed" || status.status === "consumed");

  const recipientAddress = intent?.payTo ?? null;

  const connectedAddress = useMemo(() => publicKey?.toBase58() ?? null, [publicKey]);

  const tokenBalanceText = useMemo(() => {
    if (!intent || !balances) return null;
    return formatTokenBalance(balances.tokenBaseUnits, intent.assetDecimals);
  }, [balances, intent]);

  const requiredTokenBalanceText = useMemo(() => {
    if (!intent) return null;
    return formatTokenBalance(BigInt(intent.amountBaseUnits), intent.assetDecimals);
  }, [intent]);

  const hasEnoughToken =
    Boolean(intent) && Boolean(balances) ? balances!.tokenBaseUnits >= BigInt(intent!.amountBaseUnits) : null;

  const payWithConnectedWallet = useCallback(async () => {
    if (!intent) return;

    setError(null);

    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }

    if (!sendTransaction) {
      setError("This wallet does not support sending transactions.");
      return;
    }

    setPaying(true);
    try {
      const tx = await buildSolanaPayTransferTransaction({
        connection,
        payer: publicKey,
        recipient: intent.payTo,
        splToken: intent.asset,
        amountBaseUnits: intent.amountBaseUnits,
        assetDecimals: intent.assetDecimals,
        reference: intent.reference,
        memo: `ping402:intent:${intent.intentId}`,
      });

      const sig = await sendTransaction(tx, connection, { preflightCommitment: "confirmed" });
      setLocalTxSig(sig);

      try {
        await connection.confirmTransaction(sig, "confirmed");
      } catch {
        // We'll still rely on the server-side reference poll to settle.
      }

      startPolling(intent.intentId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Payment failed.";
      setError(message);
    } finally {
      setPaying(false);
    }
  }, [connected, connection, intent, publicKey, sendTransaction, setVisible, startPolling]);

  const consumeIntent = useCallback(async () => {
    if (!intent) return;
    setError(null);
    setConsuming(true);
    try {
      const res = await fetch(
        `/api/solana-pay/ping-intents/${encodeURIComponent(intent.intentId)}/consume`,
        { method: "POST", headers: { Accept: "application/json" } },
      );

      const json = (await res.json()) as ConsumeResponse | { error?: { code?: string } };
      if (!res.ok || !("ok" in json) || !json.ok) {
        const code = "error" in json ? json.error?.code ?? "REQUEST_FAILED" : "REQUEST_FAILED";
        throw new Error(code);
      }

      window.location.assign(json.redirectUrl);
      return;
    } finally {
      setConsuming(false);
    }
  }, [intent]);

  useEffect(() => {
    if (!open) return;
    void createIntent().catch((e) => {
      const msg = e instanceof Error ? e.message : "Request failed.";
      setError(msg);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!intent) return;

    if (!publicKey) {
      setBalances(null);
      return;
    }

    let cancelled = false;
    setBalancesLoading(true);

    void (async () => {
      try {
        const mint = new PublicKey(intent.asset);

        const [solLamports, tokenAccounts] = await Promise.all([
          connection.getBalance(publicKey, "confirmed"),
          connection.getParsedTokenAccountsByOwner(publicKey, { mint }, "confirmed"),
        ]);

        let tokenBaseUnits = BigInt(0);
        for (const item of tokenAccounts.value) {
          const parsed = item.account.data.parsed as unknown;
          const amount = (parsed as { info?: { tokenAmount?: { amount?: string } } })?.info
            ?.tokenAmount?.amount;
          if (typeof amount === "string") {
            tokenBaseUnits += BigInt(amount);
          }
        }

        if (cancelled) return;
        setBalances({ solLamports, tokenBaseUnits });
      } catch {
        if (cancelled) return;
        setBalances(null);
      } finally {
        if (cancelled) return;
        setBalancesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [connection, intent, open, publicKey]);

  useEffect(() => {
    if (!open) return;
    if (!intent) return;
    if (!status?.ok) return;

    if (status.status === "consumed" && status.consumedMessageId) {
      const url = new URL(`/u/${encodeURIComponent(toHandle)}`, window.location.origin);
      url.searchParams.set("sent", "1");
      url.searchParams.set("r", status.consumedMessageId);
      if (status.paymentTxSig) url.searchParams.set("tx", status.paymentTxSig);
      window.location.assign(url.toString());
      return;
    }

    if (status.status !== "confirmed") return;
    if (consuming) return;
    void consumeIntent();
  }, [consumeIntent, consuming, intent, open, status, toHandle]);

  return (
    <>
      <Button
        type="button"
        variant="brand"
        className="w-full"
        disabled={sheetDisabled}
        onClick={openSheet}
      >
        Pay &amp; send ping
      </Button>

      <Sheet open={open} onOpenChange={(next) => (next ? setOpen(true) : closeSheet())}>
        <SheetContent side="right" className="w-full max-w-md">
          <SheetHeader>
            <div className="flex items-center justify-between gap-3">
              <SheetTitle>Checkout</SheetTitle>
              <Badge variant="secondary">Solana Pay</Badge>
            </div>
            <SheetDescription>
              Pay <span className="font-mono">@{toHandle}</span> for a{" "}
              <span className="font-medium">{tierConfig.label}</span> ping.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {error ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                {error}
              </div>
            ) : null}

            {creating ? (
              <div className="text-sm text-muted-foreground">Creating checkout…</div>
            ) : null}

            {intent ? (
              <div className="space-y-4">
                <Card className="bg-muted/20">
                  <CardContent className="space-y-3 p-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-muted-foreground">Amount</div>
                      <div className="font-semibold tabular-nums">{intent.amount}</div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-muted-foreground">Tier</div>
                      <div className="font-medium">{tierConfig.label}</div>
                    </div>
                    <Separator />
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Recipient</div>
                      <div className="break-all font-mono text-xs" title={recipientAddress ?? undefined}>
                        {recipientAddress ? shortAddress(recipientAddress) : "—"}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Asset mint</div>
                      <div className="break-all font-mono text-[11px] text-muted-foreground">
                        {intent.asset}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/20">
                  <CardContent className="space-y-3 p-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">Wallet</div>
                      {connectedAddress ? (
                        <Button type="button" variant="ghost" size="sm" onClick={() => setVisible(true)}>
                          Change
                        </Button>
                      ) : (
                        <Button type="button" variant="outline" size="sm" onClick={() => setVisible(true)}>
                          Connect
                        </Button>
                      )}
                    </div>

                    {connectedAddress ? (
                      <div className="space-y-1">
                        <div className="break-all font-mono text-xs" title={connectedAddress}>
                          {connectedAddress}
                        </div>
                        {balancesLoading ? (
                          <div className="text-xs text-muted-foreground">Loading balance…</div>
                        ) : balances && tokenBalanceText && requiredTokenBalanceText ? (
                          <div className="text-xs text-muted-foreground">
                            Balance {tokenBalanceText} · Required {requiredTokenBalanceText}
                            {hasEnoughToken === false ? (
                              <span className="text-destructive"> · Insufficient</span>
                            ) : null}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            Balance unavailable. You can still try paying.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        Connect a wallet to pay in-app, or use the QR code to pay from any wallet.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="brand"
                    disabled={
                      paying ||
                      consuming ||
                      !intent ||
                      !connected ||
                      !publicKey ||
                      Boolean(hasEnoughToken === false)
                    }
                    onClick={() => void payWithConnectedWallet()}
                  >
                    {paying ? "Approve in wallet…" : "Pay with connected wallet"}
                  </Button>

                  <Button asChild variant="outline" disabled={!intent.solanaPayUrl || paying || consuming}>
                    <a href={intent.solanaPayUrl} target="_blank" rel="noreferrer">
                      {payLinkLabel}
                    </a>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    disabled={creating || paying || consuming}
                    onClick={() => void createIntent()}
                  >
                    Restart checkout
                  </Button>
                </div>

                <div className="flex justify-center rounded-md border bg-background p-4">
                  <QRCode value={intent.solanaPayUrl} size={220} />
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-muted-foreground">Status</div>
                    <div className="font-medium">
                      {paymentComplete
                        ? "Payment confirmed"
                        : confirming
                          ? "Waiting for payment…"
                          : "Pending"}
                    </div>
                  </div>
                  {status?.ok && status.status !== "pending" && status.explorerUrl ? (
                    <a
                      className="block break-all font-mono text-xs text-primary underline-offset-4 hover:underline"
                      href={status.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {status.paymentTxSig}
                    </a>
                  ) : null}
                  {!status?.ok && localTxSig ? (
                    <div className="break-all font-mono text-xs text-muted-foreground">
                      {localTxSig}
                    </div>
                  ) : null}
                </div>

                <Separator />

                <div className="flex flex-col gap-2 text-sm">
                  {paymentComplete ? (
                    <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                      {consuming ? "Delivering ping…" : "Finalizing delivery…"}
                    </div>
                  ) : null}
                  <Button type="button" variant="outline" onClick={closeSheet} disabled={paying || consuming}>
                    Close
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
