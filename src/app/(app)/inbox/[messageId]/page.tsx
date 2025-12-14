import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import type { Id } from "@convex/_generated/dataModel";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  getMessageForHandleById,
  setMessageStatusForHandle,
} from "@/lib/db/convex/server";
import { getOwnerSession } from "@/lib/auth/ownerSession";
import { getEnvServer } from "@/lib/env/env.server";
import { isSolanaTxSignature, solanaExplorerTxUrl } from "@/lib/solana/explorer";

export const dynamic = "force-dynamic";

function shortAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

function statusBadge(status: "pending" | "new" | "replied" | "archived") {
  switch (status) {
    case "pending":
      return <Badge variant="outline">pending</Badge>;
    case "new":
      return <Badge>new</Badge>;
    case "replied":
      return <Badge variant="secondary">replied</Badge>;
    case "archived":
      return <Badge variant="outline">archived</Badge>;
  }
}

export default async function MessageDetailPage({
  params,
}: {
  params: Promise<{ messageId: string }>;
}) {
  const { messageId } = await params;
  const session = await getOwnerSession();
  if (!session) redirect("/owner-signin");
  const env = getEnvServer();

  const message = await getMessageForHandleById({
    handle: session.handle,
    messageId: messageId as Id<"messages">,
  });

  if (!message) notFound();

  async function setStatus(nextStatus: "replied" | "archived") {
    "use server";
    const session = await getOwnerSession();
    if (!session) redirect("/owner-signin");
    await setMessageStatusForHandle({
      handle: session.handle,
      messageId: messageId as Id<"messages">,
      status: nextStatus,
    });
    revalidatePath("/inbox");
    revalidatePath("/dashboard");
    redirect(`/inbox/${encodeURIComponent(messageId)}`);
  }

  const paymentTxSig = message.paymentTxSig ?? null;
  const hasReceipt = Boolean(paymentTxSig && isSolanaTxSignature(paymentTxSig));
  const explorerUrl = hasReceipt ? solanaExplorerTxUrl(paymentTxSig!, env.X402_NETWORK) : null;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Message</h1>
          <p className="text-sm text-muted-foreground">
            Received {new Date(message.createdAt).toLocaleString()}
          </p>
        </div>
        <Button asChild variant="ghost">
          <Link href="/inbox">Back</Link>
        </Button>
      </div>

      <Card className="bg-card/60 backdrop-blur">
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{message.tier}</Badge>
            {statusBadge(message.status)}
            <span className="text-xs text-muted-foreground">
              payer <span className="font-mono">{shortAddress(message.payer)}</span>
            </span>
          </div>
          <CardTitle className="text-base">Ping</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">From</div>
            <div className="text-sm">
              {message.senderName ? (
                <span className="font-medium">{message.senderName}</span>
              ) : (
                <span className="text-muted-foreground">Anonymous</span>
              )}
              {message.senderContact ? (
                <div className="text-xs text-muted-foreground">
                  {message.senderContact}
                </div>
              ) : null}
            </div>
          </div>

          <Separator />

          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Message</div>
            <div className="whitespace-pre-wrap text-sm">{message.body}</div>
          </div>

          <Separator />

          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Receipt</div>
            <div className="text-sm">
              {explorerUrl ? (
                <Link
                  className="text-primary underline-offset-4 hover:underline"
                  href={explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  View on Solana Explorer
                </Link>
              ) : (
                <span className="text-muted-foreground">No on-chain receipt.</span>
              )}
              <div className="mt-1 font-mono text-xs text-muted-foreground">
                {paymentTxSig ?? "pending"}
              </div>
              {message.x402Network || message.x402Scheme || message.x402Version ? (
                <div className="mt-2 text-xs text-muted-foreground">
                  {message.x402Network ? (
                    <div>
                      network <span className="font-mono">{message.x402Network}</span>
                    </div>
                  ) : null}
                  {message.x402Scheme ? (
                    <div>
                      scheme <span className="font-mono">{message.x402Scheme}</span>
                    </div>
                  ) : null}
                  {typeof message.x402Version === "number" ? (
                    <div>
                      x402 v{message.x402Version}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {message.status !== "pending" && message.status !== "replied" ? (
          <form action={setStatus.bind(null, "replied")}>
            <Button type="submit">Mark replied</Button>
          </form>
        ) : null}
        {message.status !== "pending" && message.status !== "archived" ? (
          <form action={setStatus.bind(null, "archived")}>
            <Button type="submit" variant="outline">
              Archive
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
