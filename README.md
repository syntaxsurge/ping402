# ping402

Paid inbox pings on Solana using x402 (HTTP 402 Payment Required), with messages stored in Convex.

## Prerequisites

- Node.js 18+
- `pnpm`

## Local Development

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Configure + start Convex (first time, local dev deployment):

   ```bash
   pnpm convex:dev
   ```

   After this, `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOYMENT` are written to `.env.local`.

3. Configure env vars:

   - `.env.example` and `.env.local` share the same keys. Set these required values in `.env.local`:
     - `PING402_JWT_SECRET` (required; used for the creator HttpOnly session cookie; 32+ chars)
   - Optional:
     - `NEXT_PUBLIC_SITE_URL` (used for absolute URLs; on Vercel you can omit and rely on `VERCEL_URL`)
     - `X402_NETWORK` (CAIP-2: `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1` for devnet, `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` for mainnet)
     - `X402_FACILITATOR_URL` (defaults to `https://x402.org/facilitator`)

4. Start Next.js:

   ```bash
   pnpm dev
   ```

Open:

- `http://localhost:3000` (landing)
- `http://localhost:3000/ping` (handle search + send/claim entrypoint)
- `http://localhost:3000/u/[handle]` (public inbox)
- `http://localhost:3000/ping/standard?to=[handle]` (compose + pay via connected wallet or Solana Pay QR)
- `http://localhost:3000/r/[messageId]` (public receipt)
- `http://localhost:3000/owner-signin` (creator handle claim/sign-in via Solana message signature)
- `http://localhost:3000/dashboard` (creator dashboard; requires creator session)
- `http://localhost:3000/inbox` (creator inbox; requires creator session)
- `http://localhost:3000/inbox/[messageId]` (creator message detail; requires creator session)
- `http://localhost:3000/api/health` (health check)

## Reset Convex (optional)

`pnpm convex:reset` truncates all Convex tables for the current deployment. Set `CONVEX_RESET_TOKEN` in `.env.local` before running it.
