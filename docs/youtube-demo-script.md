Project: ping402  
One-liner: A creator-paid inbox on Solana where x402 enforces pay-per-message delivery and Solana Pay settles USDC instantly with a public receipt.

## 1. Connect Wallet First
- **URL:** /
- **Shot:** Home page header with the wallet button, ping402 branding, and the main CTAs visible.
- **Steps:**
  1. **Current page:** New browser window (Window A) — confirm the address bar is empty.
  2. **Navigate:** Open URL directly: https://pingx402.vercel.app/ → lands on `/`.
  3. **Current page:** `/` — confirm the header shows **“Connect wallet”**.
  4. **Action:** Click **“Connect wallet”** in the header — wait for the wallet modal to appear.
  5. **Current page:** `/` — confirm the wallet modal lists wallet options.
  6. Click **“Phantom”** — wait for the header to update.
  7. **Verify on-screen:** The header wallet button shows a shortened address (connected state), not **“Connect wallet”**.
- **Voiceover:**
  > “First, connect a Solana wallet. ping402 is a paid inbox, so wallet identity is the starting point.”

## 2. Confirm This Wallet Already Owns a Handle (Using the Dashboard)
- **URL:** /dashboard
- **Shot:** Creator dashboard showing the handle identity context and KPI cards (Revenue, Total, New, Replied, Archived).
- **Steps:**
  1. **Current page:** `/` — confirm the header shows your connected wallet address.
  2. **Navigate:** Open URL directly: https://pingx402.vercel.app/dashboard → lands on `/dashboard`.
  3. **Current page:** `/dashboard` — confirm the heading **“Dashboard”** is visible.
  4. **Verify on-screen:** Confirm the dashboard shows creator identity context (a visible **@handle** label or creator profile section indicating the wallet is signed in and associated with a handle).
  5. **Action:** Pause on the dashboard metric cards — confirm **“Revenue”** and status counts (e.g., **“New”**, **“Replied”**, **“Archived”**) are visible.
  6. **Verify on-screen:** The dashboard remains accessible without redirecting back to **/owner-signin**, confirming you have an active creator session for this wallet.
- **Voiceover:**
  > “To confirm this wallet already has an associated username, we go straight to the creator dashboard. If the dashboard loads and shows the creator context, this wallet is signed in and mapped to a handle, and we’re ready to use the app as a creator.”

## 3. Open a Second Browser Session for a New Creator
- **URL:** /
- **Shot:** A second browser window (Window B) opens the same site in a fresh session; wallet is not connected yet.
- **Steps:**
  1. **Current page:** Window A `/dashboard` — confirm the heading **“Dashboard”** is visible.
  2. **Navigate:** Open a new browser window (Window B) → open URL directly: https://pingx402.vercel.app/ → lands on `/`.
  3. **Current page:** Window B `/` — confirm the header shows **“Connect wallet”** (disconnected state).
  4. **Verify on-screen:** Confirm Window B is a fresh session because it does not show the connected wallet address.
- **Voiceover:**
  > “Now we open ping402 in a second browser window to simulate a second user. This fresh session starts disconnected, which lets us connect a different wallet and claim a brand-new handle.”

## 4. Claim a New Handle in Window B
- **URL:** /owner-signin
- **Shot:** Creator sign-in page in Window B showing wallet connect state, handle fields, and the “Sign in / Claim handle” action.
- **Steps:**
  1. **Current page:** Window B `/` — confirm the header shows **“Connect wallet”**.
  2. **Navigate:** Open URL directly: https://pingx402.vercel.app/owner-signin → lands on `/owner-signin`.
  3. **Current page:** Window B `/owner-signin` — confirm the heading **“Creator sign-in”** is visible.
  4. **Action:** Click **“Connect wallet”** — confirm the wallet modal appears.
  5. **Action:** Click **“Phantom”** — approve connection with a different wallet account in Phantom.
  6. **Verify on-screen:** Confirm the header wallet button shows a shortened address that is different from Window A.
  7. **Enter values:**
     - Handle = solana_builder
     - Display name = Solana Builder
     - Bio = I respond fast to priority pings.
  8. Click **“Sign in / Claim handle”** — approve the signature request in the wallet.
  9. **Verify on-screen:** You land on `/dashboard` and the heading **“Dashboard”** is visible.
