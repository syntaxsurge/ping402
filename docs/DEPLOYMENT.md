# Deployment

## Local development

1. Install deps: `pnpm install`
2. Start Convex dev: `pnpm convex:dev`
3. Copy `.env.example` into `.env.local` and set required env vars.
4. Seed the owner profile: `pnpm seed:owner`
5. Start Next.js: `pnpm dev`

## Production (Vercel + Convex)

### 1) Create a Convex production deploy key

In the Convex dashboard for this project, generate a **Production Deploy Key**.

Set it in Vercel as an environment variable:

- `CONVEX_DEPLOY_KEY` (Environment: Production)

### 2) Configure the Vercel build command

Set the Vercel **Build Command** to:

- `npx convex deploy --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL --cmd 'pnpm build'`

This deploys Convex functions and runs `pnpm build` with `NEXT_PUBLIC_CONVEX_URL` injected for the build.

### 3) Set required Vercel environment variables

Set these in Vercel (Production):

- `PING402_JWT_SECRET` (32+ chars; used for the owner HttpOnly session cookie)
- `PING402_OWNER_HANDLE`
- `PING402_OWNER_DISPLAY_NAME`
- `PING402_OWNER_BIO` (optional)

Set these for x402 payments:

- `NEXT_PUBLIC_WALLET_ADDRESS` (Solana base58 address that receives payments)
- `NEXT_PUBLIC_NETWORK` (`solana-devnet` for devnet; `solana` for mainnet)
- `NEXT_PUBLIC_FACILITATOR_URL` (facilitator base URL; defaults to `https://x402.org/facilitator`)
- If `NEXT_PUBLIC_FACILITATOR_URL` points to the CDP facilitator (`https://api.cdp.coinbase.com/platform/v2/x402`), set `CDP_API_KEY_ID` and `CDP_API_KEY_SECRET`.

Optional (Coinbase Onramp in the paywall UI):

- `NEXT_PUBLIC_CDP_CLIENT_KEY`
- `CDP_API_KEY_ID`
- `CDP_API_KEY_SECRET`

Optional (SEO / absolute URLs):

- `NEXT_PUBLIC_SITE_URL` (falls back to `VERCEL_URL` when unset)

### 4) Seed the owner profile in production

After the first deploy, run the seed script against the production Convex deployment from your local machine:

1. Export `NEXT_PUBLIC_CONVEX_URL` for your production Convex deployment.
2. Ensure the `PING402_OWNER_*` env vars are set.
3. Run: `pnpm seed:owner`

### 5) Verify production

- Health check: `GET /api/health`
- Public inbox page: `GET /u/[handle]`
- Paid ping flow: `GET /ping/[tier]?to=[handle]` → submit form → x402 paywall → message appears in owner inbox

If using a facilitator that supports discovery listing, verify via:

- `GET /api/x402/discovery/resources?type=http&limit=20&offset=0`
