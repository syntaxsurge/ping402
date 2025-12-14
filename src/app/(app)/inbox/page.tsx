import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import type { Id } from "@convex/_generated/dataModel";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getInboxStatsForHandle,
  getProfileByHandle,
  listMessagesForHandleByStatus,
  setMessageStatusForHandle,
} from "@/lib/db/convex/server";
import { getOwnerSession } from "@/lib/auth/ownerSession";
import { getEnvServer } from "@/lib/env/env.server";
import { isSolanaTxSignature, solanaExplorerTxUrl } from "@/lib/solana/explorer";
import { formatUsdFromCents } from "@/lib/utils/currency";
import { ShareLinkCard } from "@/components/data-display/ShareLinkCard";

export const dynamic = "force-dynamic";

type Status = "new" | "replied" | "archived";

function shortAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

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
  searchParams: Promise<{ status?: string; cursor?: string }>;
}) {
  const session = await getOwnerSession();
  if (!session) redirect("/owner-signin");

  const env = getEnvServer();
  const { status: statusParam, cursor } = await searchParams;
  const status = parseStatus(statusParam);

  const [profile, stats, page, hdrs] = await Promise.all([
    getProfileByHandle(session.handle),
    getInboxStatsForHandle({ handle: session.handle }),
    listMessagesForHandleByStatus({
      handle: session.handle,
      status,
      cursor: cursor ?? null,
      numItems: 50,
    }),
    headers(),
  ]);

  const messages = page.page;
  const nextCursor = page.continueCursor;

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

    const nextStatus =
      nextStatusRaw === "new" || nextStatusRaw === "replied" || nextStatusRaw === "archived"
        ? nextStatusRaw
        : null;
    const tab =
      tabRaw === "new" || tabRaw === "replied" || tabRaw === "archived" ? tabRaw : "new";

    if (typeof messageIdRaw !== "string" || !nextStatus) return;

    await setMessageStatusForHandle({
      handle: session.handle,
      messageId: messageIdRaw as Id<"messages">,
      status: nextStatus,
    });

    revalidatePath("/inbox");
    revalidatePath("/dashboard");
    redirect(`/inbox?status=${encodeURIComponent(tab)}`);
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

      <Card className="bg-card/60 backdrop-blur">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Inbox</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant={status === "new" ? "default" : "outline"}>
                <Link href="/inbox?status=new">New</Link>
              </Button>
              <Button asChild size="sm" variant={status === "replied" ? "default" : "outline"}>
                <Link href="/inbox?status=replied">Replied</Link>
              </Button>
              <Button asChild size="sm" variant={status === "archived" ? "default" : "outline"}>
                <Link href="/inbox?status=archived">Archived</Link>
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{status}</span> messages.
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tier</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead>Payer</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground">
                      No messages in this tab yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  messages.map((m) => (
                    <TableRow key={m._id}>
                      <TableCell>
                        <Badge variant="secondary">{m.tier}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(m.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {shortAddress(m.payer)}
                      </TableCell>
                      <TableCell>
                        {m.senderName ? (
                          m.senderName
                        ) : (
                          <span className="text-muted-foreground">Anonymous</span>
                        )}
                        {m.senderContact ? (
                          <div className="text-xs text-muted-foreground">
                            {m.senderContact}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="max-w-[28rem] whitespace-pre-wrap text-sm">
                        {m.body}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {m.paymentTxSig && isSolanaTxSignature(m.paymentTxSig) ? (
                          <Link
                            className="text-primary underline-offset-4 hover:underline"
                            href={solanaExplorerTxUrl(m.paymentTxSig, env.NEXT_PUBLIC_NETWORK)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {shortAddress(m.paymentTxSig)}
                          </Link>
                        ) : m.paymentTxSig ? (
                          <span className="text-muted-foreground">
                            {shortAddress(m.paymentTxSig)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Settling…</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/inbox/${m._id}`}>Open</Link>
                          </Button>
                          {m.status !== "replied" ? (
                            <form action={setStatus}>
                              <input type="hidden" name="messageId" value={m._id} />
                              <input type="hidden" name="nextStatus" value="replied" />
                              <input type="hidden" name="tab" value={status} />
                              <Button type="submit" size="sm">
                                Reply
                              </Button>
                            </form>
                          ) : null}
                          {m.status !== "archived" ? (
                            <form action={setStatus}>
                              <input type="hidden" name="messageId" value={m._id} />
                              <input type="hidden" name="nextStatus" value="archived" />
                              <input type="hidden" name="tab" value={status} />
                              <Button type="submit" size="sm" variant="secondary">
                                Archive
                              </Button>
                            </form>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {nextCursor ? (
            <div className="mt-4 flex justify-end">
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`/inbox?status=${encodeURIComponent(status)}&cursor=${encodeURIComponent(nextCursor)}`}
                >
                  Load more
                </Link>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
