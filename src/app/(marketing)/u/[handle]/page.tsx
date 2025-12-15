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
import { parseHandle } from "@/lib/utils/handles";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const decoded = decodeURIComponent(handle);
  const decodedHandle = parseHandle(decoded) ?? decoded.trim().toLowerCase();
  const canonical = absoluteUrl(`/u/${encodeURIComponent(decodedHandle)}`);
  const title = `@${decodedHandle} | ${siteConfig.name}`;

  return {
    title,
    description: `Send a paid ping to @${decodedHandle} via Solana x402, or claim this handle for free to receive paid pings.`,
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
  searchParams: Promise<{ sent?: string; tx?: string; r?: string }>;
}) {
  const { handle } = await params;
  const { sent, tx, r } = await searchParams;

  const decodedHandle = decodeURIComponent(handle);
  const normalizedHandle = parseHandle(decodedHandle);
  if (!normalizedHandle) notFound();

  const profile = await getProfileByHandle(normalizedHandle);

  if (!profile) {
    const claimHref = `/owner-signin?handle=${encodeURIComponent(normalizedHandle)}`;
    const shareUrl = absoluteUrl(`/u/${encodeURIComponent(normalizedHandle)}`);

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="bg-card/60 backdrop-blur">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="truncate">@{normalizedHandle}</CardTitle>
              <Badge variant="outline">unclaimed</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              This handle hasn’t been claimed yet. Claim it to receive paid pings.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="brand">
                <Link href={claimHref}>Claim @{normalizedHandle}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/ping">Find a creator</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/how-it-works">How it works</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Claiming requires a Solana wallet signature (no SOL transfer). After verification,
              a creator session cookie is set to access the dashboard and inbox.
            </p>
          </CardContent>
        </Card>

        <ShareLinkCard
          url={shareUrl}
          title={`Share @${normalizedHandle}`}
          description="Share this URL. If the handle is unclaimed, visitors can claim it."
          toastSuccess="Copied share link."
        />
      </div>
    );
  }

  const needsEnv = Boolean(tx);
  const [stats, env] = await Promise.all([
    getInboxStatsForHandle({ handle: profile.handle }),
    needsEnv ? getEnvServer() : Promise.resolve(null),
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
              {typeof r === "string" ? (
                <>
                  {" "}
                  (<Link
                    className="text-primary underline-offset-4 hover:underline"
                    href={`/r/${encodeURIComponent(r)}`}
                  >
                    receipt
                  </Link>
                  )
                </>
              ) : null}
              .
            </p>
          ) : null}

          {tx && env && isSolanaTxSignature(tx) ? (
            <div className="text-xs text-muted-foreground">
              Payment{" "}
              <Link
                className="text-primary underline-offset-4 hover:underline"
                href={solanaExplorerTxUrl(tx, env.X402_NETWORK)}
                target="_blank"
                rel="noreferrer"
              >
                {tx}
              </Link>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="h4">Send a paid ping</h2>
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
          Sending a ping requires an x402-priced Solana payment.{" "}
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
