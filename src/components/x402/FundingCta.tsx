import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { solanaNetworkLabel, type Ping402SvmNetwork } from "@/lib/solana/chain";

export function FundingCta({
  networkId,
}: {
  networkId: Ping402SvmNetwork;
}) {
  const label = solanaNetworkLabel(networkId);

  return (
    <Card className="bg-card/60 backdrop-blur">
      <CardContent className="space-y-3 p-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="font-medium">Need funds?</div>
          <Badge variant="secondary">{label}</Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          The x402 paywall will request an on-chain payment before delivering your ping. Make
          sure your wallet has enough balance for fees and the required asset.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="secondary" className="w-full sm:w-auto">
            <Link href="/#funding">Funding</Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/#how-it-works">How it works</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
