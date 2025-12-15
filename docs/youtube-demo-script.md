Project: ping402  
One-liner: A paid inbox for Solana creators—powered by x402 paywalls and Solana USDC settlement, with an in-app Solana Pay checkout and a creator inbox dashboard.

## 1. Home: Connect Wallet + Theme + Primary CTAs
- **URL:** /
- **Shot:** Marketing landing page with the ping402 brand header (nav links, theme toggle, wallet connect), a hero section, and the primary call-to-action to start a ping.
- **Steps:**
  1. **Current page:** New browser tab — confirm the address bar is empty.
  2. **Navigate:** Open URL directly: `http://localhost:3000/` → lands on `/`.
  3. **Current page:** `/` — confirm the hero shows **“ping402”** and the header shows **“Connect Wallet”**.
  4. **Action:** Click **“Toggle theme”** in the header → wait for the UI to switch.
  5. **Current page:** `/` — confirm the background/foreground colors visibly flip (light ↔ dark) while **“ping402”** remains on-screen.
  6. **Action:** Click **“Connect Wallet”** in the header → in the wallet modal, click **“Phantom”** → approve the connection in Phantom.
  7. **Verify on-screen:** The header wallet button updates to a truncated address (e.g., **“BuLAwn…BrAj”**) and a **“Disconnect”** option becomes available.
- **Voiceover:**
  > “This is ping402—a paid inbox for creators on Solana. Right from the homepage, I can switch between light and dark mode and connect my Solana wallet in one click. The header stays consistent everywhere, so the user always knows where to start: send a ping, or sign in as a creator.”

## 2. How It Works: End-to-End x402 + Solana Payment Flow
- **URL:** /how-it-works
- **Shot:** “How it works” explainer page showing the end-to-end flow: paywalled access with x402, Solana settlement, and how the receipt + inbox are produced.
- **Steps:**
  1. **Current page:** `/` — confirm the header is visible and you’re still connected (wallet address is shown).
  2. **Navigate:** Click **“How it works”** in the header → lands on `/how-it-works`.
  3. **Current page:** `/how-it-works` — confirm the page heading shows **“How it works”**.
  4. **Action:** Scroll to the section that explains **x402 paywalled requests** → pause when the diagram/text describing the payment requirement is fully visible.
  5. **Current page:** `/how-it-works` — confirm the section describing **Solana USDC settlement** is visible.
  6. **Action:** Scroll to the part explaining the **receipt + creator inbox** lifecycle → pause on the part that mentions the user gets a receipt and the creator gets an inbox entry.
  7. **Verify on-screen:** The page clearly shows the end-to-end sequence: user → payment requirement → Solana payment → message delivered → receipt/inbox.
- **Voiceover:**
  > “Before we even send anything, this page makes it crystal clear: ping402 is built on two pillars—x402 for paywalled access, and Solana for fast, cheap USDC settlement. The user pays to unlock delivery, the app produces a receipt, and the creator gets a real inbox workflow, not just a demo.”

## 3. Fund: Make Devnet Ready in Minutes (SOL + Devnet USDC)
- **URL:** /fund
- **Shot:** Funding guide page with step-by-step guidance for getting SOL and devnet USDC so the paywall and checkout can succeed in a demo.
- **Steps:**
  1. **Current page:** `/how-it-works` — confirm the heading **“How it works”** is still visible.
  2. **Navigate:** Click **“Fund”** in the header → lands on `/fund`.
  3. **Current page:** `/fund` — confirm the page heading shows **“Fund”** (or **“Funding”**).
  4. **Action:** Click the on-page link/button labeled **“Solana Faucet”** (or equivalent faucet link shown on the page) → confirm a faucet page opens in a new tab.
  5. **Current page:** Faucet tab — confirm you see a faucet UI that can request devnet SOL.
  6. **Navigate:** Switch back to the `/fund` tab → confirm the **“Fund”** page heading is visible again.
  7. **Verify on-screen:** The page clearly shows what you need for the demo: a funded wallet for devnet payments.
- **Voiceover:**
  > “For judges and first-time users, funding is usually the biggest blocker—so ping402 includes a dedicated funding guide. The goal is simple: get devnet SOL and devnet USDC so the user can complete a paid action immediately. Now we’re ready to actually use the app.”

