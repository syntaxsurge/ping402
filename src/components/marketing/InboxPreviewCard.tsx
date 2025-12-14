import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, Shield, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type PreviewPing = {
  tier: "standard" | "priority" | "vip";
  from: string;
  message: string;
  status: "new" | "replied";
};

const PREVIEW_PINGS: PreviewPing[] = [
  {
    tier: "priority",
    from: "@founder",
    message: "Can you review our integration plan and reply with a go/no-go?",
    status: "new",
  },
  {
    tier: "vip",
    from: "@security",
    message: "Escalation: suspicious auth activity. Need your confirmation ASAP.",
    status: "new",
  },
  {
    tier: "standard",
    from: "Anonymous",
    message: "Quick question about your API rate limits and expected response time.",
    status: "replied",
  },
];

function statusChip(status: PreviewPing["status"]) {
  if (status === "replied") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        replied
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
      new
    </span>
  );
}

export function InboxPreviewCard({ ownerHandle }: { ownerHandle: string }) {
  const inboxHref = `/u/${encodeURIComponent(ownerHandle)}`;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Inbox preview</CardTitle>
          <Badge variant="secondary">x402 · Solana</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          A clean queue where every ping has skin in the game.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          {PREVIEW_PINGS.map((ping, idx) => (
            <div key={`${ping.tier}-${idx}`} className="rounded-md border bg-muted/30 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant={ping.tier === "standard" ? "outline" : "secondary"}>
                    {ping.tier}
                  </Badge>
                  <span className="text-sm font-medium">{ping.from}</span>
                </div>
                {statusChip(ping.status)}
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {ping.message}
              </p>
            </div>
          ))}
        </div>

        <Separator />

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-start gap-2">
            <Shield className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium">Spam-resistant</div>
              <div className="text-xs text-muted-foreground">
                Paywall replaces cold DMs.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Zap className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium">Priority routing</div>
              <div className="text-xs text-muted-foreground">
                Tiers map to attention.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium">Proof-backed</div>
              <div className="text-xs text-muted-foreground">
                Receipt on Solana.
              </div>
            </div>
          </div>
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link href={inboxHref} className="flex items-center justify-center gap-2">
            Open @{ownerHandle}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

