"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function normalizeHandle(raw: string): string {
  return raw.trim().replace(/^@/, "").toLowerCase();
}

export function HandleLookup({
  defaultHandle,
}: {
  defaultHandle: string;
}) {
  const router = useRouter();
  const [handle, setHandle] = useState(defaultHandle);
  const [submitted, setSubmitted] = useState(false);

  const normalized = useMemo(() => normalizeHandle(handle), [handle]);
  const isValid = normalized.length > 0;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!isValid) return;
    router.push(`/u/${encodeURIComponent(normalized)}`);
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full">
          <label htmlFor="handle-lookup" className="sr-only">
            Creator handle
          </label>
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
            @
          </div>
          <Input
            id="handle-lookup"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="creator handle (e.g. ping402)"
            className="pl-7"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={submitted && !isValid}
          />
        </div>
        <Button type="submit" className="sm:w-auto" disabled={!isValid}>
          Open inbox
        </Button>
      </div>
      {submitted && !isValid ? (
        <p className="mt-2 text-xs text-destructive">Enter a handle to continue.</p>
      ) : null}
    </form>
  );
}

