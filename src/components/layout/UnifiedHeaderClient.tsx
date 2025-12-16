"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  Coins,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  RefreshCcw,
  Search,
  Sparkles,
  SquareArrowOutUpRight,
  Wallet,
} from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { toast } from "sonner";

import { cn } from "@/lib/utils/cn";
import { buildPing402SignInMessage } from "@/lib/solana/siwsMessage";
import { useWalletModal } from "@/components/solana/WalletModal";
import { ModeToggle } from "@/components/theme/ModeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type Session = { walletPubkey: string; handle: string } | null;

type NavLink = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type HomeLink = {
  id: "how-it-works" | "funding" | "tiers" | "faq";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type WalletProfile = { handle: string; displayName?: string } | null;

function shortAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

const USDC_MINT_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDC_MINT_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

function getUsdcMintForEndpoint(endpoint: string): string {
  return endpoint.toLowerCase().includes("devnet") ? USDC_MINT_DEVNET : USDC_MINT_MAINNET;
}

function formatUnits(
  baseUnits: bigint,
  decimals: number,
  { maxFractionDigits }: { maxFractionDigits: number },
) {
  const negative = baseUnits < BigInt(0);
  const abs = negative ? -baseUnits : baseUnits;

  let s = abs.toString();
  if (decimals <= 0) return `${negative ? "-" : ""}${s.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  if (s.length <= decimals) s = s.padStart(decimals + 1, "0");

  const integer = s.slice(0, -decimals);
  let fraction = s.slice(-decimals).replace(/0+$/, "");
  if (fraction.length > maxFractionDigits) {
    fraction = fraction.slice(0, maxFractionDigits).replace(/0+$/, "");
  }

  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const value = fraction ? `${formattedInteger}.${fraction}` : formattedInteger;
  return `${negative ? "-" : ""}${value}`;
}

function isActivePath(pathname: string, href: string) {
  if (href.startsWith("/#")) return false;
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/inbox") return pathname === "/inbox" || pathname.startsWith("/inbox/");
  return pathname === href;
}

async function getProfileForWallet(walletPubkey: string): Promise<WalletProfile> {
  const res = await fetch(
    `/api/profiles/by-owner-wallet?walletPubkey=${encodeURIComponent(walletPubkey)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );

  if (!res.ok) return null;

  const data = (await res.json()) as { profile: WalletProfile };
  return data.profile;
}

async function getAuthNonce() {
  const res = await fetch("/api/auth/nonce", {
    method: "POST",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw new Error("NONCE_FAILED");

  return (await res.json()) as { nonce: string; issuedAt: string; chainId: string };
}

async function verifyAuthSignature(input: {
  publicKey: string;
  signatureB64: string;
  nonce: string;
  issuedAt: string;
  handle: string;
}) {
  const res = await fetch("/api/auth/verify", {
    method: "POST",
    headers: { Accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({
      publicKey: input.publicKey,
      signature: input.signatureB64,
      nonce: input.nonce,
      issuedAt: input.issuedAt,
      handle: input.handle,
    }),
  });

  if (res.ok) return;

  const data = (await res.json().catch(() => null)) as
    | { error?: { code?: string } }
    | null;
  const code = data?.error?.code ?? "SIGN_IN_FAILED";
  throw new Error(code);
}

async function serverSignOut() {
  const res = await fetch("/api/auth/signout", {
    method: "POST",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error("SIGN_OUT_FAILED");
  }
}

export function UnifiedHeaderClient({ session }: { session: Session }) {
  const pathname = usePathname();
  const router = useRouter();
  const { connection } = useConnection();
  const { publicKey, connected, disconnect, signMessage } = useWallet();
  const { setVisible } = useWalletModal();

  const [signingOut, setSigningOut] = useState(false);
  const signOutRef = useRef(false);
  const prevConnected = useRef<boolean>(false);

  const connectedAddress = useMemo(() => publicKey?.toBase58() ?? null, [publicKey]);

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [balancesError, setBalancesError] = useState(false);
  const [balances, setBalances] = useState<{
    solLamports: number;
    usdcBaseUnits: bigint;
  } | null>(null);
  const balanceRequestRef = useRef(0);
  const lastBalanceFetchRef = useRef<{ wallet: string; at: number } | null>(null);

  const [walletProfile, setWalletProfile] = useState<WalletProfile>(null);
  const [walletProfileLoading, setWalletProfileLoading] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const signInRef = useRef(false);

  useEffect(() => {
    if (session) {
      setWalletProfile(null);
      return;
    }

    if (!connectedAddress) {
      setWalletProfile(null);
      return;
    }

    let cancelled = false;
    setWalletProfile(null);
    setWalletProfileLoading(true);

    void getProfileForWallet(connectedAddress)
      .then((profile) => {
        if (cancelled) return;
        setWalletProfile(profile);
      })
      .catch(() => {
        if (cancelled) return;
        setWalletProfile(null);
      })
      .finally(() => {
        if (cancelled) return;
        setWalletProfileLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [connectedAddress, session]);

  const accountLabel = session ? `@${session.handle}` : "Account";
  const avatarFallback = useMemo(() => {
    const h = session?.handle?.trim();
    if (!h) return "U";
    return h.slice(0, 1).toUpperCase();
  }, [session?.handle]);

  const homeLinks = useMemo<HomeLink[]>(
    () => [
      { id: "how-it-works", label: "How it works", icon: BookOpen },
      { id: "funding", label: "Funding", icon: Coins },
      { id: "tiers", label: "Tiers", icon: Sparkles },
      { id: "faq", label: "FAQ", icon: MessageCircle },
    ],
    [],
  );

  const appLinks = useMemo<NavLink[]>(
    () => [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/inbox", label: "Inbox", icon: Inbox },
    ],
    [],
  );

  const searchAction = session ? "/inbox" : "/ping";
  const searchParam = session ? "q" : "query";
  const searchPlaceholder = session ? "Search messages…" : "Search handles…";

  const scrollToHomeSection = useCallback(
    (id: HomeLink["id"]) => {
      const hash = `#${id}`;

      if (pathname !== "/") {
        router.push(`/${hash}`);
        return;
      }

      const el = document.getElementById(id);
      if (!el) {
        router.push(`/${hash}`);
        return;
      }

      el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `/${hash}`);
    },
    [pathname, router],
  );

  const runSignOut = useCallback(async ({ disconnectWallet }: { disconnectWallet: boolean }) => {
    if (signOutRef.current) return;
    signOutRef.current = true;
    setSigningOut(true);

    try {
      if (disconnectWallet && connected) {
        try {
          await disconnect();
        } catch {
          // Continue sign-out even if wallet disconnect fails.
        }
      }

      await serverSignOut();
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Sign out failed. Please try again.");
    } finally {
      setSigningOut(false);
      signOutRef.current = false;
    }
  }, [connected, disconnect, router]);

  const runSignIn = useCallback(async () => {
    if (signInRef.current) return;
    if (!connectedAddress) return;

    const handle = walletProfile?.handle;
    if (!handle) return;

    if (!signMessage) {
      toast.error("Wallet does not support message signing.");
      return;
    }

    signInRef.current = true;
    setSigningIn(true);

    try {
      const { nonce, issuedAt, chainId } = await getAuthNonce();

      const message = buildPing402SignInMessage({
        domain: window.location.host,
        uri: window.location.origin,
        publicKey: connectedAddress,
        handle,
        nonce,
        issuedAt,
        chainId,
      });

      const encoded = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(encoded);
      const signatureB64 = btoa(String.fromCharCode(...signatureBytes));

      await verifyAuthSignature({
        publicKey: connectedAddress,
        signatureB64,
        nonce,
        issuedAt,
        handle,
      });

      toast.success(`Signed in as @${handle}`);
      router.refresh();
    } catch (err: unknown) {
      const code = err instanceof Error ? err.message : "SIGN_IN_FAILED";
      const message =
        code === "RATE_LIMITED"
          ? "Too many attempts. Try again soon."
          : code === "NONCE_EXPIRED" || code === "NONCE_NOT_FOUND"
            ? "Sign-in nonce expired. Please try again."
            : code === "INVALID_SIGNATURE"
              ? "Signature verification failed. Please try again."
              : "Sign in failed. Please try again.";
      toast.error(message);
    } finally {
      setSigningIn(false);
      signInRef.current = false;
    }
  }, [connectedAddress, router, signMessage, walletProfile?.handle]);

  const refreshBalances = useCallback(
    async ({ force }: { force?: boolean } = {}) => {
      if (!publicKey) return;

      const walletAddress = publicKey.toBase58();
      const last = lastBalanceFetchRef.current;
      if (!force && last && last.wallet === walletAddress && Date.now() - last.at < 20_000) return;

      const requestId = ++balanceRequestRef.current;
      lastBalanceFetchRef.current = { wallet: walletAddress, at: Date.now() };

      setBalancesLoading(true);
      setBalancesError(false);

      try {
        const usdcMint = new PublicKey(getUsdcMintForEndpoint(connection.rpcEndpoint));

        const [solLamports, usdcAccounts] = await Promise.all([
          connection.getBalance(publicKey, "confirmed"),
          connection.getParsedTokenAccountsByOwner(publicKey, { mint: usdcMint }, "confirmed"),
        ]);

        let usdcBaseUnits = BigInt(0);
        for (const item of usdcAccounts.value) {
          const parsed = item.account.data.parsed as unknown;
          const amount = (parsed as { info?: { tokenAmount?: { amount?: string } } })?.info
            ?.tokenAmount?.amount;
          if (typeof amount === "string") {
            usdcBaseUnits += BigInt(amount);
          }
        }

        if (balanceRequestRef.current !== requestId) return;
        setBalances({ solLamports, usdcBaseUnits });
      } catch {
        if (balanceRequestRef.current !== requestId) return;
        setBalances(null);
        setBalancesError(true);
      } finally {
        if (balanceRequestRef.current !== requestId) return;
        setBalancesLoading(false);
      }
    },
    [connection, publicKey],
  );

  useEffect(() => {
    if (!accountMenuOpen) return;
    if (!publicKey) {
      setBalances(null);
      setBalancesError(false);
      setBalancesLoading(false);
      return;
    }

    void refreshBalances().catch(() => undefined);
  }, [accountMenuOpen, publicKey, refreshBalances]);

  const solBalanceText = useMemo(() => {
    if (!balances) return "—";
    return formatUnits(BigInt(balances.solLamports), 9, { maxFractionDigits: 4 });
  }, [balances]);

  const usdcBalanceText = useMemo(() => {
    if (!balances) return "—";
    return formatUnits(balances.usdcBaseUnits, 6, { maxFractionDigits: 2 });
  }, [balances]);

  useEffect(() => {
    const wasConnected = prevConnected.current;
    prevConnected.current = connected;

    if (!session) return;
    if (signOutRef.current) return;

    if (wasConnected && !connected) {
      void runSignOut({ disconnectWallet: false });
      return;
    }
  }, [connected, runSignOut, session]);

  return (
	    <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
	      <div className="container-page flex h-16 items-center gap-3">
	        <Sheet>
	          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[320px] sm:w-[360px]">
            <div className="space-y-6 pt-6">
              <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
                <span className="relative h-9 w-9 overflow-hidden rounded-lg border bg-muted">
                  <Image
                    src="/images/ping402-logo.png"
                    alt="ping402 logo"
                    fill
                    sizes="36px"
                    className="object-contain p-1"
                    priority
                  />
                </span>
                <span>ping402</span>
              </Link>

	              <nav className="grid gap-2">
		                <div className="px-2 pt-1 text-xs font-semibold text-muted-foreground">
		                  Home
		                </div>
		                {homeLinks.map((item) => {
		                  const Icon = item.icon;
		                  return (
		                    <SheetClose key={item.id} asChild>
		                      <Button
		                        type="button"
		                        variant="ghost"
		                        className="justify-start"
		                        onClick={() => scrollToHomeSection(item.id)}
		                      >
		                        <Icon className="h-4 w-4" aria-hidden="true" />
		                        {item.label}
		                      </Button>
		                    </SheetClose>
		                  );
		                })}
	
	                <div className="px-2 pt-2 text-xs font-semibold text-muted-foreground">
	                  Creator
	                </div>
		                {appLinks.map((item) => {
		                  const Icon = item.icon;
		                  const active = isActivePath(pathname, item.href);
		                  return (
		                    <SheetClose key={item.href} asChild>
		                      <Button
		                        asChild
		                        variant={active ? "secondary" : "ghost"}
		                        className="justify-start"
		                      >
		                        <Link href={item.href}>
		                          <Icon className="h-4 w-4" aria-hidden="true" />
		                          {item.label}
		                        </Link>
		                      </Button>
		                    </SheetClose>
		                  );
		                })}
	              </nav>

	              <div className="grid gap-2">
	                <Button asChild variant="brand">
	                  <Link href="/ping">Send a ping</Link>
	                </Button>
	                {!session ? (
	                  !connectedAddress ? (
	                    <SheetClose asChild>
	                      <Button type="button" variant="outline" onClick={() => setVisible(true)}>
	                        Connect wallet
	                      </Button>
	                    </SheetClose>
	                  ) : walletProfileLoading ? (
	                    <Button type="button" variant="outline" disabled>
	                      Checking wallet…
	                    </Button>
	                  ) : walletProfile?.handle ? (
	                    <SheetClose asChild>
	                      <Button
	                        type="button"
	                        variant="outline"
	                        disabled={signingIn || !signMessage}
	                        onClick={() => void runSignIn()}
	                      >
	                        {signingIn ? "Signing…" : `Sign in @${walletProfile.handle}`}
	                      </Button>
	                    </SheetClose>
	                  ) : (
	                    <Button asChild variant="outline">
	                      <Link href="/owner-signin">Claim a handle</Link>
	                    </Button>
	                  )
	                ) : null}
	              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="relative h-8 w-8 overflow-hidden rounded-lg border bg-muted sm:h-9 sm:w-9">
            <Image
              src="/images/ping402-logo.png"
              alt="ping402 logo"
              fill
              sizes="(max-width: 640px) 32px, 36px"
              className="object-contain p-1"
              priority
            />
          </span>
          <span className="hidden sm:inline">ping402</span>
        </Link>

	        <nav className="hidden items-center gap-1 md:flex">
	          <DropdownMenu>
		            <DropdownMenuTrigger asChild>
		              <Button
		                variant="ghost"
		                size="sm"
		                className="gap-1"
		              >
		                Home
		                <ChevronDown className="h-4 w-4" aria-hidden="true" />
		              </Button>
		            </DropdownMenuTrigger>
		            <DropdownMenuContent align="start" className="w-56">
		              {homeLinks.map((link) => {
		                const Icon = link.icon;
		                return (
		                  <DropdownMenuItem
		                    key={link.id}
		                    className="cursor-pointer"
		                    onSelect={() => scrollToHomeSection(link.id)}
		                  >
		                    <Icon className="h-4 w-4" aria-hidden="true" />
		                    {link.label}
		                  </DropdownMenuItem>
		                );
		              })}
		            </DropdownMenuContent>
		          </DropdownMenu>

	          {appLinks.map((link) => (
	            <Button
	              key={link.href}
	              asChild
	              variant="ghost"
	              size="sm"
	              className={cn(isActivePath(pathname, link.href) && "bg-accent")}
	            >
	              <Link href={link.href}>{link.label}</Link>
	            </Button>
	          ))}
	        </nav>

        <form
          action={searchAction}
          method="GET"
          className="relative hidden flex-1 md:block md:max-w-md lg:max-w-lg"
        >
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            name={searchParam}
            placeholder={searchPlaceholder}
            className="h-10 pl-9"
            autoComplete="off"
          />
        </form>

        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />

          {session ? (
            <DropdownMenu open={accountMenuOpen} onOpenChange={setAccountMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px] font-semibold">
                      {avatarFallback}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">{accountLabel}</span>
                  <span className="sm:hidden">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="space-y-1">
                  <div className="text-sm font-medium">{accountLabel}</div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {shortAddress(session.walletPubkey)}
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/inbox">
                    <Inbox className="h-4 w-4" aria-hidden="true" />
                    Inbox
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={`/u/${encodeURIComponent(session.handle)}`}>
                    <SquareArrowOutUpRight className="h-4 w-4" aria-hidden="true" />
                    Public page
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <div className="px-2 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-muted-foreground">Balances</div>
                    {connectedAddress ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        disabled={balancesLoading}
                        onClick={() => void refreshBalances({ force: true })}
                      >
                        <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                        Refresh
                      </Button>
                    ) : null}
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border bg-muted/20 p-2">
                      <div className="text-[11px] text-muted-foreground">SOL</div>
                      <div className="mt-1 text-sm font-semibold tabular-nums">{solBalanceText}</div>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-2">
                      <div className="text-[11px] text-muted-foreground">USDC</div>
                      <div className="mt-1 text-sm font-semibold tabular-nums">{usdcBalanceText}</div>
                    </div>
                  </div>

                  {!connectedAddress ? (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Connect a wallet to load balances.
                    </div>
                  ) : balancesLoading ? (
                    <div className="mt-2 text-xs text-muted-foreground">Updating…</div>
                  ) : balancesError ? (
                    <div className="mt-2 text-xs text-destructive">Couldn’t load balances.</div>
                  ) : null}
                </div>

                <DropdownMenuItem className="cursor-pointer" onClick={() => setVisible(true)}>
                  <Wallet className="h-4 w-4" aria-hidden="true" />
                  {connected ? "Change wallet" : "Connect wallet"}
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="cursor-pointer"
                  disabled={signingOut}
                  onClick={() => void runSignOut({ disconnectWallet: true })}
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  {signingOut ? "Signing out…" : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : !connectedAddress ? (
            <Button
              type="button"
              variant="brand"
              size="sm"
              className="gap-2"
              onClick={() => setVisible(true)}
            >
              <Wallet className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Connect wallet</span>
              <span className="sm:hidden">Connect</span>
            </Button>
          ) : walletProfileLoading ? (
            <Button variant="outline" size="sm" disabled>
              <span className="hidden sm:inline">Checking wallet…</span>
              <span className="sm:hidden">Checking…</span>
            </Button>
          ) : walletProfile?.handle ? (
            <Button
              type="button"
              variant="brand"
              size="sm"
              className="gap-2"
              disabled={signingIn || !signMessage}
              onClick={() => void runSignIn()}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Sign in @{walletProfile.handle}</span>
              <span className="sm:hidden">Sign in</span>
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/owner-signin">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Claim a handle</span>
                <span className="sm:hidden">Claim</span>
              </Link>
            </Button>
          )}

          <Button asChild variant="brand" size="sm" className="hidden sm:inline-flex">
            <Link href="/ping">Send a ping</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
