"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Coins,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  Sparkles,
  SquareArrowOutUpRight,
  Unplug,
  Wallet,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { toast } from "sonner";

import { cn } from "@/lib/utils/cn";
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type Session = { walletPubkey: string; handle: string } | null;

type NavLink = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

function shortAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

function isActivePath(pathname: string, href: string) {
  if (href.startsWith("/#")) return pathname === "/";
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/inbox") return pathname === "/inbox" || pathname.startsWith("/inbox/");
  return pathname === href;
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
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const [signingOut, setSigningOut] = useState(false);
  const signOutRef = useRef(false);
  const prevConnected = useRef<boolean>(false);

  const connectedAddress = useMemo(() => publicKey?.toBase58() ?? null, [publicKey]);

  const accountLabel = session ? `@${session.handle}` : "Account";
  const avatarFallback = useMemo(() => {
    const h = session?.handle?.trim();
    if (!h) return "U";
    return h.slice(0, 1).toUpperCase();
  }, [session?.handle]);

  const navLinks = useMemo<NavLink[]>(
    () => [
      { href: "/#how-it-works", label: "How it works", icon: BookOpen },
      { href: "/#funding", label: "Funding", icon: Coins },
      { href: "/#tiers", label: "Tiers", icon: Sparkles },
      { href: "/#faq", label: "FAQ", icon: MessageCircle },
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/inbox", label: "Inbox", icon: Inbox },
    ],
    [],
  );

  const searchAction = session ? "/inbox" : "/ping";
  const searchParam = session ? "q" : "query";
  const searchPlaceholder = session ? "Search messages…" : "Search handles…";

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
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  const active = isActivePath(pathname, item.href);
                  return (
                    <Button
                      key={item.href}
                      asChild
                      variant={active ? "secondary" : "ghost"}
                      className="justify-start"
                    >
                      <Link href={item.href}>
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        {item.label}
                      </Link>
                    </Button>
                  );
                })}
              </nav>

              <div className="grid gap-2">
                <Button asChild variant="brand">
                  <Link href="/ping">Send a ping</Link>
                </Button>
                {!session ? (
                  <Button asChild variant="outline">
                    <Link href="/owner-signin">Claim a handle</Link>
                  </Button>
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
          {navLinks.map((link) => (
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

          <DropdownMenu>
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
                {session ? (
                  <div className="font-mono text-xs text-muted-foreground">
                    {shortAddress(session.walletPubkey)}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Sign in to manage your inbox.
                  </div>
                )}
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

              {session ? (
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={`/u/${encodeURIComponent(session.handle)}`}>
                    <SquareArrowOutUpRight className="h-4 w-4" aria-hidden="true" />
                    Public page
                  </Link>
                </DropdownMenuItem>
              ) : null}

              <DropdownMenuSeparator />

              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Wallet
              </DropdownMenuLabel>
              <div className="px-2 pb-2 text-xs text-muted-foreground">
                {connectedAddress ? (
                  <div className="break-all font-mono" title={connectedAddress}>
                    {shortAddress(connectedAddress)}
                  </div>
                ) : (
                  <div>Not connected</div>
                )}
              </div>

              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => setVisible(true)}
              >
                <Wallet className="h-4 w-4" aria-hidden="true" />
                {connected ? "Change wallet" : "Connect wallet"}
              </DropdownMenuItem>

              {connected ? (
                <DropdownMenuItem
                  className="cursor-pointer"
                  disabled={signingOut}
                  onClick={() =>
                    session
                      ? void runSignOut({ disconnectWallet: true })
                      : void disconnect().catch(() => {})
                  }
                >
                  <Unplug className="h-4 w-4" aria-hidden="true" />
                  Disconnect wallet
                </DropdownMenuItem>
              ) : null}

              {session ? (
                <>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    disabled={signingOut}
                    onClick={() => void runSignOut({ disconnectWallet: true })}
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    {signingOut ? "Signing out…" : "Sign out (disconnect wallet)"}
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/owner-signin">
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                      Claim a handle
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {!session ? (
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href="/owner-signin">Claim a handle</Link>
            </Button>
          ) : null}

          <Button asChild variant="brand" size="sm" className="hidden sm:inline-flex">
            <Link href="/ping">Send a ping</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