## 4. Handle Discovery: Search a Handle and Choose the Right Path
- **URL:** /ping
- **Shot:** Handle search page with a search input, results/suggestions, and clear CTAs to either view an inbox profile or start sending a ping.
- **Steps:**
  1. **Current page:** `/fund` — confirm the **“Fund”** heading is visible.
  2. **Navigate:** Click **“Send a Ping”** in the header → lands on `/ping`.
  3. **Current page:** `/ping` — confirm the page heading shows **“Send a ping”** (or **“Ping”**).
  4. **Action:** Click the input labeled **“Handle”** (or **“Search handle”**) to focus it.
  5. **Current page:** `/ping` — confirm the cursor is in the handle input.
  6. **(Only if needed) Enter values:**
     - Handle = `ping402`
  7. **Current page:** `/ping` — confirm the handle input now shows `ping402`.
  8. **Action:** Click **“Search”** → wait for results to load.
  9. **Verify on-screen:** A result card/row appears for `ping402`, showing a clear next action such as **“View profile”** or **“Send ping”**.
- **Voiceover:**
  > “This is the consumer entry point: you don’t need to understand crypto to use ping402. You just search a handle like ‘ping402’ and the app immediately gives you a clean path forward—view the public inbox profile, or go straight into sending a paid ping.”

## 5. Public Inbox Profile: Pricing Tiers + Trust Signals
- **URL:** /u/[handle]
- **Shot:** Public profile page for the handle, showing creator identity, tier cards (standard/priority/vip), and the primary send action.
- **Steps:**
  1. **Current page:** `/ping` — confirm the search result for `ping402` is visible.
  2. **Navigate:** Click **“View profile”** on the `ping402` result → lands on `/u/ping402`.
  3. **Current page:** `/u/ping402` — confirm the heading shows **“@ping402”** (or a profile title containing `ping402`).
  4. **Action:** Scroll just enough to show the tier cards labeled **“standard”**, **“priority”**, and **“vip”** (or equivalent tier labels).
  5. **Current page:** `/u/ping402` — confirm the tier pricing and a send button are visible.
  6. **Action:** Click the tier CTA labeled **“Send standard ping”** (or **“Send Standard”**) → lands on `/ping/standard`.
  7. **Verify on-screen:** The compose page loads and shows **“Standard”** as the selected tier.
- **Voiceover:**
  > “Every creator gets a clean public profile that feels like a real product—clear identity, clear pricing, and tiered urgency. This is where Solana’s speed and low fees shine: small USDC payments are practical, and the user can choose the tier that matches how fast they need a reply.”

## 6. Compose + Pay: In-App Solana Pay Checkout for a Standard Ping
- **URL:** /ping/[tier]
- **Shot:** Compose page for the tier with a message form and a checkout panel/modal that confirms amount, network, and wallet before paying.
- **Steps:**
  1. **Current page:** `/u/ping402` — confirm the tier cards are visible.
  2. **Navigate:** (If you aren’t already there) Click **“Send standard ping”** → lands on `/ping/standard`.
  3. **Current page:** `/ping/standard` — confirm the page shows **“Standard”** and the recipient shows `ping402`.
  4. **(Only if needed) Enter values:**
     - Message = `Hey ping402 — quick question: what’s your best tip for integrating x402 with Solana Pay in a consumer app?`
     - Sender name = `Alex`
     - Sender contact = `@alex402`
  5. **Current page:** `/ping/standard` — confirm the message text is visible in the form.
  6. **Action:** Click **“Continue”** (or **“Checkout”**) → wait for the checkout UI to appear.
  7. **Current page:** Checkout UI on `/ping/standard` — confirm you see a payment summary with **Amount**, **Network**, and the connected **Wallet**.
  8. **Action:** Click **“Pay now”** → approve the transaction in your connected wallet when prompted.
  9. **Verify on-screen:** A visible state change confirms payment (e.g., **“Payment confirmed”**), then the app redirects to a receipt page `/r/[messageId]`.
- **Voiceover:**
  > “Now we do the core consumer flow: compose a standard ping and pay in USDC on Solana. I’ll send the message, set my name to ‘Alex’ and contact to ‘@alex402’, then hit Checkout. The app shows the exact amount, network, and my connected wallet—then I click Pay now, approve, and we immediately land on a receipt. Fast, clean, and user-friendly.”

## 7. Receipt: Public Proof + Shareable Confirmation
- **URL:** /r/[messageId]
- **Shot:** Receipt page showing a success state, message details, and a link out to the on-chain transaction.
- **Steps:**
  1. **Current page:** `/ping/standard` — confirm the post-payment success state is shown or you’ve been redirected.
  2. **Navigate:** (If needed) Open URL directly from the address bar shown after payment: `http://localhost:3000/r/[messageId]` → lands on `/r/[messageId]`.
  3. **Current page:** `/r/[messageId]` — confirm the page heading shows **“Receipt”** (or **“Payment confirmed”**).
  4. **Action:** Click the link labeled **“View transaction”** (or an explorer link) → confirm a Solana explorer tab opens.
  5. **Current page:** Explorer tab — confirm you can see the transaction signature and token transfer details.
  6. **Navigate:** Switch back to the receipt tab → confirm the receipt is still visible.
  7. **Verify on-screen:** The receipt displays the handle, tier, and a confirmed payment state that can be shared.