- **Voiceover:**
  > “In the second window, we onboard a new creator. We connect a second wallet, claim the handle ‘solana_builder’, and approve a one-time Solana signature. The app immediately creates a creator session and drops us into the dashboard.”

## 5. Open the Second Creator’s Public Profile
- **URL:** /u/solana_builder
- **Shot:** Public profile for @solana_builder showing tier options (Standard, Priority, VIP) and a clear ‘send a paid ping’ UI.
- **Steps:**
  1. **Current page:** Window B `/dashboard` — confirm **“Dashboard”** is visible.
  2. **Navigate:** Open URL directly: https://pingx402.vercel.app/u/solana_builder → lands on `/u/solana_builder`.
  3. **Current page:** `/u/solana_builder` — confirm the profile shows **“@solana_builder”**.
  4. **Verify on-screen:** Confirm tier options are visible (Standard / Priority / VIP).
- **Voiceover:**
  > “With the handle claimed, the creator instantly has a public profile page. This is the consumer-facing surface: a simple, tiered interface that anyone can use to pay to reach this creator.”

## 6. Send a Paid Ping from Window A to the New Creator
- **URL:** /ping/priority?to=solana_builder
- **Shot:** Window A composes a Priority ping to @solana_builder, showing the message form and the ‘Pay & send ping’ action.
- **Steps:**
  1. **Current page:** Window A `/dashboard` — confirm **“Dashboard”** is visible.
  2. **Navigate:** Open URL directly: https://pingx402.vercel.app/ping/priority?to=solana_builder → lands on `/ping/priority`.
  3. **Current page:** `/ping/priority` — confirm the heading shows **“Priority ping ($0.05)”** and recipient is **solana_builder**.
  4. **Enter values:**
     - Your name = Jamie
     - Contact = jamie@example.com
     - Message = Hey Solana Builder — quick test: can you confirm you received this paid ping?
  5. Click **“Pay & send ping”** — wait for the checkout sheet to open.
  6. **Verify on-screen:** Confirm a sheet appears titled **“Checkout Solana Pay”** showing the tier and amount.
- **Voiceover:**
  > “Now we do the real marketplace interaction. In Window A, we send a paid Priority ping to the new creator. We write a short message and hit ‘Pay & send ping’ to trigger payment and delivery.”

## 7. Complete Solana Pay Checkout and Get a Public Receipt
- **URL:** /r/[messageId]
- **Shot:** Wallet transaction approval followed by the Receipt page and a Solana Explorer transaction link.
- **Steps:**
  1. **Current page:** Window A `/ping/priority` — confirm the checkout UI is visible.
  2. **Action:** Click **“Pay now”** — approve the transaction in the connected wallet.
  3. **Verify on-screen:** Confirm the checkout status changes to **“Payment confirmed”**.
  4. **Navigate:** Wait for redirect to `/r/[messageId]` — confirm the heading **“Receipt”** is visible.
  5. **Action:** Click the payment transaction signature link — confirm it opens Solana Explorer in a new tab.
  6. **Verify on-screen:** Confirm Solana Explorer displays the same transaction signature shown on the receipt.
- **Voiceover:**
  > “Payment confirms quickly on Solana, and ping402 generates a public receipt immediately. That receipt links to Solana Explorer for on-chain verification, which is what makes this flow trustworthy and production-ready.”

## 8. Confirm Delivery in Window B Inbox + Update Status
- **URL:** /inbox
- **Shot:** Window B inbox list shows the new message; message detail view shows the content and status actions.
- **Steps:**
  1. **Current page:** Window B `/dashboard` — confirm **“Dashboard”** is visible.
  2. **Navigate:** Open URL directly: https://pingx402.vercel.app/inbox → lands on `/inbox`.
  3. **Current page:** `/inbox` — confirm the heading **“Inbox”** is visible and a message list is shown.
  4. **Verify on-screen:** Confirm a new message row appears that matches the ping content and tier.
  5. **Action:** Click that message row → lands on `/inbox/[messageId]`.
  6. **Current page:** `/inbox/[messageId]` — confirm the message body is visible.
  7. Click **“Mark replied”** — wait for the status to update.
  8. **Verify on-screen:** Confirm the status shows **Replied**.
