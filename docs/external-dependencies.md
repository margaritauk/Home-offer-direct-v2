# External dependencies register

A living list of every **outside service** the project needs (or will need), why,
which stories depend on it, rough cost, how hard it is to wire in, and whether we
recommend adopting it. Keep this updated as stories are added or shipped.

> Status legend: 🟢 **Active** (wired up now) · 🟡 **Needed soon** (a planned story needs it) · ⚪ **Deferred** (only for later/paid/monetization work)
>
> Cost figures are **approximate** and change — confirm on the vendor's pricing page before committing. Last reviewed: 2026-06-10.

## At a glance

| Service | Purpose | Status | Stories | Rough cost | Ease | Recommend |
|---|---|---|---|---|---|---|
| **Supabase** | Auth + Postgres + cloud sync + (opt-in) deals | 🟢 Active | #56, #59–62 | Free tier; Pro $25/mo | ✅ Done | **Yes** (in use) |
| **Vercel** | Hosting / deploy / preview builds | 🟢 Active | — | Free Hobby; Pro ~$20/mo | ✅ Done | **Yes** (in use) |
| **Anthropic (Claude) API** | All AI features (grounded, no math) | 🟡 Needed soon | #104, #57, #36, #33, #40, #51 | Usage-based; pennies/call on Haiku | 🟢 Easy (REST) | **Yes, when AI work starts** |
| **Live home feed (listings)** | Real for-sale listings behind Search Homes (replaces mock data) | 🟡 Needed soon | #11, ADR-011 | $0–$$$ (see below) | 🟠 Medium–Hard | **Defer; start with a listing API** |
| **Recent-sales / comps data** | Real sold-comps for AI comps | 🟡 Needed soon | #104, #16, ADR-011 | $0–$$$ (see below) | 🟠 Medium–Hard | **Defer; start with a comps API** |
| **Stripe** | Payments for any paid tier | ⚪ Deferred | #41, #58, #63, #34, #51 | No monthly; 2.9% + 30¢/txn | 🟢 Easy | **Yes, only when monetizing** |
| **Email provider** | Transactional email (invites, paid exports) | ⚪ Deferred | #42, #60, #29 | Free tiers; ~$20/mo at scale | 🟢 Easy | **Defer (not needed yet)** |
| **E-signature** | Sign contracts (ESIGN/UETA) | ⚪ Deferred | #45, #34 | $$$ per-seat or API plans | 🔴 Hard (legal + flow) | **No (defer to paid epic)** |
| **Geocoding / maps** | Distance-to-comp, map view (optional) | ⚪ Deferred | #28, #104 (nice-to-have) | Free tiers (Mapbox/Google) | 🟢 Easy | **Optional / defer** |

---

## Details

### 🟢 Supabase — auth, database, cloud sync
- **Why:** accounts, cross-device sync, and the opt-in multi-party deal layer (gated behind `NEXT_PUBLIC_DEALS_ENABLED`).
- **Env:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Cost:** Free tier (~500 MB DB, 50k MAU) is plenty for now; Pro is $25/mo when we outgrow it.
- **Pros:** already integrated; Postgres + RLS + auth in one; generous free tier. **Cons:** vendor lock-in for auth; RLS has a learning curve (already paid that cost).
- **Recommendation: Yes** — already the backbone. No action needed.

### 🟢 Vercel — hosting
- **Why:** the app is deployed here (Next.js first-party host; preview deploys per PR).
- **Cost:** Free Hobby tier today; Pro (~$20/mo) if we need more bandwidth/team features or commercial use.
- **Recommendation: Yes** — already in use.