- **Voiceover:**
  > “Receipts matter for trust and for business. This page proves the payment happened, links directly to the on-chain transaction, and gives the user a clean, shareable confirmation that their ping was delivered through a paid, verifiable flow—not a black box.”

## 8. Creator Onboarding: Claim a Handle + Sign In with a Solana Signature
- **URL:** /owner-signin
- **Shot:** Creator sign-in/claim page showing handle claim UI and the wallet signature-based login; includes a clear success redirect into the creator workspace.
- **Steps:**
  1. **Current page:** `/r/[messageId]` — confirm the receipt heading is visible.
  2. **Navigate:** Click **“Creator Sign In”** in the header → lands on `/owner-signin`.
  3. **Current page:** `/owner-signin` — confirm the page heading shows **“Creator sign in”** (or **“Claim your handle”**).
  4. **(Only if needed) Enter values:**
     - Handle = `alex402`
     - Display name = `Alex`
     - Bio = `Building consumer apps on Solana + x402.`
  5. **Current page:** `/owner-signin` — confirm the handle field shows `alex402`.
  6. **Action:** Click **“Claim handle”** (or **“Sign in”**) → approve the **signature request** in your Solana wallet.
  7. **Current page:** Wallet prompt — confirm you see a signature request referencing the handle `alex402` → click **“Approve”** in the wallet.
  8. **Verify on-screen:** You land on `/dashboard` and see a visible confirmation like **“Signed in as @alex402”** (toast, header badge, or dashboard heading).
- **Voiceover:**
  > “Creators onboard with a simple Solana signature—no passwords, no email friction. I claim ‘alex402’, approve a one-time signature, and ping402 establishes my creator session. This is a real, production-ready auth flow that feels native to the Solana ecosystem.”

## 9. Creator Dashboard: Revenue + Status Counts in One View
- **URL:** /dashboard
- **Shot:** Dashboard showing key business metrics: revenue and message status counts (pending/new/replied/archived), plus navigation into the inbox.
- **Steps:**
  1. **Current page:** `/owner-signin` — confirm you just completed sign-in (or you’re already redirected).
  2. **Navigate:** (If needed) Open URL directly: `http://localhost:3000/dashboard` → lands on `/dashboard`.
  3. **Current page:** `/dashboard` — confirm the dashboard heading shows **“Dashboard”** and your handle (e.g., `@alex402`).
  4. **Action:** Hover or pause on the metric cards labeled **“Revenue”** and the status counts (e.g., **“New”**, **“Replied”**, **“Archived”**).
  5. **Current page:** `/dashboard` — confirm a revenue value and counts are visible (even if small).
  6. **Action:** Click **“Inbox”** in the dashboard navigation → lands on `/inbox`.
  7. **Verify on-screen:** The inbox page loads and shows a list/table of messages.
- **Voiceover:**
  > “This is where ping402 becomes a business, not a hackathon toy. The dashboard turns every paid ping into real metrics—revenue and message statuses—so creators can run their inbox like a product. Now let’s jump into the inbox and manage messages.”

## 10. Creator Inbox: Triage + Message Detail Actions
- **URL:** /inbox
- **Shot:** Inbox list with filters/tabs by status, plus opening a message detail view with actions to update status.
- **Steps:**
  1. **Current page:** `/dashboard` — confirm the **“Dashboard”** heading is visible.
  2. **Navigate:** Click **“Inbox”** in the dashboard navigation → lands on `/inbox`.
  3. **Current page:** `/inbox` — confirm the inbox heading shows **“Inbox”** and a list of messages.
  4. **Action:** Click the first message row in the list (the row shows a message preview and tier) → lands on `/inbox/[messageId]`.
  5. **Current page:** `/inbox/[messageId]` — confirm you see the full message content and metadata (tier, payer, or receipt link).
  6. **Action:** Click **“Mark as replied”** → wait for a visible confirmation (toast or badge change).
  7. **Current page:** `/inbox/[messageId]` — confirm the status badge updates to **“Replied”**.
  8. **Action:** Click **“Back to Inbox”** (or **“Inbox”** in the nav) → lands on `/inbox`.
  9. **Verify on-screen:** The message row is now reflected under the correct status filter/tab (e.g., it disappears from “New” and appears in “Replied”).
- **Voiceover:**
  > “Creators need a real workflow: not just receiving messages, but managing them. Here I open a message, mark it as replied, and the UI immediately reflects the new status. This is a complete lifecycle—from paid delivery to inbox triage—and it’s exactly what a consumer-facing Solana creator product should feel like.”

