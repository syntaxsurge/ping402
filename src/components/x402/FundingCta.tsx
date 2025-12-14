import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function FundingCta({
  network,
}: {
  network: string;
}) {
  const isDevnet = network === "solana-devnet";

  return (
    <Card className="bg-card/60 backdrop-blur">
      <CardContent className="space-y-3 p-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="font-medium">Need funds?</div>
          <Badge variant="secondary">{isDevnet ? "devnet" : "mainnet"}</Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          The x402 paywall will request an on-chain payment before delivering your ping. Make
          sure your wallet has enough balance for fees and the required asset.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="secondary" className="w-full sm:w-auto">
            <Link href="/fund">Funding guide</Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/demo/x402">Inspect x402 headers</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

