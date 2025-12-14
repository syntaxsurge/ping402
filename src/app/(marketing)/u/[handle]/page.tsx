import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ShareLinkCard } from "@/components/data-display/ShareLinkCard";
import { getInboxStatsForHandle, getProfileByHandle } from "@/lib/db/convex/server";
import { getEnvServer } from "@/lib/env/env.server";
import { absoluteUrl, siteConfig } from "@/lib/config/site";
import { isSolanaTxSignature, solanaExplorerTxUrl } from "@/lib/solana/explorer";
import { getPingTierConfig, PING_TIER_ORDER } from "@/lib/ping/tiers";
import { formatUsdFromCents } from "@/lib/utils/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const decodedHandle = decodeURIComponent(handle).trim().toLowerCase();
  const canonical = absoluteUrl(`/u/${encodeURIComponent(decodedHandle)}`);
  const title = `@${decodedHandle} | ${siteConfig.name}`;

  return {
    title,
    description: `Send a paid ping to @${decodedHandle} via Solana x402.`,
    alternates: { canonical },
    openGraph: {
      title,
      description: "A paid inbox powered by HTTP 402 micropayments on Solana.",
      url: canonical,
    },
  };
}

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ sent?: string; tx?: string }>;
}) {
  const { handle } = await params;
  const { sent, tx } = await searchParams;

  const decodedHandle = decodeURIComponent(handle);
  const profile = await getProfileByHandle(decodedHandle);

  if (!profile) notFound();

  const [stats, env] = await Promise.all([
    getInboxStatsForHandle({ handle: profile.handle }),
    tx ? getEnvServer() : Promise.resolve(null),
  ]);

  const shareUrl = absoluteUrl(`/u/${encodeURIComponent(profile.handle)}`);
  const totalMessages = stats?.totalMessages ?? 0;
  const totalRevenueCents = stats?.totalRevenueCents ?? 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="bg-card/60 backdrop-blur">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="truncate">{profile.displayName}</CardTitle>
            <Badge variant="secondary">@{profile.handle}</Badge>
          </div>
          {profile.bio ? (
            <p className="text-sm text-muted-foreground">{profile.bio}</p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground">Total pings</div>
              <div className="text-2xl font-semibold">{totalMessages}</div>
            </div>
            <div className="rounded-md border bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground">Revenue</div>
              <div className="text-2xl font-semibold">
                {formatUsdFromCents(totalRevenueCents)}
              </div>
            </div>
          </div>

          {sent ? (
            <p className="text-sm">
              Your ping was sent
              {tx && env && isSolanaTxSignature(tx) ? (
                <>
                  {" "}
                  (<Link
                    className="text-primary underline-offset-4 hover:underline"
                    href={solanaExplorerTxUrl(tx, env.NEXT_PUBLIC_NETWORK)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    receipt
                  </Link>
                  )
                </>
              ) : null}
              .
            </p>
          ) : null}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Send a paid ping</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {PING_TIER_ORDER.map((tier) => {
            const tierConfig = getPingTierConfig(tier);
            const variant =
              tier === "vip" ? "brand" : tier === "priority" ? "default" : "outline";

            return (
              <Button
                key={tier}
                asChild
                variant={variant}
              >
                <Link href={`/ping/${tier}?to=${encodeURIComponent(profile.handle)}`}>
                  {tierConfig.label} · {tierConfig.priceUsd}
                </Link>
              </Button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Submitting a ping triggers an x402 (HTTP 402 Payment Required) paywall on
          Solana.{" "}
          <Link className="underline underline-offset-4" href="/how-it-works">
            Learn how it works
          </Link>
          .
        </p>
      </section>

      <ShareLinkCard
        url={shareUrl}
        title={`Share @${profile.handle}`}
        description="Let anyone send you a paid ping from this URL."
        toastSuccess="Copied share link."
      />
    </div>
  );
}
