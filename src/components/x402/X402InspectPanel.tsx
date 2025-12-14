"use client";

import { useMemo, useState } from "react";
import { decodePaymentRequiredHeader } from "@x402/core/http";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type InspectState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "done";
      httpStatus: number;
      headers: Record<string, string>;
      paymentRequired: unknown | null;
      body: string;
    }
  | { status: "error"; message: string };

function pickHeaders(all: Headers) {
  const keys = [
    "payment-required",
    "payment-signature",
    "payment-response",
    "x-payment",
    "x-payment-response",
    "content-type",
  ];
  const out: Record<string, string> = {};
  for (const key of keys) {
    const value = all.get(key);
    if (value) out[key] = value;
  }
  return out;
}

function decodePaymentRequired(headers: Record<string, string>): unknown | null {
  const header = headers["payment-required"];
  if (!header) return null;
  try {
    return decodePaymentRequiredHeader(header);
  } catch {
    return null;
  }
}

export function X402InspectPanel() {
  const [state, setState] = useState<InspectState>({ status: "idle" });

  const endpoint = useMemo(() => "/api/x402/demo", []);

  async function run() {
    setState({ status: "loading" });
    try {
      const res = await fetch(endpoint, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      const headers = pickHeaders(res.headers);
      const paymentRequired = decodePaymentRequired(headers);
      const text = await res.text();

      setState({
        status: "done",
        httpStatus: res.status,
        headers,
        paymentRequired,
        body: text.slice(0, 6000),
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Request failed.";
      setState({ status: "error", message });
    }
  }

  return (
    <Card className="bg-card/60 backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="text-base">Inspect x402 response</CardTitle>
        <p className="text-sm text-muted-foreground">
          This calls <code>/api/x402/demo</code> without a payment header to demonstrate the
          canonical <strong>HTTP 402</strong> flow.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={run} disabled={state.status === "loading"} className="w-full sm:w-auto">
            {state.status === "loading" ? "Inspecting…" : "Run inspection"}
          </Button>
        </div>

        {state.status === "done" ? (
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/30 p-3">
              <div className="text-xs text-muted-foreground">HTTP status</div>
              <div className="mt-1 font-mono text-sm">{state.httpStatus}</div>
            </div>

            <div className="rounded-md border bg-muted/30 p-3">
              <div className="text-xs font-medium">Relevant headers</div>
              <pre className="mt-2 overflow-auto text-xs">
                {JSON.stringify(state.headers, null, 2)}
              </pre>
            </div>

            <div className="rounded-md border bg-muted/30 p-3">
              <div className="text-xs font-medium">
                Decoded <code>payment-required</code> (if present)
              </div>
              <pre className="mt-2 overflow-auto text-xs">
                {JSON.stringify(state.paymentRequired, null, 2)}
              </pre>
            </div>

            <div className="rounded-md border bg-muted/30 p-3">
              <div className="text-xs font-medium">Body (truncated)</div>
              <pre className="mt-2 overflow-auto text-xs">{state.body}</pre>
            </div>
          </div>
        ) : null}

        {state.status === "error" ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {state.message}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

