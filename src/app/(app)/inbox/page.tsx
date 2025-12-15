import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import type { Id } from "@convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getInboxStatsForHandle,
  getProfileByHandle,
  listMessagesForHandleByStatus,
  setMessageStatusForHandle,
} from "@/lib/db/convex/server";
import { getOwnerSession } from "@/lib/auth/ownerSession";
import { getEnvServer } from "@/lib/env/env.server";
import { formatUsdFromCents } from "@/lib/utils/currency";
import { ShareLinkCard } from "@/components/data-display/ShareLinkCard";
import { InboxTableClient } from "@/app/(app)/inbox/InboxTableClient";

export const dynamic = "force-dynamic";

type Status = "new" | "replied" | "archived";

function parseStatus(status: string | undefined): Status {
  if (status === "new" || status === "replied" || status === "archived") return status;
  return "new";
}

function getOriginFromHeaders(h: Headers): string | null {
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return null;
  return `${proto}://${host}`;
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const session = await getOwnerSession();
  if (!session) redirect("/owner-signin");

  const env = getEnvServer();
  const { status: statusParam, q } = await searchParams;
  const status = parseStatus(statusParam);
  const query = typeof q === "string" ? q : "";

  function inboxHref(nextStatus: Status) {
    const params = new URLSearchParams();
    params.set("status", nextStatus);
    if (query) params.set("q", query);
    return `/inbox?${params.toString()}`;
  }

  const [profile, stats, page, hdrs] = await Promise.all([
    getProfileByHandle(session.handle),
    getInboxStatsForHandle({ handle: session.handle }),
    listMessagesForHandleByStatus({
      handle: session.handle,
      status,
      cursor: null,
      numItems: 200,
    }),
    headers(),
  ]);

  const messages = page.page;

  const sharePath = `/u/${encodeURIComponent(session.handle)}`;
  const origin = getOriginFromHeaders(hdrs);
  const shareUrl = origin ? `${origin}${sharePath}` : sharePath;

  async function setStatus(formData: FormData) {
    "use server";
    const session = await getOwnerSession();
    if (!session) redirect("/owner-signin");

    const messageIdRaw = formData.get("messageId");
    const nextStatusRaw = formData.get("nextStatus");
    const tabRaw = formData.get("tab");
    const qRaw = formData.get("q");

    const nextStatus =
      nextStatusRaw === "new" || nextStatusRaw === "replied" || nextStatusRaw === "archived"
        ? nextStatusRaw
        : null;
    const tab =
      tabRaw === "new" || tabRaw === "replied" || tabRaw === "archived" ? tabRaw : "new";
    const qParam = typeof qRaw === "string" && qRaw.trim() ? qRaw.trim() : null;

    if (typeof messageIdRaw !== "string" || !nextStatus) return;

    await setMessageStatusForHandle({
      handle: session.handle,
      messageId: messageIdRaw as Id<"messages">,
      status: nextStatus,
    });

    revalidatePath("/inbox");
    revalidatePath("/dashboard");

    const params = new URLSearchParams();
    params.set("status", tab);
    if (qParam) params.set("q", qParam);
    redirect(`/inbox?${params.toString()}`);
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-card/60 backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle>Overview</CardTitle>
            <p className="text-sm text-muted-foreground">
              {profile ? (
                <>
                  Viewing messages for <span className="font-medium">{profile.displayName}</span>{" "}
                  <span className="text-muted-foreground">@{profile.handle}</span>
                </>
              ) : (
                <>
                  Missing profile for{" "}
                  <span className="font-medium">@{session.handle}</span>. Re-claim your
                  handle on <Link className="underline underline-offset-4" href="/owner-signin">/owner-signin</Link>.
                </>
              )}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-md border p-3">
                <div className="text-xs font-medium text-muted-foreground">Revenue</div>
                <div className="mt-1 text-lg font-semibold">
                  {formatUsdFromCents(stats?.totalRevenueCents ?? 0)}
                </div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs font-medium text-muted-foreground">New</div>
                <div className="mt-1 text-lg font-semibold">{stats?.newCount ?? 0}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs font-medium text-muted-foreground">Replied</div>
                <div className="mt-1 text-lg font-semibold">{stats?.repliedCount ?? 0}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs font-medium text-muted-foreground">Archived</div>
                <div className="mt-1 text-lg font-semibold">{stats?.archivedCount ?? 0}</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={sharePath}>Open public page</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <ShareLinkCard url={shareUrl} />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 className="h3">Inbox</h2>
            <p className="muted">
              Showing <span className="font-medium">{status}</span> messages.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" variant={status === "new" ? "default" : "outline"}>
              <Link href={inboxHref("new")}>New</Link>
            </Button>
            <Button asChild size="sm" variant={status === "replied" ? "default" : "outline"}>
              <Link href={inboxHref("replied")}>Replied</Link>
            </Button>
            <Button asChild size="sm" variant={status === "archived" ? "default" : "outline"}>
              <Link href={inboxHref("archived")}>Archived</Link>
            </Button>
          </div>
        </div>

        <InboxTableClient
          messages={messages}
          status={status}
          networkId={env.X402_NETWORK}
          setStatusAction={setStatus}
          initialSearch={query}
        />
      </div>
    </div>
  );
}
