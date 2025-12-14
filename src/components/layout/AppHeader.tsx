import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";

import { ModeToggle } from "@/components/theme/ModeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

function shortAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function AppHeader({
  ownerHandle,
  walletPubkey,
  signOutAction,
}: {
  ownerHandle: string;
  walletPubkey: string;
  signOutAction: () => Promise<void>;
}) {
  const publicHref = `/u/${encodeURIComponent(ownerHandle)}`;

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/inbox", label: "Inbox" },
    { href: publicHref, label: "Public page" },
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
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
          <span>ping402</span>
          <Badge variant="outline" className="hidden sm:inline-flex">
            owner
          </Badge>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Button key={link.href} asChild variant="ghost" size="sm">
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="hidden font-mono text-xs lg:inline-flex"
            title={walletPubkey}
          >
            {shortAddress(walletPubkey)}
          </Badge>

          <ModeToggle />

          <form action={signOutAction} className="hidden sm:block">
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] sm:w-[360px]">
              <div className="space-y-6 pt-6">
                <div className="space-y-1">
                  <div className="text-sm font-semibold">Owner workspace</div>
                  <p className="text-sm text-muted-foreground">
                    Signed in as{" "}
                    <span className="font-mono">{shortAddress(walletPubkey)}</span>
                    .
                  </p>
                </div>

                <div className="grid gap-2">
                  {navLinks.map((link) => (
                    <Button
                      key={link.href}
                      asChild
                      variant="ghost"
                      className="justify-start"
                    >
                      <Link href={link.href}>{link.label}</Link>
                    </Button>
                  ))}
                </div>

                <form action={signOutAction}>
                  <Button type="submit" variant="outline" className="w-full">
                    Sign out
                  </Button>
                </form>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
