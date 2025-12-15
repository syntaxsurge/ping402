import { X402InspectPanel } from "@/components/x402/X402InspectPanel";

export const dynamic = "force-dynamic";

export default function X402DemoPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="h2">x402 demo</h1>
        <p className="lead">
          This page is for judges and developers. It makes the 402 → pay → retry flow visible by
          showing the payment headers returned by ping402.
        </p>
        <p className="text-sm text-muted-foreground">
          If the demo endpoint fails, confirm{" "}
          <code className="rounded bg-muted px-1 py-0.5">PING402_CLAIM_PAY_TO_WALLET</code> is
          set to a valid Solana address (the demo pay-to wallet) in your environment.
        </p>
      </header>

      <X402InspectPanel />
    </div>
  );
}
