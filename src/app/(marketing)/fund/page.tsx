import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getEnvServer } from "@/lib/env/env.server";

export const dynamic = "force-dynamic";

export default function FundPage() {
  const env = getEnvServer();
  const isDevnet = env.NEXT_PUBLIC_NETWORK === "solana-devnet";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Funding</h1>
          <Badge variant="secondary">{env.NEXT_PUBLIC_NETWORK}</Badge>
        </div>
        <p className="text-muted-foreground">
          ping402 paywalls paid actions using x402. Your wallet needs enough balance for fees and
          the payment asset requested by the paywall.
        </p>
      </header>

      <Card className="bg-card/60 backdrop-blur">
        <CardHeader className="space-y-2">
          <CardTitle className="text-base">Quick checklist</CardTitle>
          <p className="text-sm text-muted-foreground">
            If you get stuck at a 402 paywall, work through these steps.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Confirm the app is pointing at the right network:{" "}
              <code className="rounded bg-muted px-1 py-0.5">{env.NEXT_PUBLIC_NETWORK}</code>.
            </li>
            <li>Ensure your wallet has SOL for transaction fees.</li>
            <li>
              Use <Link className="underline underline-offset-4" href="/demo/x402">/demo/x402</Link>{" "}
              to inspect the exact payment requirements returned by the server.
            </li>
          </ol>
        </CardContent>
      </Card>

      <Separator />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card/60 backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">Devnet funding</CardTitle>
            <p className="text-sm text-muted-foreground">
              Recommended for demos and testing. You can request devnet SOL from a faucet.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Faucet:{" "}
              <a
                className="underline underline-offset-4"
                href="https://faucet.solana.com"
                target="_blank"
                rel="noreferrer"
              >
                faucet.solana.com
              </a>
            </p>
            <p className="text-xs">
              If you’re paying with a token (like a stablecoin), the paywall will specify the
              mint and amount in the <code>payment-required</code> header.
            </p>
            {isDevnet ? (
              <p className="text-xs">
                You are currently configured for devnet, so this path should work end-to-end.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">Mainnet funding</CardTitle>
            <p className="text-sm text-muted-foreground">
              For real users. Ensure you have SOL for fees and the required token balance.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              If you’re using a mainnet facilitator, double-check your environment variables (and
              CDP keys if applicable).
            </p>
            <p className="text-xs">
              Tip: Use the x402 demo page to confirm the server is returning payment requirements
              on the expected chain before recording a walkthrough video.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/60 backdrop-blur">
        <CardHeader className="space-y-2">
          <CardTitle className="text-base">Current facilitator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="break-all font-mono text-xs">{env.NEXT_PUBLIC_FACILITATOR_URL}</div>
          <p className="text-xs">
            This facilitator is used to verify and settle x402 payments against Solana.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

