import type { ReactNode } from "react";

import { UnifiedHeader } from "@/components/layout/UnifiedHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background [background-image:var(--brand-glow)] bg-no-repeat [background-position:top]">
      <UnifiedHeader />
      <main id="content" tabIndex={-1} className="container-page py-10 sm:py-12">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
