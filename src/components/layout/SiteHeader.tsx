import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme/ModeToggle";
import { WalletHeaderButton } from "@/components/solana/WalletHeaderButton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function SiteHeader() {
  const navLinks = [
    { href: "/how-it-works", label: "How it works" },
    { href: "/fund", label: "Fund" },
    { href: "/demo/x402", label: "x402 demo" },
    { href: "/#tiers", label: "Tiers" },
    { href: "/#faq", label: "FAQ" },
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
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
          <span>ping402</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Button key={link.href} asChild variant="ghost" size="sm">
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <WalletHeaderButton />

          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/owner-signin">Claim a handle</Link>
          </Button>

          <Button asChild variant="brand" size="sm">
            <Link href="/ping">Send a ping</Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] sm:w-[360px]">
              <div className="space-y-6 pt-6">
                <div className="space-y-1">
                  <div className="text-sm font-semibold">ping402</div>
                  <p className="text-sm text-muted-foreground">
                    Paid pings, settled on Solana.
                  </p>
                </div>

                <div className="grid gap-2">
                  {navLinks.map((link) => (
                    <Button key={link.href} asChild variant="ghost" className="justify-start">
                      <Link href={link.href}>{link.label}</Link>
                    </Button>
                  ))}
                </div>

                <div className="grid gap-2">
                  <Button asChild variant="brand">
                    <Link href="/ping">Send a ping</Link>
                  </Button>
                  <WalletHeaderButton />
                  <Button asChild variant="outline">
                    <Link href="/owner-signin">Claim a handle</Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
