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

   - Copy `.env.example` values into `.env.local` and set:
     - `NEXT_PUBLIC_WALLET_ADDRESS`
     - `NEXT_PUBLIC_NETWORK` (`solana-devnet` or `solana`)
     - `NEXT_PUBLIC_FACILITATOR_URL`
     - `NEXT_PUBLIC_CDP_CLIENT_KEY` (optional; enables Coinbase Onramp button in paywall UI)
     - `CDP_API_KEY_ID` and `CDP_API_KEY_SECRET` (optional; used by `/api/x402/session-token`)
     - `PING402_JWT_SECRET` (required; used for the owner HttpOnly session cookie)
     - `PING402_OWNER_HANDLE`, `PING402_OWNER_DISPLAY_NAME`, `PING402_OWNER_BIO`

4. Seed the owner profile:

   ```bash
   pnpm seed:owner
   ```

5. Start Next.js:

   ```bash
   pnpm dev
   ```

Open:

- `http://localhost:3000` (landing)
- `http://localhost:3000/u/[handle]` (public inbox)
- `http://localhost:3000/ping/standard?to=[handle]` (compose; payment on submit)
- `http://localhost:3000/owner-signin` (owner login via Solana message signature)
- `http://localhost:3000/dashboard` (owner dashboard; requires owner session)
- `http://localhost:3000/inbox` (owner inbox; requires owner session)
- `http://localhost:3000/inbox/[messageId]` (owner message detail; requires owner session)
- `http://localhost:3000/api/health` (health check)
