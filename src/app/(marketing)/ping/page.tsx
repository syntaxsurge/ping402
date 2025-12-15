import Link from "next/link";

import { HandleSearch } from "@/components/marketing/HandleSearch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function PingLandingPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Paid pings</Badge>
          <Badge variant="secondary">Solana settlement</Badge>
          <Badge variant="secondary">x402 (HTTP 402)</Badge>
        </div>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Send a ping
        </h1>
        <p className="text-balance text-muted-foreground">
          Enter a creator handle to open their public inbox, choose a tier, and send a paid
          message.
        </p>
      </header>

      <HandleSearch />

      <Card className="bg-card/60 backdrop-blur">
        <CardHeader className="space-y-2">
          <CardTitle className="text-base">Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            If a handle is unclaimed, you can claim it for free (Solana signature) and start
            receiving paid pings.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/owner-signin">Creator sign-in</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/how-it-works">How it works</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
