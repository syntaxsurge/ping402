"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div id="content" tabIndex={-1} className="container-page py-10 sm:py-12">
      <div className="mx-auto max-w-lg">
        <Card className="bg-card/60 backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">Something went wrong</CardTitle>
            <p className="text-sm text-muted-foreground">
              Try again, or head back home.
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => reset()}>
              Retry
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
