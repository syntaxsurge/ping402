import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/AppHeader";
import { clearOwnerSession, getOwnerSession } from "@/lib/auth/ownerSession";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getOwnerSession();
  if (!session) redirect("/owner-signin");

  async function signOut() {
    "use server";
    await clearOwnerSession();
    redirect("/");
  }

  return (
    <div className="min-h-dvh bg-background [background-image:var(--brand-glow)] bg-no-repeat [background-position:top]">
      <AppHeader
        ownerHandle={session.handle}
        walletPubkey={session.walletPubkey}
        signOutAction={signOut}
      />
      <main className="mx-auto w-full max-w-6xl px-4 py-10">{children}</main>
    </div>
  );
}
