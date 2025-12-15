"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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
};

type IntentStatusResponse =
  | {
      ok: true;
      status: "pending";
      intentId: string;
    }
  | {
      ok: true;
      status: "confirmed" | "consumed";
      intentId: string;
      payer: string | null;
      paymentTxSig: string | null;
      explorerUrl: string | null;
      consumedMessageId: string | null;
    };

type ConsumeResponse = {
  ok: true;
  messageId: string;
  redirectUrl: string;
  paymentTxSig: string | null;
};

export function SolanaPayPingSheet({
  formId,
  toHandle,
  tier,
  disabled,
}: {
  formId: string;
  toHandle: string;
  tier: "standard" | "priority" | "vip";
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [consuming, setConsuming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<CreateIntentResponse | null>(null);
  const [status, setStatus] = useState<IntentStatusResponse | null>(null);

  const pollTimer = useRef<number | null>(null);

  const sheetDisabled = disabled || !toHandle;

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
    setConfirming(false);
    setConsuming(false);
    setError(null);
    setIntent(null);
    setStatus(null);
  }, []);

  const openSheet = useCallback(() => {
    setOpen(true);
    reset();
  }, [reset]);

  const closeSheet = useCallback(() => {
    setOpen(false);
  }, []);

  async function createIntentFromForm() {
    setError(null);
    setCreating(true);
    try {
      const form = document.getElementById(formId);
      if (!(form instanceof HTMLFormElement)) {
        throw new Error("Form not found.");
      }

      const data = new FormData(form);
      const body = String(data.get("body") ?? "").trim();
      const senderName = String(data.get("senderName") ?? "").trim();
      const senderContact = String(data.get("senderContact") ?? "").trim();

      if (!body) {
        throw new Error("Message is required.");
      }

      const res = await fetch("/api/solana-pay/ping-intents", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          toHandle,
          tier,
          body,
          senderName: senderName || undefined,
          senderContact: senderContact || undefined,
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

  const confirmed = status?.ok && (status.status === "confirmed" || status.status === "consumed");

  async function consumeIntent() {
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
    } finally {
      setConsuming(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    void createIntentFromForm().catch((e) => {
      const msg = e instanceof Error ? e.message : "Request failed.";
      setError(msg);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={sheetDisabled}
        onClick={openSheet}
      >
        Pay with Solana Pay (QR)
      </Button>

      <Sheet open={open} onOpenChange={(next) => (next ? setOpen(true) : closeSheet())}>
        <SheetContent side="right" className="w-full max-w-md">
          <SheetHeader>
            <SheetTitle>Solana Pay checkout</SheetTitle>
            <SheetDescription>
              Scan the QR code with any Solana wallet to pay and deliver your ping.
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
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-muted-foreground">Amount</div>
                    <div className="font-medium">{intent.amount}</div>
                  </div>
                  <div className="mt-2 break-all font-mono text-[11px] text-muted-foreground">
                    mint {intent.asset}
                  </div>
                </div>

                <div className="flex justify-center rounded-md border bg-white p-4">
                  <QRCode value={intent.solanaPayUrl} size={220} />
                </div>

                <div className="flex flex-col gap-2">
                  <Button asChild>
                    <a href={intent.solanaPayUrl} target="_blank" rel="noreferrer">
                      {payLinkLabel}
                    </a>
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => void createIntentFromForm()}>
                    Restart checkout
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-muted-foreground">Status</div>
                    <div className="font-medium">
                      {confirmed ? "Payment confirmed" : confirming ? "Waiting for payment…" : "Pending"}
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
                </div>

                <Separator />

                <div className="flex flex-col gap-2">
                  <Button type="button" disabled={!confirmed || consuming} onClick={() => void consumeIntent()}>
                    {consuming ? "Delivering…" : "Deliver ping"}
                  </Button>
                  <Button type="button" variant="outline" onClick={closeSheet}>
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