- **Voiceover:**
  > “Back in Window B, the creator sees the paid ping arrive in their inbox immediately. We open the message, confirm the text, then mark it replied. This proves the full end-to-end workflow for a creator business inbox.”

## 9. Prove x402 Discovery + 402 Enforcement (No Manual API Reading Required)
- **URL:** /api/x402/discovery/resources
- **Shot:** Discovery JSON in the browser plus a terminal curl showing the ping endpoint returns 402 when unpaid.
- **Steps:**
  1. **Current page:** Window A `/r/[messageId]` — confirm the **“Receipt”** heading is visible.
  2. **Navigate:** Open URL directly: https://pingx402.vercel.app/api/x402/discovery/resources → lands on `/api/x402/discovery/resources`.
  3. **Current page:** `/api/x402/discovery/resources` — confirm JSON renders and includes a **resources** list.
  4. **Navigate:** Switch to a Terminal window — confirm you’re at a shell prompt.
  5. **Action:** Run `curl -i -X POST "https://pingx402.vercel.app/api/ping/send?tier=standard" -H "Content-Type: application/json" -d "{\"toHandle\":\"solana_builder\",\"message\":\"test\"}"` — wait for headers to print.
  6. **Verify on-screen:** Confirm the response includes **HTTP/1.1 402 Payment Required**.
- **Voiceover:**
  > “This is the x402 proof: we can discover paywalled resources, and the ping endpoint returns 402 Payment Required when unpaid. That’s why x402 is foundational—without it, paid delivery doesn’t exist.”

## 10. Health, Onboarding APIs, and SEO Routes
- **URL:** /api/health
- **Shot:** Health JSON plus handle search/lookup, and robots + sitemap endpoints for production SEO.
- **Steps:**
  1. **Current page:** New browser tab — confirm the address bar is empty.
  2. **Navigate:** Open URL directly: https://pingx402.vercel.app/api/health → lands on `/api/health`.
  3. **Current page:** `/api/health` — confirm JSON includes **"ok": true** and **"service": "ping402"**.
  4. **Navigate:** Open URL directly: https://pingx402.vercel.app/api/handles/search?query=solana → lands on `/api/handles/search`.
  5. **Verify on-screen:** Confirm JSON includes suggested handles.
  6. **Navigate:** Open URL directly: https://pingx402.vercel.app/api/handles/lookup?handle=solana_builder → lands on `/api/handles/lookup`.
  7. **Verify on-screen:** Confirm JSON indicates the handle exists (or is taken).
  8. **Navigate:** Open URL directly: https://pingx402.vercel.app/robots.txt → lands on `/robots.txt`.
  9. **Verify on-screen:** Confirm the response contains **User-agent:**.
  10. **Navigate:** Open URL directly: https://pingx402.vercel.app/sitemap.xml → lands on `/sitemap.xml`.
  11. **Verify on-screen:** Confirm the response is XML and includes `<urlset`.
- **Voiceover:**
  > “Finally, we validate production readiness: health checks, handle onboarding APIs, and SEO routes for indexing. This rounds out ping402 as a real consumer app with a real payments backbone.”

## Final Wrap-Up
- **URL:** /dashboard
- **Shot:** Window B creator dashboard showing activity and the connected wallet in the header.
- **Steps:**
  1. **Current page:** Window B `/dashboard` — confirm the heading **“Dashboard”** is visible.
  2. **Verify final state:** Confirm the dashboard and inbox are accessible for the claimed creator, and the flow is proven end-to-end: wallet identity → handle claim → paid ping via Solana Pay → receipt → inbox triage, with x402 enforcement backing the paid endpoint.
- **Voiceover:**
  > “We proved a real two-user flow: an existing creator wallet is already signed in, a second wallet claims a new handle, the first wallet pays to send a ping using Solana Pay, and the second creator triages it in their inbox—while x402 enforces pay-per-action at the API level. Try it at https://pingx402.vercel.app/.”
