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
     - `X402_NETWORK` (CAIP-2: `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1` for devnet, `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` for mainnet)
     - `X402_FACILITATOR_URL`
     - `SOLANA_RPC_URL` and `SOLANA_WS_URL` (optional overrides)
     - `PING402_CLAIM_PAY_TO_WALLET` (required; receives x402 handle-claim fees)
     - `CDP_API_KEY_ID` and `CDP_API_KEY_SECRET` (required when using the CDP facilitator URL)
     - `PING402_JWT_SECRET` (required; used for the creator HttpOnly session cookie)
     - `PING402_BADGE_MINT` + `PING402_BADGE_AUTHORITY_SECRET_KEY` (optional; enables Token-2022 supporter badges)

4. Start Next.js:

   ```bash
   pnpm dev
   ```

Open:

- `http://localhost:3000` (landing)
- `http://localhost:3000/ping` (handle search + send/claim entrypoint)
- `http://localhost:3000/u/[handle]` (public inbox)
- `http://localhost:3000/ping/standard?to=[handle]` (compose; payment on submit)
- `http://localhost:3000/r/[messageId]` (public receipt: payment + badge tx links)
- `http://localhost:3000/owner-signin` (creator handle claim/sign-in via Solana message signature)
- `http://localhost:3000/dashboard` (creator dashboard; requires creator session)
- `http://localhost:3000/inbox` (creator inbox; requires creator session)
- `http://localhost:3000/inbox/[messageId]` (creator message detail; requires creator session)
- `http://localhost:3000/api/health` (health check)

## Token-2022 supporter badges (optional)

Supporter badges mint a non-transferable Token-2022 token to the payer after a successful ping.

1. Set `PING402_BADGE_AUTHORITY_SECRET_KEY` (or `PING402_BADGE_AUTHORITY_KEYPAIR_PATH`) and ensure the authority wallet has SOL for fees.
2. Run `pnpm solana:create-badge-mint` and copy the printed mint address into `PING402_BADGE_MINT`.
