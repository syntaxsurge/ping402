import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { solanaNetworkLabel, type Ping402SvmNetwork } from "@/lib/solana/chain";

function shortAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function PaymentSummaryCard({
  tierLabel,
  priceUsd,
  recipientHandle,
  networkId,
  payToAddress,
  facilitatorUrl,
}: {
  tierLabel: string;
  priceUsd: string;
  recipientHandle: string | null;
  networkId: Ping402SvmNetwork;
  payToAddress: string | null;
  facilitatorUrl: string;
}) {
  const networkLabel = solanaNetworkLabel(networkId);

  return (
    <Card className="bg-card/60 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Payment summary</CardTitle>
          <Badge variant="secondary">x402</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <div className="text-muted-foreground">Tier</div>
            <div className="font-medium">{tierLabel}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Price</div>
            <div className="font-medium">{priceUsd}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Network</div>
            <div className="font-medium capitalize">{networkLabel}</div>
            <div className="break-all font-mono text-[11px] text-muted-foreground">
              {networkId}
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-1">
          <div className="text-muted-foreground">Recipient</div>
          <div className="font-medium">
            {recipientHandle ? (
              <span className="font-mono">@{recipientHandle}</span>
            ) : (
              <span className="text-muted-foreground">Select a creator handle</span>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-muted-foreground">Pay-to address</div>
          {payToAddress ? (
            <div className="font-mono text-xs" title={payToAddress}>
              {shortAddress(payToAddress)}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              Resolved from the creator profile.
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="text-muted-foreground">Facilitator</div>
          <div className="break-all font-mono text-xs">{facilitatorUrl}</div>
        </div>

        <div className="rounded-md border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
          Unpaid requests receive <strong>HTTP 402</strong> with a{" "}
          <code className="rounded bg-muted px-1 py-0.5">PAYMENT-REQUIRED</code> header. After
          payment, clients retry with{" "}
          <code className="rounded bg-muted px-1 py-0.5">PAYMENT-SIGNATURE</code>.
        </div>
      </CardContent>
    </Card>
  );
}
