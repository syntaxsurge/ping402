"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";

import { SolanaProvider } from "@/components/solana/SolanaProvider";
import { WalletConnectButton } from "@/components/solana/WalletConnectButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildPing402SignInMessage } from "@/lib/solana/siwsMessage";
import { isValidHandle, normalizeHandle } from "@/lib/utils/handles";

type LookupState =
  | { state: "idle" }
  | { state: "invalid" }
  | { state: "checking" }
  | { state: "available" }
  | { state: "taken"; ownerWallet: string; displayName?: string };

function shortAddress(address: string) {
  if (!address) return "";
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

function OwnerSignInInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { publicKey, signMessage } = useWallet();
  const [loading, setLoading] = useState(false);

  const initialHandle = useMemo(() => normalizeHandle(params.get("handle") ?? ""), [params]);
  const [handleInput, setHandleInput] = useState(initialHandle);
  const normalizedHandle = useMemo(() => normalizeHandle(handleInput), [handleInput]);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [lookup, setLookup] = useState<LookupState>({ state: "idle" });

  const pubkeyBase58 = useMemo(() => publicKey?.toBase58() ?? null, [publicKey]);

  useEffect(() => {
    const h = normalizedHandle;
    if (!h) return setLookup({ state: "idle" });
    if (!isValidHandle(h)) return setLookup({ state: "invalid" });

    let cancelled = false;
    setLookup({ state: "checking" });

    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/handles/lookup?handle=${encodeURIComponent(h)}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("lookup_failed");

        const data = (await res.json()) as
          | { exists: false }
          | { exists: true; ownerWallet: string; displayName?: string };

        if (cancelled) return;

        if ("exists" in data && data.exists) {
          setLookup({ state: "taken", ownerWallet: data.ownerWallet, displayName: data.displayName });
        } else {
          setLookup({ state: "available" });
        }
      } catch {
        if (!cancelled) setLookup({ state: "idle" });
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [normalizedHandle]);

  const handleTakenByOtherWallet =
    lookup.state === "taken" &&
    Boolean(pubkeyBase58) &&
    lookup.ownerWallet !== pubkeyBase58;

  const handleOwnedByConnectedWallet =
    lookup.state === "taken" &&
    Boolean(pubkeyBase58) &&
    lookup.ownerWallet === pubkeyBase58;

  async function onSignIn() {
    if (!normalizedHandle) {
      toast.error("Enter a handle to continue.");
      return;
    }
    if (!isValidHandle(normalizedHandle)) {
      toast.error("Handle must be 3–32 chars: letters, numbers, underscores, hyphens.");
      return;
    }
    if (lookup.state === "taken" && handleTakenByOtherWallet) {
      toast.error("That handle is owned by a different wallet.");
      return;
    }
    if (!pubkeyBase58) {
      toast.error("Connect a wallet first.");
      return;
    }
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
        handle: normalizedHandle,
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
          handle: normalizedHandle,
          displayName: displayName.trim() || undefined,
          bio: bio.trim() || undefined,
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
      if (message === "HANDLE_TAKEN") {
        toast.error("That handle is owned by a different wallet.");
      } else if (message === "INVALID_HANDLE") {
        toast.error("Handle must be 3–32 chars: letters, numbers, underscores, hyphens.");
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl space-y-6">
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">Creator access</Badge>
        <Badge variant="secondary">Claim a handle</Badge>
        <Badge variant="secondary">Solana signature</Badge>
      </div>

      <div className="space-y-2">
        <h1 className="text-balance text-3xl font-semibold tracking-tight">
          Claim your handle
        </h1>
        <p className="text-balance text-muted-foreground">
          Pick a handle, connect a Solana wallet, and sign a message (no SOL transfer) to manage
          your paid inbox.
        </p>
      </div>

      <Card className="bg-card/60 backdrop-blur">
        <CardHeader className="space-y-2">
          <CardTitle className="text-base">Step 1 · Choose a handle</CardTitle>
          <p className="text-sm text-muted-foreground">
            Your public inbox lives at <span className="font-mono">/u/[handle]</span>.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="handle">Handle</Label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                @
              </div>
              <Input
                id="handle"
                value={handleInput}
                onChange={(e) => setHandleInput(e.target.value)}
                placeholder="e.g. ping402"
                className="pl-7"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {lookup.state === "checking" ? "Checking availability…" : null}
              {lookup.state === "available" ? (
                <span className="text-emerald-500">
                  Available — signing will claim this handle.
                </span>
              ) : null}
              {lookup.state === "taken" ? (
                <>
                  {handleOwnedByConnectedWallet ? (
                    <span className="text-emerald-500">
                      Already claimed by this wallet — you can sign in.
                    </span>
                  ) : (
                    <>
                      Taken — owned by{" "}
                      <span className="font-mono">{shortAddress(lookup.ownerWallet)}</span>.
                    </>
                  )}
                </>
              ) : null}
              {lookup.state === "invalid" ? (
                <>Use 3–32 chars: letters, numbers, underscores, hyphens.</>
              ) : null}
              {lookup.state === "idle" ? <>Choose what people will ping.</> : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name (optional)</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Shown on your public inbox"
                maxLength={64}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio (optional)</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="One-line description"
                maxLength={280}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/60 backdrop-blur">
        <CardHeader className="space-y-2">
          <CardTitle className="text-base">Step 2 · Connect & sign</CardTitle>
          <p className="text-sm text-muted-foreground">
            Signing creates a 7‑day HttpOnly session cookie. No SOL is transferred.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <WalletConnectButton />

          {handleTakenByOtherWallet ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              This handle is owned by another wallet. Switch wallets or choose a different
              handle.
            </div>
          ) : null}

          <Separator />

          <Button
            className="w-full"
            disabled={
              loading ||
              !pubkeyBase58 ||
              !signMessage ||
              !normalizedHandle ||
              !isValidHandle(normalizedHandle) ||
              handleTakenByOtherWallet
            }
            onClick={onSignIn}
          >
            {loading ? "Signing in…" : "Sign in / Claim handle"}
          </Button>

          <p className="text-xs text-muted-foreground">
            You’ll land on your dashboard and inbox after verification.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

export default function OwnerSignInClient() {
  return (
    <SolanaProvider>
      <OwnerSignInInner />
    </SolanaProvider>
  );
}

