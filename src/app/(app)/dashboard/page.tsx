import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getInboxStatsForHandle } from "@/lib/db/convex/server";
import { formatUsdFromCents } from "@/lib/utils/currency";
import { ShareLinkCard } from "@/components/data-display/ShareLinkCard";
import { absoluteUrl } from "@/lib/config/site";
import { getOwnerSession } from "@/lib/auth/ownerSession";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getOwnerSession();
  if (!session) redirect("/owner-signin");

  const stats = await getInboxStatsForHandle({ handle: session.handle });

  const totalMessages = stats?.totalMessages ?? 0;
  const totalRevenueCents = stats?.totalRevenueCents ?? 0;
  const newCount = stats?.newCount ?? 0;
  const repliedCount = stats?.repliedCount ?? 0;
  const archivedCount = stats?.archivedCount ?? 0;

  const shareUrl = absoluteUrl(`/u/${encodeURIComponent(session.handle)}`);
  const sharePath = `/u/${encodeURIComponent(session.handle)}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Real-time overview of your paid inbox.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={sharePath}>Public page</Link>
          </Button>
          <Button asChild>
            <Link href="/inbox">Open inbox</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-card/60 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatUsdFromCents(totalRevenueCents)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/60 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalMessages}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/60 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{newCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/60 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Replied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{repliedCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/60 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Archived
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{archivedCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ShareLinkCard
          url={shareUrl}
          title={`Share @${session.handle}`}
          description="Let anyone send you a paid ping from this URL."
          toastSuccess="Copied share link."
        />

        <Card className="bg-card/60 backdrop-blur">
          <CardHeader className="space-y-2">
          <CardTitle className="text-base">Creator workflow</CardTitle>
          <p className="text-sm text-muted-foreground">
            The fastest way to validate the end-to-end flow.
          </p>
        </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <ol className="list-decimal space-y-2 pl-5">
              <li>Open your public inbox and compose a ping.</li>
              <li>Complete the x402 payment flow on Solana.</li>
              <li>Review the message in your inbox and update its status.</li>
            </ol>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/how-it-works">Read how it works</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/inbox">Go to inbox</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
