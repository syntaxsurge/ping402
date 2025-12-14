"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";

import { SolanaProvider } from "@/components/solana/SolanaProvider";
import { WalletConnectButton } from "@/components/solana/WalletConnectButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { buildPing402SignInMessage } from "@/lib/solana/siwsMessage";

function OwnerSignInInner() {
  const router = useRouter();
  const { publicKey, signMessage } = useWallet();
  const [loading, setLoading] = useState(false);

  const pubkeyBase58 = useMemo(() => publicKey?.toBase58() ?? null, [publicKey]);
  const expectedWallet = process.env.NEXT_PUBLIC_WALLET_ADDRESS?.trim() || null;
  const walletMismatch =
    Boolean(expectedWallet) && Boolean(pubkeyBase58) && pubkeyBase58 !== expectedWallet;

  async function onSignIn() {
    if (!pubkeyBase58) return;
    if (!signMessage) {
      toast.error("Wallet does not support message signing.");
      return;
    }

    setLoading(true);
    try {
      const nonceRes = await fetch("/api/auth/nonce", { method: "POST" });
      if (!nonceRes.ok) throw new Error("Failed to get nonce.");
      const { nonce, issuedAt, chainId } = (await nonceRes.json()) as {
        nonce: string;
        issuedAt: string;
        chainId: string;
      };

      const message = buildPing402SignInMessage({
        domain: window.location.host,
        uri: window.location.origin,
        publicKey: pubkeyBase58,
        nonce,
        issuedAt,
        chainId,
      });

      const encoded = new TextEncoder().encode(message);
      const sig = await signMessage(encoded);

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          publicKey: pubkeyBase58,
          signature: Array.from(sig),
          nonce,
          issuedAt,
        }),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json().catch(() => ({}));
        throw new Error(err?.error?.code ?? "Sign-in failed");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign-in failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-2 lg:items-start">
      <section className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Creator access</Badge>
          <Badge variant="secondary">Solana signature</Badge>
          <Badge variant="secondary">HttpOnly session</Badge>
        </div>

        <div className="space-y-3">
          <h1 className="text-balance text-3xl font-semibold tracking-tight">
            Creator sign-in
          </h1>
          <p className="text-balance text-muted-foreground">
            Connect your owner wallet and sign a message (no gas) to manage your
            paid inbox. Senders never need an account—only payment proof when
            required.
          </p>
        </div>

        <Card className="bg-card/60 backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">What gets signed?</CardTitle>
            <p className="text-sm text-muted-foreground">
              A short message that includes your domain, timestamp, and a one-time
              nonce to prevent replay.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="list-disc space-y-1 pl-5">
              <li>No SOL is transferred.</li>
              <li>The signature creates a 7-day session cookie.</li>
              <li>Only the configured owner wallet is accepted.</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <Card className="bg-card/60 backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">Sign in</CardTitle>
            <p className="text-sm text-muted-foreground">
              Step 1: connect wallet. Step 2: sign message.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <WalletConnectButton />

            {walletMismatch ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                Connected wallet does not match the configured owner wallet. Switch
                to{" "}
                <span className="font-mono">
                  {expectedWallet?.slice(0, 4)}…{expectedWallet?.slice(-4)}
                </span>
                .
              </div>
            ) : null}

            <Separator />

            <Button
              className="w-full"
              disabled={!pubkeyBase58 || !signMessage || loading || walletMismatch}
              onClick={onSignIn}
            >
              {loading ? "Signing in…" : "Sign in to inbox"}
            </Button>

            <p className="text-xs text-muted-foreground">
              After signing in, you’ll land on the dashboard and manage message
              status in the inbox.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

export default function OwnerSignInPage() {
  return (
    <SolanaProvider>
      <OwnerSignInInner />
    </SolanaProvider>
  );
}
