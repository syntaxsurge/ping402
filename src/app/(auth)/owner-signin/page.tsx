import { Suspense } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import OwnerSignInClient from "./sign-in-client";

export default function OwnerSignInPage() {
  return (
    <Suspense
      fallback={
        <Card className="mx-auto w-full max-w-xl bg-card/60 backdrop-blur">
          <CardContent className="space-y-3 p-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      }
    >
      <OwnerSignInClient />
    </Suspense>
  );
}
