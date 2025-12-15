import Link from "next/link";
import { notFound } from "next/navigation";

import { getProfileByHandle } from "@/lib/db/convex/server";
import { getEnvServer } from "@/lib/env/env.server";
import { getPingTierConfig, PingTierSchema, type PingTier } from "@/lib/ping/tiers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FundingCta } from "@/components/x402/FundingCta";
import { PaymentSummaryCard } from "@/components/x402/PaymentSummaryCard";
import { SolanaPayPingSheet } from "@/components/solana-pay/SolanaPayPingSheet";

export const dynamic = "force-dynamic";

export default async function PingComposePage({
  params,
  searchParams,
}: {
  params: Promise<{ tier: string }>;
  searchParams: Promise<{ to?: string; error?: string }>;
}) {
  const { tier: tierParam } = await params;
  const { to, error } = await searchParams;

  const tierParsed = PingTierSchema.safeParse(tierParam);
  if (!tierParsed.success) notFound();
  const tier: PingTier = tierParsed.data;

  const toHandle = to ? decodeURIComponent(to) : "";
  const recipient = toHandle ? await getProfileByHandle(toHandle) : null;

  const meta = getPingTierConfig(tier);
  const backHref = toHandle ? `/u/${encodeURIComponent(toHandle)}` : "/";
  const actionHref = `/api/ping/send?tier=${encodeURIComponent(tier)}&to=${encodeURIComponent(toHandle)}`;
  const env = getEnvServer();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {meta.label} ping ({meta.priceUsd})
          </h1>
          <p className="text-sm text-muted-foreground">{meta.description}</p>
        </div>
        <Button asChild variant="ghost">
          <Link href={backHref}>Back</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <Card className="bg-card/60 backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">
              {recipient ? (
                <>
                  To <span className="font-semibold">{recipient.displayName}</span>{" "}
                  <span className="text-muted-foreground">@{recipient.handle}</span>
                </>
              ) : toHandle ? (
                <>
                  Recipient <span className="font-semibold">@{toHandle}</span> not found
                </>
              ) : (
                <>Missing recipient</>
              )}
            </CardTitle>
            {error ? (
              <p className="text-sm text-destructive">
                Please check the form and try again.
              </p>
            ) : null}
          </CardHeader>

          <CardContent>
            {!toHandle ? (
              <p className="text-sm text-muted-foreground">
                Go to a profile page and pick a tier to start.
              </p>
            ) : (
              <form id="ping-compose-form" action={actionHref} method="POST" className="space-y-4">
                <input type="hidden" name="to" value={toHandle} />

                <div className="space-y-2">
                  <Label htmlFor="senderName">Your name (optional)</Label>
                  <Input id="senderName" name="senderName" placeholder="e.g. Alex" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senderContact">Contact (optional)</Label>
                  <Input
                    id="senderContact"
                    name="senderContact"
                    placeholder="e.g. @alex or email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">Message</Label>
                  <Textarea
                    id="body"
                    name="body"
                    placeholder="Write your ping…"
                    required
                    maxLength={280}
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="submit" disabled={!recipient} className="sm:flex-1">
                    Pay & send ping
                  </Button>
                  <SolanaPayPingSheet
                    formId="ping-compose-form"
                    toHandle={toHandle}
                    tier={tier}
                    disabled={!recipient}
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Submitting this form triggers an x402 (HTTP 402 Payment Required) paywall on
                  Solana and delivers your message after payment.
                </p>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <PaymentSummaryCard
            tierLabel={meta.label}
            priceUsd={meta.priceUsd}
            recipientHandle={recipient?.handle ?? (toHandle || null)}
            networkId={env.X402_NETWORK}
            payToAddress={recipient?.ownerWallet ?? null}
            facilitatorUrl={env.X402_FACILITATOR_URL}
          />
          <FundingCta networkId={env.X402_NETWORK} />
        </div>
      </div>
    </div>
  );
}
