import Link from "next/link";

import { siteConfig } from "@/lib/config/site";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: `How it works | ${siteConfig.name}`,
  description: "How ping402 uses HTTP 402 + Solana payments via x402.",
};

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">How ping402 works</h1>
        <p className="text-muted-foreground">
          ping402 turns “send a message” into a paid, guaranteed-read action using
          HTTP 402 and Solana micropayments via x402.
        </p>
      </header>

      <Card className="bg-card/60 backdrop-blur">
        <CardHeader className="space-y-2">
          <CardTitle className="text-base">End-to-end flow</CardTitle>
          <p className="text-sm text-muted-foreground">
            This is the exact lifecycle a sender goes through.
          </p>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            <li>
              Open a public inbox at <code>/u/[handle]</code>.
            </li>
            <li>
              Choose a tier (Standard / Priority / VIP) which routes to{" "}
              <code>/ping/[tier]</code>.
            </li>
            <li>
              Submit the compose form, which POSTs to{" "}
              <code>/api/ping/send?tier=[tier]</code>.
            </li>
            <li>
              The endpoint responds with <strong>HTTP 402 Payment Required</strong>{" "}
              and payment requirements if no payment proof is attached.
            </li>
            <li>
              The sender pays on Solana and retries the request with an{" "}
              <code>X-PAYMENT</code> proof.
            </li>
            <li>
              The server verifies/settles payment via the configured facilitator,
              stores the message in Convex, and returns <code>200</code>.
            </li>
            <li>
              The inbox owner sees the ping in real time on{" "}
              <code>/inbox</code> (requires owner session).
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card className="bg-card/60 backdrop-blur">
        <CardHeader className="space-y-2">
          <CardTitle className="text-base">Try it</CardTitle>
          <p className="text-sm text-muted-foreground">
            Start from the public inbox link and send yourself a paid ping.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link className="underline underline-offset-4" href="/">
            Home
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link className="underline underline-offset-4" href="/dashboard">
            Dashboard
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link className="underline underline-offset-4" href="/inbox">
            Inbox
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
