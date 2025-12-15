import { getOwnerSession } from "@/lib/auth/ownerSession";
import { UnifiedHeaderClient } from "@/components/layout/UnifiedHeaderClient";

export async function UnifiedHeader() {
  const session = await getOwnerSession();
  return <UnifiedHeaderClient session={session} />;
}