### 🟡 Anthropic (Claude) API — AI features
- **Why:** every AI story. The AI must be **grounded** (operate only on real data we pass it) and **compute nothing** — it explains/ranks/adjusts, never invents numbers or comps.
- **Stories:** #104 (auto-find comps), #57 (budget explainer), #36 (offer-strength explainer), #33 (epic), #51 (budget wizard), #40 (disclaimer framework).
- **Cost:** usage-based, **no free tier** (small trial credit for new accounts). Cheapest model **Claude Haiku** ≈ a fraction of a cent per request at our token sizes — pennies even at volume.
- **How to get it:** console.anthropic.com → add billing → create an API key → set `ANTHROPIC_API_KEY`.
- **Ease:** 🟢 Easy — call the REST Messages API with `fetch`, no SDK/dependency required (this is how the #104 seam is built).
- **Pros:** strong, cheap on Haiku, simple REST, fits the "grounded, no-math" guardrail. **Cons:** paid (needs a card); must enforce grounding/anti-fabrication in our prompts + parsing.
- **Recommendation: Yes, when AI work starts.** One key unlocks every AI story.

### 🟡 Live home feed (real for-sale listings)
- **Why:** the **Search Homes** experience currently serves **mock samples** (`isSample: true`). To show real homes the buyer can actually pursue, we need a live for-sale listing feed. The ADR-011 provider seam (`src/lib/listings/provider.ts`) is built so a real feed drops in behind the existing `Listing` type and UI with no rework.
- **Stories:** #11 (listings/search epic), ADR-011 (data pipeline).
- **Options:**
  | Option | Cost | Ease | Notes |
  |---|---|---|---|
  | **Listing API** (SimplyRETS, Bridge Interactive, Repliers, Realtor-via-RapidAPI) | Free/trial → $$/mo | 🟢–🟠 | REST for-sale listings; fastest path, varying coverage/ToS |
  | **IDX vendor** | $$ + setup | 🟠 Medium | IDX display feeds; often tied to a brokerage/agent |
  | **Direct MLS / RETS / RESO Web API** | $$$ + MLS membership + agreement | 🔴 Hard | Most complete + most legal/contractual overhead; per-MLS |
- **Display ToS caveat:** most feeds restrict how listings are displayed/attributed and may require IDX compliance — check each vendor's terms before showing data publicly.
- **Pros:** turns the whole search into a real product; reuses the existing seam/type/UI. **Cons:** coverage, freshness, and display rules vary; MLS access usually needs a licensed brokerage relationship.
- **Recommendation: Defer, then start with a listing API** (e.g. SimplyRETS/Repliers) over a full MLS integration. A provider that covers **both for-sale listings and sold comps** (see next row) would satisfy this *and* #104 with one contract — worth prioritizing when choosing.

### 🟡 Recent-sales / comps data source
- **Why:** our listings are **mock samples** (`isSample: true`) — not real sold comps. AI comps (#104) needs genuine recent **sold** sales (distinct from the for-sale feed above). Designed for via the ADR-011 provider seam.
- **Options:**
  | Option | Cost | Ease | Notes |
  |---|---|---|---|
  | **Rentcast / Realty Mole API** | Free dev tier → ~$50–200/mo | 🟢 Easy | Cheapest start; property + comps + AVM via REST |
  | **ATTOM Data API** | $$ (trial → contract) | 🟠 Medium | Broad nationwide property/sales data |
  | **HouseCanary API** | $$$ enterprise | 🟠 Medium | High-quality comps/valuations |
  | **MLS / IDX feed** | $$$ + brokerage membership + vendor agreement | 🔴 Hard | Most "real," most legal/contractual overhead |
- **Pros (comps API):** REST, no brokerage agreement, fast to wire into the existing seam. **Cons:** coverage/freshness varies; per-call cost; ToS limits on display.
- **Recommendation: Defer, then start with a comps API (Rentcast or ATTOM)** rather than full MLS/IDX. The #104 seam is being built so this plugs in with no UI rework.

### ⚪ Stripe — payments
- **Why:** any paid tier (no-watermark PDF, clean Excel export, premium contracts).
- **Stories:** #41, #58, #63 (monetization decision explicitly **deferred**), #34, #51.
- **Cost:** no monthly fee; **2.9% + 30¢** per transaction (US).
- **Ease:** 🟢 Easy (Checkout + webhook). **Pros:** industry standard, great docs. **Cons:** adds billing/tax/refund surface; only worth it once there's something to sell.
- **Recommendation: Yes, but only when we decide to monetize** (currently deferred per #63).

### ⚪ Email provider — transactional email
- **Why:** sending invite emails and paid-export delivery.
- **Stories:** #42 (email the paid export), #60 (invitations), #29 (outreach log).
- **Note:** **not needed yet** — the current invite flow is *claim-on-sign-in* (no email send required), and the product is single-user-focused right now.
- **Options:** Resend (free ~3k/mo, dev-friendly), SendGrid (free 100/day), Postmark (great deliverability, paid).
- **Ease:** 🟢 Easy. **Recommendation: Defer** until we actually send email; **Resend** is the likely pick.

### ⚪ E-signature — ESIGN/UETA contract signing
- **Why:** signing real contracts in the paid contracts epic.
- **Stories:** #45, #34.
- **Options:** DocuSign (priciest, most recognized), Dropbox Sign (HelloSign), BoldSign, PandaDoc.
- **Cost:** $$$ per-seat or API plans. **Ease:** 🔴 Hard — API + signer flow + heavy legal/compliance (UPL).
- **Recommendation: No / defer** — only inside the paid, legally-reviewed contracts epic.

### ⚪ Geocoding / maps — optional
- **Why:** "distance to comp," a map view for showings/listings. Purely nice-to-have.
- **Options:** Mapbox or Google Maps (both have free tiers).
- **Recommendation: Optional / defer** — not required by any committed near-term story.

---

## What we need *right now*
Nothing new is required for current work. The **#104 AI-comps seam** is being built fully **dormant** — it needs an **Anthropic key** + a **comps data source** to actually switch on, both of which are 🟡 "needed soon" and tracked above. Everything else is ⚪ deferred to monetization/paid epics.

## Maintenance
Update this file whenever a story introduces or removes an external dependency. When adopting one, record the actual chosen vendor, the env var(s), and the real cost.
