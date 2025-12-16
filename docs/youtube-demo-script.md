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

## 2. Open the Creator Dashboard from the Header Menu
- **URL:** /dashboard
- **Shot:** Header shows the connected wallet/handle dropdown; selecting “Dashboard” loads the creator dashboard with KPI cards (Revenue, Total, New, Replied, Archived).
- **Steps:**
  1. **Current page:** `/` — confirm the header shows the connected wallet button (not “Connect wallet”).
  2. **Action:** Click your connected wallet/handle button in the header (the shortened address) — wait for a dropdown menu to appear.
  3. **Current page:** `/` — confirm the dropdown menu is visible and includes **“Dashboard”**.
  4. **Navigate:** Click **“Dashboard”** in the dropdown → lands on `/dashboard`.
  5. **Current page:** `/dashboard` — confirm the heading **“Dashboard”** is visible.
  6. **Verify on-screen:** Confirm the KPI cards labeled **“Revenue”**, **“Total”**, **“New”**, **“Replied”**, and **“Archived”** are visible.
- **Voiceover:**
  > “Now we open the creator dashboard from the header menu. This is the business view: revenue plus message status counts.”

## 3. Open a Second Browser Session for a New Creator
- **URL:** /
- **Shot:** A second browser window (Window B) opens the same site in a fresh session; wallet is not connected yet.
- **Steps:**
  1. **Current page:** Window A `/dashboard` — confirm the heading **“Dashboard”** is visible.
  2. **Navigate:** Open a new browser window (Window B) → open URL directly: https://pingx402.vercel.app/ → lands on `/`.
  3. **Current page:** Window B `/` — confirm the header shows **“Connect wallet”** (disconnected state).
  4. **Verify on-screen:** Confirm Window B is a fresh session because it does not show the connected wallet address.
- **Voiceover:**
  > “Next, we open ping402 in a second browser window to simulate another user. We can connect a different wallet.”

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
  > “We onboard a new creator: claim the handle ‘solana_builder’, sign once, and we’re inside the dashboard immediately.”

## 5. Open the Second Creator’s Public Profile
- **URL:** /u/solana_builder
- **Shot:** Public profile for @solana_builder showing tier options (Standard, Priority, VIP) and a clear ‘send a paid ping’ UI.
- **Steps:**
  1. **Current page:** Window B `/dashboard` — confirm **“Dashboard”** is visible.
  2. **Navigate:** Open URL directly: https://pingx402.vercel.app/u/solana_builder → lands on `/u/solana_builder`.
  3. **Current page:** `/u/solana_builder` — confirm the profile shows **“@solana_builder”**.
  4. **Verify on-screen:** Confirm tier options are visible (Standard / Priority / VIP).
- **Voiceover:**
  > “With the handle claimed, the creator instantly has a public profile page with simple tiers that anyone can use to pay to reach them.”

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
  > “Now we do the real marketplace interaction: from Window A, we send a paid Priority ping to solana_builder and trigger Solana-native checkout.”

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
  > “Payment confirms quickly on Solana, and ping402 generates a public receipt immediately. The explorer link proves settlement happened on-chain.”

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
  > “On the creator side, the paid ping arrives in the inbox immediately. We open it, confirm the content, and mark it replied—this proves the full creator workflow.”

## Final Wrap-Up
- **URL:** /dashboard
- **Shot:** Window B creator dashboard showing activity and the connected wallet in the header.
- **Steps:**
  1. **Current page:** Window B `/dashboard` — confirm the heading **“Dashboard”** is visible.
  2. **Verify final state:** Confirm the dashboard and inbox are accessible for the claimed creator, and the flow is proven end-to-end: wallet identity → handle claim → paid ping via Solana Pay → receipt → inbox triage, with x402 enforcement backing the paid endpoint.
- **Voiceover:**
  > “We proved a real two-user flow: connect wallets, create a new creator handle, pay to send a ping with Solana Pay, verify the on-chain receipt, and manage the message in the creator inbox—while x402 enforces pay-per-action. Try it at https://pingx402.vercel.app/.”
