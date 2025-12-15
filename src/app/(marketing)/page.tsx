import Link from "next/link";
import { Check } from "lucide-react";

import { HandleSearch } from "@/components/marketing/HandleSearch";
import { InboxPreviewCard } from "@/components/marketing/InboxPreviewCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getOwnerSession } from "@/lib/auth/ownerSession";
import { getPingTierConfig, PING_TIER_ORDER, type PingTier } from "@/lib/ping/tiers";
import { getEnvServer } from "@/lib/env/env.server";
import { isSolanaDevnet, solanaNetworkLabel } from "@/lib/solana/chain";

export default async function HomePage() {
  const session = await getOwnerSession();
  const env = getEnvServer();
  const networkLabel = solanaNetworkLabel(env.X402_NETWORK);
  const isDevnet = isSolanaDevnet(env.X402_NETWORK);

  const tierBenefits: Record<PingTier, { badge: string; bullets: string[] }> = {
    standard: {
      badge: "Starter",
      bullets: ["Lowest cost signal", "Great for quick questions", "Delivered via x402 proof + retry"],
    },
    priority: {
      badge: "Most popular",
      bullets: ["Stronger urgency signal", "Ideal for time-sensitive requests", "Shows up clearly in the inbox"],
    },
    vip: {
      badge: "Highest signal",
      bullets: ["Top-tier urgency", "Best for escalations", "Premium price discourages spam"],
    },
  };

  return (
    <div className="space-y-24">
      <section className="pt-6">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:items-start">
          <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">HTTP 402 · x402</Badge>
              <Badge variant="secondary">Solana settlement</Badge>
              <Badge variant="secondary">Claimable handles</Badge>
            </div>

            <div className="space-y-3">
              <h1 className="h1">Paid pings that get answered.</h1>
              <p className="lead">
                ping402 turns “send a message” into a single, verifiable action. If you want
                priority attention, you pay. If you pay, your ping is delivered—no
                subscriptions, no spam, no guesswork.
              </p>
            </div>

	            <div className="flex flex-wrap gap-3">
	              <Button asChild variant="brand" size="lg">
	                <Link href="/ping">Send a ping</Link>
	              </Button>
	              <Button asChild variant="outline" size="lg">
	                <Link href="/#how-it-works">How it works</Link>
	              </Button>
	              {session ? (
	                <Button asChild variant="ghost" size="lg">
	                  <Link href="/inbox">Open inbox</Link>
	                </Button>
	              ) : (
	                <Button asChild variant="ghost" size="lg">
	                  <Link href="/owner-signin">Claim a handle</Link>
	                </Button>
	              )}
	            </div>

            <HandleSearch />
          </div>

          <div className="animate-in fade-in-0 zoom-in-95 duration-700 lg:justify-self-end">
            <InboxPreviewCard />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 space-y-8">
        <div className="space-y-2">
          <h2 className="h3">How it works</h2>
          <p className="muted">
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
                <code className="rounded bg-muted px-1 py-0.5">PAYMENT-SIGNATURE</code> proof
                for a Solana transaction.
              </p>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section id="funding" className="scroll-mt-24 space-y-8">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="h3">Funding</h2>
            <Badge variant="secondary" className="capitalize">
              {networkLabel}
            </Badge>
          </div>
          <p className="muted">
            You only pay when you send a ping. Keep enough balance for fees and the requested
            token (shown at checkout).
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card/60 backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="text-base">Devnet</CardTitle>
              <p className="text-sm text-muted-foreground">
                Recommended for demos and testing. Use a faucet for devnet SOL.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Faucet:{" "}
                <a
                  className="text-primary underline-offset-4 hover:underline"
                  href="https://faucet.solana.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  faucet.solana.com
                </a>
              </p>
              {isDevnet ? (
                <p className="text-xs">
                  This environment is currently configured for devnet.
                </p>
              ) : (
                <p className="text-xs">
                  Switch your environment to devnet if you want faucet-funded testing.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="text-base">Mainnet</CardTitle>
              <p className="text-sm text-muted-foreground">
                For real users. Ensure you have SOL for fees and the required token balance.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="text-xs">
                If you’re paying with a token (like a stablecoin), the paywall specifies the mint
                and amount at checkout.
              </p>
              <p className="text-xs">
                Tip: Keep a small SOL buffer so retries can settle cleanly.
              </p>
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground">
          Need more detail? Open the Funding section anytime from the top navigation.
        </p>
      </section>

      <section className="space-y-8">
        <div className="space-y-2">
          <h2 className="h3">Built for signal</h2>
          <p className="muted">
            A paid inbox works anywhere attention is scarce.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card/60 backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="text-base">Founder inbox</CardTitle>
              <p className="text-sm text-muted-foreground">
                Filter inbound intros and requests without losing legitimate opportunities.
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
                Route high-signal issues to the top while leaving room for normal messages.
              </p>
            </CardHeader>
          </Card>
          <Card className="bg-card/60 backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="text-base">API-first workflows</CardTitle>
              <p className="text-sm text-muted-foreground">
                HTTP-native paywalls let agents and tools pay, retry, and deliver automatically.
              </p>
            </CardHeader>
          </Card>
        </div>
      </section>

	      <section id="tiers" className="scroll-mt-24 space-y-8">
	        <div className="space-y-2">
	          <h2 className="h3">Message tiers</h2>
	          <p className="muted">
	            Three tiers, one simple rule: higher tier → higher priority.
	          </p>
	        </div>

	        <div className="grid gap-4 md:grid-cols-3">
	          {PING_TIER_ORDER.map((tier) => {
	            const meta = getPingTierConfig(tier);
	            const variant =
	              tier === "vip" ? "brand" : tier === "priority" ? "default" : "outline";
	            const highlight = tier === "vip";
	            const benefits = tierBenefits[tier];

	            return (
	              <Card
	                key={tier}
	                className={
	                  highlight
	                    ? "overflow-hidden border-primary/30 bg-card/60 shadow-md backdrop-blur"
	                    : "bg-card/60 backdrop-blur"
	                }
	              >
	                {highlight ? (
	                  <div
	                    className="h-1 w-full bg-gradient-to-r from-[rgb(var(--brand-purple-strong))] to-[rgb(var(--brand-green-strong))]"
	                    aria-hidden="true"
	                  />
	                ) : null}
	                <CardHeader className="space-y-4">
	                  <div className="flex items-start justify-between gap-4">
	                    <div className="space-y-1">
	                      <CardTitle className="text-base">{meta.label}</CardTitle>
	                      <div className="text-3xl font-semibold tracking-tight">
	                        {meta.priceUsd}
	                      </div>
	                      <p className="text-sm text-muted-foreground">{meta.description}</p>
	                    </div>
	                    <Badge variant={highlight ? "default" : "secondary"}>{benefits.badge}</Badge>
	                  </div>
	                </CardHeader>
	                <CardContent className="space-y-4">
	                  <ul className="space-y-2 text-sm text-muted-foreground">
	                    {benefits.bullets.map((bullet) => (
	                      <li key={bullet} className="flex gap-2">
	                        <Check className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
	                        <span>{bullet}</span>
	                      </li>
	                    ))}
	                  </ul>
	                  <Button asChild variant={variant} className="w-full">
	                    <Link href="/ping">Choose a creator</Link>
	                  </Button>
	                </CardContent>
	              </Card>
	            );
	          })}
	        </div>

        <p className="text-xs text-muted-foreground">
          Tiers are enforced by a paywalled endpoint at{" "}
          <code className="rounded bg-muted px-1 py-0.5">/api/ping/send</code>.{" "}
          <Link className="underline underline-offset-4" href="/#how-it-works">
            Read the flow
          </Link>
          .
        </p>
      </section>

      <Separator />

      <section id="faq" className="scroll-mt-24 space-y-8">
        <div className="space-y-2">
          <h2 className="h3">FAQ</h2>
          <p className="muted">
            The details behind a paid, spam-resistant inbox.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="wallet">
            <AccordionTrigger>Do senders need a wallet?</AccordionTrigger>
            <AccordionContent>
              A wallet is only needed when the ping endpoint requires payment. If a request
              hits an HTTP 402 paywall, the sender pays on Solana and the request retries with
              proof.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="x402">
            <AccordionTrigger>What is x402?</AccordionTrigger>
            <AccordionContent>
              x402 is an HTTP-native payment flow: a server can respond with{" "}
              <strong>402 Payment Required</strong> and payment requirements. A client (or UI)
              pays, then retries the request with an{" "}
              <code className="rounded bg-muted px-1 py-0.5">PAYMENT-SIGNATURE</code> proof.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="creator-signin">
            <AccordionTrigger>How do creators sign in?</AccordionTrigger>
            <AccordionContent>
              Creators pick a handle, connect a Solana wallet, and sign a message (no SOL
              transfer). Handle claims are free, and a creator session cookie is set after
              verification. The dashboard and inbox require that session.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="realtime">
            <AccordionTrigger>Are messages realtime?</AccordionTrigger>
            <AccordionContent>
              Messages and stats are stored in Convex so the inbox updates quickly and reliably
              without polling-heavy client code.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="mainnet">
            <AccordionTrigger>Devnet or mainnet?</AccordionTrigger>
            <AccordionContent>
              The app supports both; set{" "}
              <code className="rounded bg-muted px-1 py-0.5">X402_NETWORK</code> to the Solana
              CAIP-2 chain id for{" "}
              <code className="rounded bg-muted px-1 py-0.5">
                solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1
              </code>{" "}
              (devnet) or{" "}
              <code className="rounded bg-muted px-1 py-0.5">
                solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp
              </code>{" "}
              (mainnet).
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="spam">
            <AccordionTrigger>What prevents spam?</AccordionTrigger>
            <AccordionContent>
              Payment is the filter. When sending a ping costs money, low-effort spam becomes
              economically irrational—while high-intent requests still go through.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

	      <section className="rounded-xl border bg-card/60 p-8 backdrop-blur">
	        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
	          <div className="space-y-2">
	            <h2 className="h4">Ready to get started?</h2>
	            <p className="muted">
	              {session
	                ? "Jump back into your inbox, or share your public page."
	                : "Find a creator inbox to send a paid ping, or claim your handle to start receiving them."}
	            </p>
	          </div>
	          <div className="flex flex-wrap gap-3">
	            <Button asChild variant="brand">
	              <Link href="/ping">Send a ping</Link>
	            </Button>
	            {session ? (
	              <>
	                <Button asChild variant="outline">
	                  <Link href="/inbox">Open inbox</Link>
	                </Button>
	                <Button asChild variant="ghost">
	                  <Link href={`/u/${encodeURIComponent(session.handle)}`}>View public page</Link>
	                </Button>
	              </>
	            ) : (
	              <Button asChild variant="outline">
	                <Link href="/owner-signin">Claim a handle</Link>
	              </Button>
	            )}
	          </div>
	        </div>
	      </section>
	    </div>
	  );
}
