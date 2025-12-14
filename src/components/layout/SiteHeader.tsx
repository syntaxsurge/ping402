import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme/ModeToggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function SiteHeader() {
  const ownerHandle = (process.env.PING402_OWNER_HANDLE ?? "ping402")
    .trim()
    .toLowerCase();

  const navLinks = [
    { href: "/how-it-works", label: "How it works" },
    { href: "/#tiers", label: "Tiers" },
    { href: "/#faq", label: "FAQ" },
  ] as const;

  const publicHref = `/u/${encodeURIComponent(ownerHandle)}`;

  return (
    <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-lg border bg-muted">
            <span
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgb(var(--brand-purple)), rgb(var(--brand-green)))",
              }}
              aria-hidden="true"
            />
            <span className="relative text-[11px] font-semibold text-slate-950">
              402
            </span>
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

          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/owner-signin">Creator sign-in</Link>
          </Button>

          <Button asChild variant="brand" size="sm">
            <Link href={publicHref}>Send a ping</Link>
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
                    <Link href={publicHref}>Send a ping</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/owner-signin">Creator sign-in</Link>
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
