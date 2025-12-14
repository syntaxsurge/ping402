# Demo Script (2–4 minutes)

## 0) One-line pitch (5–10s)

ping402 is a paid inbox: anyone can message you, but sending a ping requires a small USDC payment on Solana via x402 (HTTP 402 Payment Required), which kills spam and ranks messages by tier.

## 1) Public entry (30–45s)

1. Open `GET /` and explain the value prop.
2. Navigate to `GET /how-it-works` and explain the x402 flow:
   - client requests a resource
   - server responds `402 Payment Required` with payment requirements
   - client pays on Solana and retries with `X-PAYMENT`
   - server verifies + settles and returns `200`

## 2) Sender flow (60–90s)

1. Open a public inbox: `GET /u/[handle]`.
2. Click a tier button (Standard / Priority / VIP) to open `GET /ping/[tier]?to=[handle]`.
3. Enter a short message and submit.
4. Show the x402 paywall UI, select a wallet, and complete payment.
5. After payment, show the success redirect back to the profile page with the receipt link.

## 3) Owner flow (60–90s)

1. Open `GET /owner-signin`.
2. Connect the owner wallet and sign the SIWS message to create the HttpOnly session cookie.
3. Open `GET /dashboard` and point out revenue + status counts.
4. Open `GET /inbox`, click the new message, then open `GET /inbox/[messageId]`.
5. Change the message status (replied / archived) and show the counts update.

## 4) Technical proof points (15–30s)

- Show the paywalled route handler: `src/app/api/ping/send/route.ts` (x402 wrapper + discovery metadata + payment receipt captured).
- Show Convex tables in `convex/schema.ts` and that messages are stored with payment proof fields.
- (Optional) Show discovery proxy: `GET /api/x402/discovery/resources?type=http&limit=20&offset=0`.

