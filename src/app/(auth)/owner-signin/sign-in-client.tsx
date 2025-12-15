"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { z } from "zod";

import { WalletConnectButton } from "@/components/solana/WalletConnectButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
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

const OwnerProfileSchema = z.object({
  handle: z
    .string()
    .trim()
    .min(3, "Handle must be 3–32 characters.")
    .max(32, "Handle must be 3–32 characters.")
    .refine((value) => isValidHandle(normalizeHandle(value)), {
      message: "Use letters, numbers, underscores, hyphens.",
    }),
  displayName: z
    .string()
    .trim()
    .max(64, "Display name must be 64 characters or fewer.")
    .refine((value) => value.length === 0 || value.length >= 2, {
      message: "Display name must be at least 2 characters.",
    }),
  bio: z.string().trim().max(280, "Bio must be 280 characters or fewer."),
});

type OwnerProfileValues = z.infer<typeof OwnerProfileSchema>;

function OwnerSignInInner() {
  const params = useSearchParams();
  const { publicKey, signMessage } = useWallet();
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [pendingForm, setPendingForm] = useState<{
    publicKey: string;
    signatureB64: string;
    nonce: string;
    issuedAt: string;
    handle: string;
    displayName?: string;
    bio?: string;
  } | null>(null);

  const initialHandle = useMemo(() => normalizeHandle(params.get("handle") ?? ""), [params]);
  const form = useForm<OwnerProfileValues>({
    resolver: zodResolver(OwnerProfileSchema),
    mode: "onChange",
    defaultValues: {
      handle: initialHandle,
      displayName: "",
      bio: "",
    },
  });

  const handleValue = form.watch("handle");
  const normalizedHandle = useMemo(() => normalizeHandle(handleValue), [handleValue]);
  const [lookup, setLookup] = useState<LookupState>({ state: "idle" });
  const errorCode = useMemo(() => params.get("error"), [params]);

  const pubkeyBase58 = useMemo(() => publicKey?.toBase58() ?? null, [publicKey]);

  useEffect(() => {
    if (!pendingForm) return;
    formRef.current?.requestSubmit();
  }, [pendingForm]);

  useEffect(() => {
    if (!errorCode) return;
    if (errorCode === "HANDLE_TAKEN") {
      toast.error("That handle is owned by a different wallet.");
      return;
    }
    if (errorCode === "INVALID_HANDLE") {
      toast.error("Handle must be 3–32 chars: letters, numbers, underscores, hyphens.");
      return;
    }
    if (errorCode === "INVALID_DISPLAY_NAME") {
      toast.error("Display name must be at least 2 characters.");
      return;
    }
    if (errorCode === "INVALID_SIGNATURE") {
      toast.error("Signature verification failed. Please try again.");
      return;
    }
    if (errorCode === "NONCE_EXPIRED" || errorCode === "NONCE_NOT_FOUND") {
      toast.error("Sign-in nonce expired. Please try again.");
      return;
    }
    if (errorCode === "RATE_LIMITED") {
      toast.error("Too many attempts. Please wait a moment and try again.");
      return;
    }
    toast.error("Sign-in failed. Please try again.");
  }, [errorCode]);

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

  const onSignIn = form.handleSubmit(async (values) => {
    const handle = normalizeHandle(values.handle);

    if (!handle) {
      toast.error("Enter a handle to continue.");
      return;
    }

    if (!isValidHandle(handle)) {
      toast.error("Handle must be 3–32 chars: letters, numbers, underscores, hyphens.");
      return;
    }

    if (lookup.state === "checking") {
      toast.message("Checking handle availability…");
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
        handle,
        nonce,
        issuedAt,
        chainId,
      });

      const encoded = new TextEncoder().encode(message);
      const sig = await signMessage(encoded);

      const signatureB64 = btoa(String.fromCharCode(...sig));
      setPendingForm({
        publicKey: pubkeyBase58,
        signatureB64,
        nonce,
        issuedAt,
        handle,
        displayName: values.displayName.trim() || undefined,
        bio: values.bio.trim() || undefined,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign-in failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  });

  return (
    <main className="mx-auto w-full max-w-xl space-y-6">
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">Creator access</Badge>
        <Badge variant="secondary">Claim a handle</Badge>
        <Badge variant="secondary">Solana signature</Badge>
      </div>

      <div className="space-y-2">
        <h1 className="h2">Claim your handle</h1>
        <p className="lead">
          Pick a handle, connect a Solana wallet, and sign a message (no SOL transfer) to manage
          your paid inbox. Handle claims are free — payments only happen when someone sends you a
          ping.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={onSignIn} className="space-y-6">
          <Card className="bg-card/60 backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="text-base">Step 1 · Choose a handle</CardTitle>
              <p className="text-sm text-muted-foreground">
                Your public inbox lives at <span className="font-mono">/u/[handle]</span>.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="handle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Handle</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                          @
                        </div>
                        <Input
                          {...field}
                          placeholder="e.g. ping402"
                          className="pl-7"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
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
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Shown on your public inbox"
                          maxLength={64}
                        />
                      </FormControl>
                      <FormDescription>Optional.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="One-line description"
                          maxLength={280}
                          className="min-h-[96px]"
                        />
                      </FormControl>
                      <FormDescription>Optional.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="text-base">Step 2 · Connect & sign</CardTitle>
              <p className="text-sm text-muted-foreground">
                Signing creates a 7‑day HttpOnly session cookie. This step does not move funds.
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

              {pendingForm ? (
                <div className="space-y-2">
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                    Verifying signature…
                  </div>
                  <Button
                    type="button"
                    variant="brand"
                    className="w-full"
                    onClick={() => formRef.current?.requestSubmit()}
                  >
                    Continue
                  </Button>
                </div>
              ) : null}

              <Button
                type="submit"
                className="w-full"
                disabled={
                  loading ||
                  Boolean(pendingForm) ||
                  !pubkeyBase58 ||
                  !signMessage ||
                  !normalizedHandle ||
                  !isValidHandle(normalizedHandle) ||
                  lookup.state === "checking" ||
                  handleTakenByOtherWallet ||
                  !form.formState.isValid
                }
              >
                {loading ? "Signing in…" : "Sign in / Claim handle"}
              </Button>

              <p className="text-xs text-muted-foreground">
                You’ll land on your dashboard and inbox after verification.
              </p>
            </CardContent>
          </Card>
        </form>
      </Form>

      {pendingForm ? (
        <form ref={formRef} action="/api/auth/verify" method="POST" className="hidden">
          <input type="hidden" name="publicKey" value={pendingForm.publicKey} />
          <input type="hidden" name="signature" value={pendingForm.signatureB64} />
          <input type="hidden" name="nonce" value={pendingForm.nonce} />
          <input type="hidden" name="issuedAt" value={pendingForm.issuedAt} />
          <input type="hidden" name="handle" value={pendingForm.handle} />
          {pendingForm.displayName ? (
            <input type="hidden" name="displayName" value={pendingForm.displayName} />
          ) : null}
          {pendingForm.bio ? <input type="hidden" name="bio" value={pendingForm.bio} /> : null}
          <button type="submit" />
        </form>
      ) : null}
    </main>
  );
}

export default function OwnerSignInClient() {
  return <OwnerSignInInner />;
}
