"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { isValidHandle, normalizeHandle } from "@/lib/utils/handles";

type HandleSearchResult = {
  handle: string;
  exists: boolean;
  displayName?: string;
};

type HandleSearchResponse = {
  query: string;
  normalized: string;
  results: HandleSearchResult[];
  error?: { code: "TOO_SHORT" | "TOO_LONG" | "INVALID_HANDLE" | string };
};

function availabilityBadge(exists: boolean) {
  return exists ? (
    <Badge variant="secondary">Taken</Badge>
  ) : (
    <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-400">
      Available
    </Badge>
  );
}

export function HandleSearch({
  defaultValue = "",
}: {
  defaultValue?: string;
}) {
  const [input, setInput] = useState(defaultValue);
  const normalized = useMemo(() => normalizeHandle(input), [input]);
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "loading"; normalized: string }
    | { status: "ready"; data: HandleSearchResponse }
  >({ status: "idle" });

  const inflight = useRef(0);

  async function runSearch(nextNormalized: string) {
    const requestNumber = ++inflight.current;
    setState({ status: "loading", normalized: nextNormalized });

    try {
      const res = await fetch(`/api/handles/search?query=${encodeURIComponent(nextNormalized)}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as HandleSearchResponse;
      if (requestNumber !== inflight.current) return;
      setState({ status: "ready", data });
    } catch {
      if (requestNumber !== inflight.current) return;
      setState({
        status: "ready",
        data: {
          query: nextNormalized,
          normalized: nextNormalized,
          results: [],
          error: { code: "REQUEST_FAILED" },
        },
      });
    }
  }

  useEffect(() => {
    if (!normalized) {
      setState({ status: "idle" });
      return;
    }

    const t = setTimeout(() => void runSearch(normalized), 250);
    return () => clearTimeout(t);
  }, [normalized]);

  const errorText =
    state.status === "ready" && state.data.error?.code
      ? state.data.error.code === "TOO_SHORT"
        ? "Enter at least 3 characters."
        : state.data.error.code === "TOO_LONG"
          ? "Handle must be 32 characters or fewer."
          : state.data.error.code === "INVALID_HANDLE"
            ? "Use letters, numbers, underscores, hyphens."
            : "Search failed. Try again."
      : null;

  const primaryHandle = normalized && isValidHandle(normalized) ? normalized : null;

  return (
    <Card className="overflow-hidden bg-card/60 backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="text-base">Find or claim a handle</CardTitle>
        <p className="text-sm text-muted-foreground">
          Search for a creator inbox, or claim your own handle to start getting paid pings.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!normalized) return;
            void runSearch(normalized);
          }}
          className="space-y-2"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full">
              <label htmlFor="handle-search" className="sr-only">
                Handle search
              </label>
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                @
              </div>
              <Input
                id="handle-search"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search handles (e.g. ping402)"
                className="h-12 pl-7 text-base"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            <Button type="submit" variant="brand" className="h-12 px-6">
              Search
            </Button>
          </div>

          {errorText ? <p className="text-xs text-destructive">{errorText}</p> : null}
        </form>

        {state.status === "loading" ? (
          <div className="rounded-md border bg-muted/20 p-4 text-sm text-muted-foreground">
            Searching <span className="font-mono">@{state.normalized}</span>…
          </div>
        ) : null}

        {state.status === "ready" && state.data.results.length > 0 ? (
          <div className="rounded-md border bg-background">
            <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
              <div className="text-sm font-medium">Results</div>
              {primaryHandle ? (
                <div className="text-xs text-muted-foreground">
                  Showing <span className="font-mono">@{primaryHandle}</span> and suggestions
                </div>
              ) : null}
            </div>

            <div className="divide-y">
              {state.data.results.map((result) => (
                <div
                  key={result.handle}
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate font-mono text-sm">@{result.handle}</div>
                      {availabilityBadge(result.exists)}
                      {!result.exists ? (
                        <Badge variant="outline" className="text-muted-foreground">
                          Free
                        </Badge>
                      ) : null}
                    </div>
                    {result.exists && result.displayName ? (
                      <div className="mt-1 truncate text-xs text-muted-foreground">
                        {result.displayName}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {result.exists ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/u/${encodeURIComponent(result.handle)}`}>View inbox</Link>
                      </Button>
                    ) : (
                      <Button asChild size="sm" variant="brand">
                        <Link
                          href={`/owner-signin?handle=${encodeURIComponent(result.handle)}`}
                        >
                          Claim
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Separator />
            <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Claiming requires a Solana wallet signature and triggers an x402 (HTTP 402)
                payment on Solana for new handles.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="ghost">
                  <Link href="/how-it-works">How it works</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/owner-signin">Creator sign-in</Link>
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
