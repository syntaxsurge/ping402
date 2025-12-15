import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShellClient } from "@/components/layout/AppShellClient";
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
    <AppShellClient
      ownerHandle={session.handle}
      walletPubkey={session.walletPubkey}
      signOutAction={signOut}
    >
      {children}
    </AppShellClient>
  );
}
