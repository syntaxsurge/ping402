import Link from "next/link";

export function SiteFooter() {
  const ownerHandle = (process.env.PING402_OWNER_HANDLE ?? "ping402")
    .trim()
    .toLowerCase();
  const publicHref = `/u/${encodeURIComponent(ownerHandle)}`;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-lg border bg-muted">
              <span
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(135deg, rgb(var(--brand-purple)), rgb(var(--brand-green)))",
                }}
                aria-hidden="true"
              />
              <span className="relative text-[11px] font-semibold text-slate-950">
                402
              </span>
            </span>
            <span>ping402</span>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            A paid inbox built on Solana and x402. Turn “send a message” into a
            single, verifiable action: pay → deliver → triage.
          </p>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold">Product</div>
          <div className="grid gap-2 text-sm">
            <Link className="text-muted-foreground hover:text-foreground" href="/how-it-works">
              How it works
            </Link>
            <Link className="text-muted-foreground hover:text-foreground" href="/#tiers">
              Tiers
            </Link>
            <Link className="text-muted-foreground hover:text-foreground" href="/#faq">
              FAQ
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold">Creators</div>
          <div className="grid gap-2 text-sm">
            <Link className="text-muted-foreground hover:text-foreground" href={publicHref}>
              Public inbox
            </Link>
            <Link className="text-muted-foreground hover:text-foreground" href="/owner-signin">
              Creator sign-in
            </Link>
            <Link className="text-muted-foreground hover:text-foreground" href="/api/health">
              Health check
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>© {year} ping402.</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>Solana settlement</span>
            <span aria-hidden="true">·</span>
            <span>x402 paywalls</span>
            <span aria-hidden="true">·</span>
            <span>HTTP-native</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

