import { Suspense } from "react";

import OwnerSignInClient from "./sign-in-client";

export default function OwnerSignInPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-xl rounded-xl border bg-card/60 p-6 text-sm text-muted-foreground backdrop-blur">
          Loading sign-in…
        </div>
      }
    >
      <OwnerSignInClient />
    </Suspense>
  );
}

