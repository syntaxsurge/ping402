"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Inbox,
  LayoutDashboard,
  type LucideIcon,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  SquareArrowOutUpRight,
} from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { ModeToggle } from "@/components/theme/ModeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

function shortAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/inbox") return pathname === "/inbox" || pathname.startsWith("/inbox/");
  return pathname === href;
}

export function AppShellClient({
  ownerHandle,
  walletPubkey,
  signOutAction,
  children,
}: {
  ownerHandle: string;
  walletPubkey: string;
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const publicHref = useMemo(
    () => `/u/${encodeURIComponent(ownerHandle)}`,
    [ownerHandle],
  );
  const avatarFallback = useMemo(
    () => ownerHandle.trim().slice(0, 1).toUpperCase(),
    [ownerHandle],
  );

  const navItems = useMemo<NavItem[]>(
    () => [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/inbox", label: "Inbox", icon: Inbox },
      { href: publicHref, label: "Public page", icon: SquareArrowOutUpRight },
    ],
    [publicHref],
  );

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("ping402:sidebar");
    setSidebarCollapsed(stored === "collapsed");
  }, []);

  const breadcrumbs = useMemo(() => {
    if (pathname === "/dashboard") {
      return [{ href: "/dashboard", label: "Dashboard" }] as const;
    }

    if (pathname === "/inbox") {
      return [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/inbox", label: "Inbox" },
      ] as const;
    }

    if (pathname.startsWith("/inbox/")) {
      return [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/inbox", label: "Inbox" },
        { href: pathname, label: "Message" },
      ] as const;
    }

    return [{ href: "/dashboard", label: "Dashboard" }] as const;
  }, [pathname]);

  function toggleSidebar() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem("ping402:sidebar", next ? "collapsed" : "expanded");
      return next;
    });
  }

  return (
    <div className="min-h-dvh bg-background [background-image:var(--brand-glow)] bg-no-repeat [background-position:top]">
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
                <div className="space-y-1">
                  <div className="text-sm font-semibold">Creator workspace</div>
                  <p className="text-sm text-muted-foreground">
                    Signed in as <span className="font-mono">{shortAddress(walletPubkey)}</span>
                    .
                  </p>
                </div>

                <nav className="grid gap-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.href}
                        asChild
                        variant={isActivePath(pathname, item.href) ? "secondary" : "ghost"}
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

                <form action={signOutAction}>
                  <Button type="submit" variant="outline" className="w-full">
                    Sign out
                  </Button>
                </form>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
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
            <Badge variant="outline" className="hidden sm:inline-flex">
              creator
            </Badge>
          </Link>

          <form
            action="/inbox"
            method="GET"
            className="relative hidden flex-1 md:block md:max-w-md lg:max-w-lg"
          >
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              name="q"
              placeholder="Search messages…"
              className="h-10 pl-9"
              autoComplete="off"
            />
          </form>

          <div className="ml-auto flex items-center gap-2">
            <Badge
              variant="secondary"
              className="hidden font-mono text-xs lg:inline-flex"
              title={walletPubkey}
            >
              {shortAddress(walletPubkey)}
            </Badge>

            <ModeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px] font-semibold">
                      {avatarFallback}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">@{ownerHandle}</span>
                  <span className="sm:hidden">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="space-y-1">
                  <div className="text-sm font-medium">@{ownerHandle}</div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {shortAddress(walletPubkey)}
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
                  <Link href={publicHref}>
                    <SquareArrowOutUpRight className="h-4 w-4" aria-hidden="true" />
                    Public page
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action={signOutAction}>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <button type="submit" className="w-full">
                      Sign out
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container-page py-10 sm:py-12">
        <div
          className={cn(
            "grid gap-6 lg:gap-10 md:grid-cols-[240px_1fr]",
            sidebarCollapsed && "md:grid-cols-[76px_1fr]",
          )}
        >
          <aside className="hidden md:block">
            <div className="sticky top-24">
              <div className="rounded-2xl border bg-card/60 p-2 shadow-sm backdrop-blur">
                <div
                  className={cn(
                    "flex items-center justify-between gap-2 px-2 py-1.5",
                    sidebarCollapsed && "justify-center",
                  )}
                >
                  {sidebarCollapsed ? null : (
                    <div className="text-xs font-medium text-muted-foreground">
                      Navigation
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    onClick={toggleSidebar}
                  >
                    {sidebarCollapsed ? (
                      <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                </div>

                <Separator className="my-2" />

                <TooltipProvider delayDuration={150}>
                  <nav className="grid gap-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActivePath(pathname, item.href);

                      const link = (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                            active && "bg-accent text-foreground",
                            sidebarCollapsed && "justify-center px-2",
                          )}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                          {sidebarCollapsed ? null : <span className="truncate">{item.label}</span>}
                        </Link>
                      );

                      if (!sidebarCollapsed) return link;

                      return (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>{link}</TooltipTrigger>
                          <TooltipContent side="right">{item.label}</TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </nav>
                </TooltipProvider>
              </div>
            </div>
          </aside>

          <main id="content" tabIndex={-1} className="min-w-0">
            <div className="mb-6 flex items-center gap-3">
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, idx) => {
                    const isLast = idx === breadcrumbs.length - 1;

                    return (
                      <Fragment key={crumb.href}>
                        <BreadcrumbItem>
                          {isLast ? (
                            <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink asChild>
                              <Link href={crumb.href}>{crumb.label}</Link>
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                        {!isLast ? <BreadcrumbSeparator /> : null}
                      </Fragment>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
