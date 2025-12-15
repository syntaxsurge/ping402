import Link from "next/link";
import { notFound } from "next/navigation";

import type { Id } from "@convex/_generated/dataModel";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getPublicReceiptById } from "@/lib/db/convex/server";
import { getEnvServer } from "@/lib/env/env.server";
import { isSolanaTxSignature, solanaExplorerTxUrl } from "@/lib/solana/explorer";

export const dynamic = "force-dynamic";

function shortAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ messageId: string }>;
}) {
  const { messageId } = await params;
  const receipt = await getPublicReceiptById({ messageId: messageId as Id<"messages"> });
  if (!receipt) notFound();

  const env = getEnvServer();

  const paymentExplorerUrl =
    receipt.paymentTxSig && isSolanaTxSignature(receipt.paymentTxSig)
      ? solanaExplorerTxUrl(receipt.paymentTxSig, env.X402_NETWORK)
      : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Receipt</h1>
          <Badge variant="secondary">@{receipt.toHandle}</Badge>
          <Badge variant="outline">{receipt.tier}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Verifiable on-chain proof that a ping was paid for.
        </p>
      </header>

      <Card className="bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base">On-chain receipts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-1">
            <div className="text-muted-foreground">Payer</div>
            <div className="font-mono text-xs" title={receipt.payer}>
              {shortAddress(receipt.payer)}
            </div>
          </div>

          <Separator />

          <div className="space-y-1">
            <div className="text-muted-foreground">Payment transaction</div>
            {receipt.paymentTxSig ? (
              paymentExplorerUrl ? (
                <Link
                  className="break-all font-mono text-xs text-primary underline-offset-4 hover:underline"
                  href={paymentExplorerUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {receipt.paymentTxSig}
                </Link>
              ) : (
                <div className="break-all font-mono text-xs">{receipt.paymentTxSig}</div>
              )
            ) : (
              <div className="text-xs text-muted-foreground">Pending settlement.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div>
            messageId <span className="break-all font-mono text-xs">{receipt.messageId}</span>
          </div>
          {receipt.x402Asset ? (
            <div>
              asset <span className="break-all font-mono text-xs">{receipt.x402Asset}</span>
            </div>
          ) : null}
          {receipt.x402Amount ? (
            <div>
              amount (base units){" "}
              <span className="break-all font-mono text-xs">{receipt.x402Amount}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
