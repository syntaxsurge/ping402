"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SolanaPayPingSheet } from "@/components/solana-pay/SolanaPayPingSheet";
import { type PingTier, getPingTierConfig } from "@/lib/ping/tiers";

export function PingComposeFormClient({
  toHandle,
  tier,
  recipient,
  error,
}: {
  toHandle: string;
  tier: PingTier;
  recipient: { handle: string; displayName: string } | null;
  error?: string;
}) {
  const tierConfig = useMemo(() => getPingTierConfig(tier), [tier]);

  const [senderName, setSenderName] = useState("");
  const [senderContact, setSenderContact] = useState("");
  const [body, setBody] = useState("");

  const canPay = Boolean(recipient) && Boolean(toHandle) && Boolean(body.trim());

  return (
    <div className="space-y-4">
      {error ? (
        <p className="text-sm text-destructive">Please check the form and try again.</p>
      ) : null}

      {!toHandle ? (
        <p className="text-sm text-muted-foreground">
          Go to a profile page and pick a tier to start.
        </p>
      ) : (
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <Label htmlFor="senderName">Your name (optional)</Label>
            <Input
              id="senderName"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="e.g. Alex"
              maxLength={80}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senderContact">Contact (optional)</Label>
            <Input
              id="senderContact"
              value={senderContact}
              onChange={(e) => setSenderContact(e.target.value)}
              placeholder="e.g. @alex or email"
              maxLength={120}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your ping…"
              required
              maxLength={280}
            />
            <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
              <div>
                Paying uses your connected wallet, or you can scan a QR code from any Solana
                wallet.
              </div>
              <div className="tabular-nums">{body.length}/280</div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <SolanaPayPingSheet
              toHandle={toHandle}
              tier={tier}
              body={body}
              senderName={senderName}
              senderContact={senderContact}
              disabled={!recipient}
            />
          </div>

          {!recipient ? (
            <p className="text-xs text-destructive">
              Recipient not found. Pick a different handle.
            </p>
          ) : null}

          {recipient && !canPay ? (
            <p className="text-xs text-muted-foreground">
              Enter a message to pay {tierConfig.priceUsd} and deliver your {tierConfig.label.toLowerCase()} ping.
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}