## 11. x402 Demo + Discovery: Prove the Integration End-to-End
- **URL:** /demo/x402
- **Shot:** x402 inspection page showing decoded payment requirements, a discovery listing, and a live test against a paywalled API resource that returns “Payment Required” until paid.
- **Steps:**
  1. **Current page:** `/inbox` — confirm you see the inbox list.
  2. **Navigate:** Click **“x402 Demo”** (or **“Demo”**) in the header → lands on `/demo/x402`.
  3. **Current page:** `/demo/x402` — confirm the heading shows **“x402 demo”** (or **“x402 inspection”**) and you can see a panel for request/response details.
  4. **Action:** Click **“Fetch demo resource”** (or equivalent button that triggers the demo call) → wait for the response panel to populate.
  5. **Current page:** `/demo/x402` — confirm the response shows a **“Payment Required”** state and a summary of requirements (amount, asset, network).
  6. **Navigate:** Open URL directly in a new tab: `http://localhost:3000/api/x402/discovery/resources` → confirm you see JSON that lists available paywalled resources.
  7. **Navigate:** Switch back to `/demo/x402` → confirm the inspection UI is visible again.
  8. **Action:** Click **“Open paywall”** (or click the demo API URL shown) → on the paywall screen, click **“Pay now”** → approve in wallet.
  9. **Verify on-screen:** The demo resource switches from locked to unlocked (a visible success state like **“200 OK”** or **“Unlocked”** appears), proving x402 and Solana settlement are working together.
- **Voiceover:**
  > “This is the hackathon-critical proof: x402 isn’t an add-on—it’s the baseline. The demo endpoint returns Payment Required until the user pays in Solana USDC. We can even see a discovery listing of paywalled resources. After paying, the same resource becomes accessible immediately. That’s real x402 + Solana integration.”

## 12. API + SEO Proof: Health, Handles, Robots, Sitemap, OpenGraph
- **URL:** /api/health
- **Shot:** A fast “ops + SEO” pass showing public endpoints, handle lookup/search APIs, robots/sitemap, and the dynamic OpenGraph image route.
- **Steps:**
  1. **Current page:** `/demo/x402` — confirm the x402 inspection UI is still visible.
  2. **Navigate:** Open URL directly: `http://localhost:3000/api/health` → lands on `/api/health`.
  3. **Current page:** `/api/health` — confirm you see JSON with an OK status (e.g., `ok: true`).
  4. **Navigate:** Open URL directly: `http://localhost:3000/api/handles/search?query=ping` → confirm you see JSON results with handle suggestions.
  5. **Navigate:** Open URL directly: `http://localhost:3000/api/handles/lookup?handle=ping402` → confirm you see JSON indicating availability/ownership.
  6. **Navigate:** Open URL directly: `http://localhost:3000/robots.txt` → confirm the response starts with **“User-agent:”**.
  7. **Navigate:** Open URL directly: `http://localhost:3000/sitemap.xml` → confirm the response starts with **`<?xml`** and contains URLs.
  8. **Navigate:** Open URL directly: `http://localhost:3000/u/ping402/opengraph-image` → confirm a social share image renders in the browser.
  9. **Verify on-screen:** You’ve shown production-grade endpoints: health, discovery APIs, and SEO metadata routes—all functioning.
- **Voiceover:**
  > “To round it out, ping402 ships like a real production app: health checks, handle search and lookup APIs for onboarding UX, and proper SEO routes—robots, sitemap, and dynamic OpenGraph images for profile sharing. This is the polish that makes it feel alive and ready for mainnet.”

## Final Wrap-Up
- **URL:** /dashboard
- **Shot:** Creator dashboard visible with connected wallet, handle identity, and at least one message count/revenue signal; optionally keep a receipt tab visible in the browser.
- **Steps:**
  1. **Current page:** `/u/ping402/opengraph-image` — confirm the OpenGraph image is visible.
  2. **Navigate:** Open URL directly: `http://localhost:3000/dashboard` → lands on `/dashboard`.
  3. **Current page:** `/dashboard` — confirm the dashboard heading shows **“Dashboard”** and your handle (e.g., `@alex402`) is visible.
  4. **Verify final state:** Confirm the header shows your connected wallet, the dashboard shows revenue/status cards, and the inbox is accessible via **“Inbox”** navigation.
- **Voiceover:**
  > “In this demo, we proved the full journey: users discover a handle, pay in Solana USDC, get a verifiable receipt, and creators manage a real inbox with revenue tracking. x402 powers the paywall baseline, Solana powers settlement, and the UI is built for real users. Try it at [DEMO_URL].”
