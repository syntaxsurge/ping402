import Link from "next/link";
import { notFound } from "next/navigation";

import { getProfileByHandle } from "@/lib/db/convex/server";
import { getPingTierConfig, PingTierSchema, type PingTier } from "@/lib/ping/tiers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
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
            <form action={actionHref} method="POST" className="space-y-4">
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

              <Button type="submit" disabled={!recipient}>
                Pay & send ping
              </Button>

              <p className="text-xs text-muted-foreground">
                Submitting this form triggers an x402 (HTTP 402 Payment Required)
                paywall on Solana and delivers your message after payment.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
