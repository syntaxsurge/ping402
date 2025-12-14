import type { ReactNode } from "react";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background [background-image:var(--brand-glow)] bg-no-repeat [background-position:top]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10">{children}</main>
      <SiteFooter />
    </div>
  );
}

