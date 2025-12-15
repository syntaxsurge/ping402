"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Inbox,
  LayoutDashboard,
  type LucideIcon,
  PanelLeftClose,
  PanelLeftOpen,
  SquareArrowOutUpRight,
} from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
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

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/inbox") return pathname === "/inbox" || pathname.startsWith("/inbox/");
  return pathname === href;
}

export function AppShellClient({
  ownerHandle,
  children,
}: {
  ownerHandle: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const publicHref = useMemo(
    () => `/u/${encodeURIComponent(ownerHandle)}`,
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
                <div className="text-xs font-medium text-muted-foreground">Navigation</div>
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
  );
}
