import Link from "next/link";

import { HandleLookup } from "@/components/marketing/HandleLookup";
import { InboxPreviewCard } from "@/components/marketing/InboxPreviewCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getPingTierConfig, PING_TIER_ORDER } from "@/lib/ping/tiers";

export default function HomePage() {
  const ownerHandle = (process.env.PING402_OWNER_HANDLE ?? "ping402")
    .trim()
    .toLowerCase();

  const inboxHref = `/u/${encodeURIComponent(ownerHandle)}`;

  return (
    <div className="space-y-24">
      <section className="pt-6">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">HTTP 402 · x402</Badge>
              <Badge variant="secondary">Solana settlement</Badge>
              <Badge variant="secondary">Realtime inbox</Badge>
            </div>

            <div className="space-y-3">
              <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                Paid pings that get answered.
              </h1>
              <p className="text-balance text-base text-muted-foreground sm:text-lg">
                ping402 turns “send a message” into a single, verifiable action.
                If you want priority attention, you pay. If you pay, your ping
                is delivered—no subscriptions, no spam, no guesswork.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="brand" size="lg">
                <Link href={inboxHref}>Send a ping</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/how-it-works">How it works</Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="/owner-signin">Creator sign-in</Link>
              </Button>
            </div>

            <div className="rounded-xl border bg-card/60 p-4 backdrop-blur">
              <div className="text-sm font-medium">Find a creator</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Open a public inbox by handle and send a paid ping.
              </p>
              <div className="mt-4">
                <HandleLookup defaultHandle={ownerHandle} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                No account needed to send. Payment only triggers when required.
              </p>
            </div>
          </div>

          <div className="animate-in fade-in-0 zoom-in-95 duration-700 lg:justify-self-end">
            <InboxPreviewCard ownerHandle={ownerHandle} />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
          <p className="text-muted-foreground">
            End-to-end is intentionally simple: paywall → proof → delivery.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-card/60 backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="text-base">1) Open a public inbox</CardTitle>
              <p className="text-sm text-muted-foreground">
                Every creator has a shareable link at{" "}
                <code className="rounded bg-muted px-1 py-0.5">/u/[handle]</code>.
              </p>
            </CardHeader>
          </Card>

          <Card className="bg-card/60 backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="text-base">2) Pick a tier</CardTitle>
              <p className="text-sm text-muted-foreground">
                Standard, Priority, and VIP map to attention and urgency.
              </p>
            </CardHeader>
          </Card>

          <Card className="bg-card/60 backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="text-base">3) Pay, then deliver</CardTitle>
              <p className="text-sm text-muted-foreground">
                The ping endpoint responds with HTTP 402 until it receives an{" "}
                <code className="rounded bg-muted px-1 py-0.5">X-PAYMENT</code>{" "}
                proof for the Solana transaction.
              </p>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Built for signal</h2>
          <p className="text-muted-foreground">
            A paid inbox works anywhere attention is scarce.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card/60 backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="text-base">Founder inbox</CardTitle>
              <p className="text-sm text-muted-foreground">
                Filter inbound intros and requests without losing legitimate
                opportunities.
              </p>
            </CardHeader>
          </Card>
          <Card className="bg-card/60 backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="text-base">Support & escalation</CardTitle>
              <p className="text-sm text-muted-foreground">
                Replace “urgent” emails with a paid path that guarantees triage.
              </p>
            </CardHeader>
          </Card>
          <Card className="bg-card/60 backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="text-base">Security & on-call</CardTitle>
              <p className="text-sm text-muted-foreground">
                Route high-signal issues to the top while leaving room for normal
                messages.
              </p>
            </CardHeader>
          </Card>
          <Card className="bg-card/60 backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="text-base">API-first workflows</CardTitle>
              <p className="text-sm text-muted-foreground">
                HTTP-native paywalls let agents and tools pay, retry, and deliver
                automatically.
              </p>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section id="tiers" className="scroll-mt-24 space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Message tiers</h2>
          <p className="text-muted-foreground">
            Three tiers, one simple rule: higher tier → higher priority.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PING_TIER_ORDER.map((tier) => {
            const meta = getPingTierConfig(tier);
            const href = `/ping/${encodeURIComponent(tier)}?to=${encodeURIComponent(ownerHandle)}`;

            return (
              <Card key={tier} className="bg-card/60 backdrop-blur">
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base">{meta.label}</CardTitle>
                    <Badge variant="secondary">{meta.priceUsd}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{meta.description}</p>
                </CardHeader>
                <CardContent>
                  <Button
                    asChild
                    variant={tier === "vip" ? "brand" : "outline"}
                    className="w-full"
                  >
                    <Link href={href}>Compose</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          Tiers are enforced by a paywalled endpoint at{" "}
          <code className="rounded bg-muted px-1 py-0.5">/api/ping/send</code>.{" "}
          <Link className="underline underline-offset-4" href="/how-it-works">
            Read the flow
          </Link>
          .
        </p>
      </section>

      <Separator />

      <section id="faq" className="scroll-mt-24 space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">FAQ</h2>
          <p className="text-muted-foreground">
            The details behind a paid, spam-resistant inbox.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="wallet">
            <AccordionTrigger>Do senders need a wallet?</AccordionTrigger>
            <AccordionContent>
              A wallet is only needed when the ping endpoint requires payment.
              If a request hits an HTTP 402 paywall, the sender pays on Solana
              and the request retries with proof.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="x402">
            <AccordionTrigger>What is x402?</AccordionTrigger>
            <AccordionContent>
              x402 is an HTTP-native payment flow: a server can respond with{" "}
              <strong>402 Payment Required</strong> and payment requirements. A
              client (or UI) pays, then retries the request with an{" "}
              <code className="rounded bg-muted px-1 py-0.5">X-PAYMENT</code>{" "}
              proof.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="creator-signin">
            <AccordionTrigger>How do creators sign in?</AccordionTrigger>
            <AccordionContent>
              Creators connect their owner wallet and sign a message (no gas) to
              create an HttpOnly session cookie. The inbox and dashboard require
              that session.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="realtime">
            <AccordionTrigger>Are messages realtime?</AccordionTrigger>
            <AccordionContent>
              Messages and stats are stored in Convex so the inbox updates
              quickly and reliably without polling-heavy client code.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="mainnet">
            <AccordionTrigger>Devnet or mainnet?</AccordionTrigger>
            <AccordionContent>
              The app supports both; choose{" "}
              <code className="rounded bg-muted px-1 py-0.5">solana-devnet</code>{" "}
              or{" "}
              <code className="rounded bg-muted px-1 py-0.5">solana</code>{" "}
              via environment configuration.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="spam">
            <AccordionTrigger>What prevents spam?</AccordionTrigger>
            <AccordionContent>
              Payment is the filter. When sending a ping costs money, low-effort
              spam becomes economically irrational—while high-intent requests
              still go through.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <section className="rounded-xl border bg-card/60 p-8 backdrop-blur">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">
              Ready to try a paid ping?
            </h2>
            <p className="text-sm text-muted-foreground">
              Send a message to <span className="font-medium">@{ownerHandle}</span>{" "}
              and see the full x402 flow end-to-end.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="brand">
              <Link href={inboxHref}>Open @{ownerHandle}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/how-it-works">Read how it works</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
