import Link from "next/link";
import { notFound } from "next/navigation";

import { getProfileByHandle } from "@/lib/db/convex/server";
import { getEnvServer } from "@/lib/env/env.server";
import { getPingTierConfig, PingTierSchema, type PingTier } from "@/lib/ping/tiers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FundingCta } from "@/components/x402/FundingCta";
import { PaymentSummaryCard } from "@/components/x402/PaymentSummaryCard";
import { PingComposeFormClient } from "@/app/(marketing)/ping/[tier]/PingComposeFormClient";

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
          </CardHeader>

          <CardContent>
            <PingComposeFormClient
              toHandle={toHandle}
              tier={tier}
              recipient={recipient ? { handle: recipient.handle, displayName: recipient.displayName } : null}
              error={error}
            />
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
