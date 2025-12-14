# Submission Checklist

## Required deliverables

- Public GitHub repo (open source).
- Live demo URL (Vercel recommended).
- Short demo video (2–4 minutes).
- Clear explanation of how Solana + x402 power the core workflow.
- Setup and run instructions for judges.

## Demo readiness

- `.env.example` is complete and matches production env variables.
- `docs/DEPLOYMENT.md` is accurate and reproducible.
- `docs/DEMO_SCRIPT.md` can be read verbatim for the walkthrough.
- `pnpm typecheck` and `pnpm build` pass on `main`.

## App verification

- Paid ping flow works end-to-end:
  - Public profile → choose tier → compose → x402 paywall → message stored in Convex.
- Owner flow works end-to-end:
  - Owner sign-in → dashboard stats → inbox list → message detail → status updates.
- Discovery metadata is published on the paywalled endpoint:
  - `POST /api/ping/send?tier=[tier]` returns valid x402 402 challenges and (when supported) can be listed via `/api/x402/discovery/resources`.

