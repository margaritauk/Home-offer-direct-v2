# Groomed 10-Sprint Backlog — HomeOffer Direct

_Owner: Product Owner · groomed 10-sprint backlog · 2026-06-16_

This is the **single authoritative backlog** the scrum pod builds and tests off for the next
ten sprints. It consolidates the PM roadmap and the four dev-team grooming lenses into
ready-to-build, ready-to-test stories — buildable by Engineering and testable by QA without
re-reading the source docs.

**Contributing documents (read these for full depth; this backlog synthesizes, it does not
re-derive them):**
- [`roadmap-10-sprints.md`](./roadmap-10-sprints.md) — PM roadmap: S1..S10 themes, epics, gates, founder decisions, KPIs.
- [`grooming/architect.md`](./grooming/architect.md) — technical direction, seams, proposed ADR-014..020.
- [`grooming/engineer.md`](./grooming/engineer.md) — file-level implementation notes + S/M/L/XL estimates.
- [`grooming/qa-test.md`](./grooming/qa-test.md) — per-epic test plans + compliance test hooks.
- [`grooming/ux-designer.md`](./grooming/ux-designer.md) — IA, flows, screen states, a11y.
- Format reference / prior groomed backlog: [`../backlog/product-backlog.md`](../backlog/product-backlog.md).

---

## 1. Conventions

### Priority
- **P0** — closes a critical gap or holds the north-star/revenue line; build first.
- **P1** — high value, scoped; build next.
- **P2** — rounds out the experience; build last.
- A **`P0-gate`** tag marks a P0 whose *default-ON* flip is blocked on an external clearance
  (vendor key or legal sign-off). The **build** still ships in-sprint, default-OFF, behind a
  flag — the gate clears into already-merged software.

### Estimate scale (from Engineering)
- **S** ≤ ~0.5 day — copy, content, or a thin component over existing logic.
- **M** ~1–2 days — a typed pure lib + checklist/worksheet/modeler component.
- **L** > 2 days — net-new infrastructure (scheduler, payments seam, storage+RLS).
- **XL** — multi-sprint scope; if it can't land in one sprint it is split (see §3).

### User-story format
> **As a [buyer / agent / founder], I want … so that …**

Each story is the unit of "Ready" and "Done." Buyers are unrepresented unless the story
names a represented/agent persona.

### Definition of Ready (DoR)
A story is **Ready** to pull into a sprint when:
1. The user story, acceptance criteria, and test plan are agreed and unambiguous.
2. Its **dependencies** are met or scheduled earlier in the sequence.
3. Any **factual claim** it surfaces has a sourced, dated entry (or is flagged as a spike in §4).
4. Any required **legal sign-off / vendor key** is cleared *or* explicitly scheduled, and the
   story's **default-OFF flag seam** is identified so the build can land ahead of the gate.
5. The **IA placement** and reused house patterns are identified (UX brief).

### Definition of Done (DoD)
A story is **Done** when **all** of the following hold:
1. **Acceptance criteria met** — every criterion is satisfied.
2. **Tests per QA** — unit (Vitest), component (RTL), and E2E (Playwright) at the layers named
   in the story's test plan, including the mandatory boundary, empty, and **default-OFF/gated**
   cases.
3. **Green gate** — typecheck + lint + build + Vitest + Playwright E2E all pass in CI.
4. **Gated features proven CI-green in their default-OFF state** — CI holds no Stripe / Anthropic
   / Resend / RentCast / VAPID keys; the Null/default seam must be fully green without them
   (clone the explainer/RentCast gate test: default-off → Null impl returns the inert value;
   source+key → real impl; kill switch overrides source+key).
5. **Compliance is a test, not a comment** — each applicable regime has an asserting test in the
   PR that ships the feature:
   - **UPL** — no directive output ("offer $X", "waive Y", "you must hire"); process language and
     "have your attorney/lender/title officer review" preserved; AI/explainer output never invents
     a number.
   - **FHA** — every new free-text path routes through `screenText`/`screenOutput`, stays **off**
     `AI_INPUT_ALLOWLIST` unless explicitly screened; full protected-class matrix + love-letter/
     steering blocked; SEO/search on objective attributes only.
   - **UDAP** — savings/AI claims stay conditional; public-claims copy does not launch ahead of
     legal sign-off.
   - **RESPA** — referral surfaces stay flat, disclosed, fee-free; paid seats/unlocks are never
     referral-for-fee or a % of price.
   - **GLBA** — per-deal RLS isolation, consent-before-visibility, field-level scoping,
     delete-on-demand (delete removes object *and* row/index).
   - **SAFE-Act** — financing surfaces educate on process; no rate-as-offer, no lender recommendation.
6. **Source + date on any factual claim** — every market/legal/tax stat renders a cited source +
   as-of date (the `SourceStamp` primitive, introduced S1); an assertion verifies the node is present.
7. **The relevant legal sign-off is cleared before any default-ON flip** — a `P0-gate` story may
   merge default-OFF, but the flag is flipped ON only after the named clearance lands.

---

## 2. Reconciliation decisions (cross-lens calls — authoritative)

These resolve where the four lenses needed a single call. They are binding scope decisions.

1. **R2 is named "Documents" / `DocumentBinder` — not "binder".** The *existing* `DealBinder`
   (`src/components/deal/deal-binder.tsx`, `/deal/print`) is a printable read-only worksheet
   summary. R2 is a **new uploaded-document custody vault**. Keep them distinct: R2 ships as
   **"Documents"**; the printable artifact stays the "Buyer binder (print)." *(UX collision call.)*
2. **Scheduler = Vercel Cron + Web Push (VAPID), no third-party vendor in S1.** Architect's
   Vercel Cron recommendation is **accepted over** pg_cron (server-side accounts already exist;
   one TypeScript runtime imports the pure deriver; one mechanism serves push in S1 and email in
   S2). Engineer's caution is folded in: **in-app + client-on-open ships first (zero infra, zero
   gate); true background Web Push (VAPID + `CRON_SECRET`) trails within the sprint behind
   `PUSH_ENABLED`.** S1 stays gate-free either way.
3. **S4 reuses the existing Claude connector.** A Claude/Anthropic Messages REST connector
   already exists in `src/lib/ai/comps-ai.ts` (model `claude-haiku-4-5-20251001`,
   `ANTHROPIC_API_KEY`, direct `fetch`, no SDK). S4 is **not a research task** — copy that
   connector shape into `source-claude.ts` and add one `AI_EXPLAINER_SOURCE==="claude"` branch.
   The real S4 work is cost/cache/rate-limit/abuse controls, not the provider.
4. **ADR ownership (014..020):** ADR-014 Reminders/scheduler · ADR-015 Document custody · ADR-016
   Payments seam · ADR-017 AI provider promotion (Claude) · ADR-018 Shared-workspace realtime ·
   ADR-019 In-deal messaging through screening · ADR-020 Email provider seam (optional; fold into
   014 if not standalone). **Each ADR is authored by the Architect in the sprint that introduces
   it** (mapped per story below) and reviewed in that sprint's PR.
5. **Resequenced / split items:**
   - **R1 split within S1:** in-app reminders (no gate) lands first; background push trails behind
     `PUSH_ENABLED` (decision #2).
   - **#58 paid export depends on R2 (S3) for the binder artifact** but the paywall *gate* ships in
     S2 on the offer/export artifact; the binder-export depth attaches when R2 lands.
   - **T1 (S8) is L→XL — split if realtime slips:** the activity feed + consent-gating ship as **L**;
     **presence/realtime is a fast-follow** (poll-fallback default). Realtime transport is decided
     once in S8 and reused by S9 messaging.
   - **T2 (S10) is L→XL, hard-gated** — built only after S2 monetization proves out; ships default-OFF.
6. **Single market read rule carries forward:** A1's `classifyMarket` `MarketRead` is computed
   once and consumed everywhere (A2/I3/I4/J4 from the prior backlog; S5–S7 surfaces reuse it).
7. **One new shared primitive — `SourceStamp` (source + as-of) — is built in S1's H2 sweep** and
   consumed by S6/F3, S7, S9, S10 (do not re-author).
8. **No sixth top-bar anchor in any sprint.** Every new surface attaches to Journey · Tools ▾ ·
   My Deal ▾ · the cockpit, or the stage spine (UX 5-anchor IA is fixed).
9. **DRAFT-banner discipline:** every new consent / representation / public-savings / public-AI-claims
   surface renders its DRAFT/gated state (the `agency-copy.ts` `LEGAL_REVIEW_APPROVED` /
   `LEGAL_DRAFT_BANNER` pattern) until counsel flips the flag.

### Gate → unblock per gated story (quick index)

| Story | Gate (vendor / legal / decision) | Unblock (build lands default-OFF behind…) |
|---|---|---|
| R1 push (S1) | none (in-app path) | `PUSH_ENABLED` + VAPID for background push only |
| #41/#58 paywall (S2) | **Stripe key + pricing decision #63** | `PAYMENTS_ENABLED` + Null payments provider |
| #42 email (S2) | **Resend key** | `EMAIL_ENABLED` + Null email provider |
| R2 Documents (S3) | **GLBA custody legal sign-off** (consent/retention) | `DOC_BINDER_ENABLED` |
| AI1 Claude (S4) | **public-AI-claims legal sign-off + Anthropic key** | `AI_EXPLAINER_SOURCE=claude` (live but default-off, then flip) |
| F1 financing (S5) | none (SAFE-Act is a content boundary) | — |
| F2 title review (S6) | **title-review legal boundary** (reuse cleared A5/A6 copy) | typed-content checklist |
| AI2 (S7) | **same public-AI-claims sign-off as S4** | same seam, default-off |
| T1 workspace (S8) | **GLBA scoping + consent + dual-agency capture; RESPA review** | `WORKSPACE_REALTIME` (poll fallback) + deals flag |
| P2-6 RentCast (S9) | none new (shipped, flagged) | `RENTCAST_DISABLED` kill switch |
| T2 agent console (S10) | **pricing decision #63 + RESPA review** | `AGENT_CONSOLE_ENABLED` |
| E-sign (#45) | NOT on this critical path | flagged only, deferred |

---

## 3. Sprint-by-sprint stories (S1..S10)

> Compliance shorthand: 🟡 **UPL** facts/process not directives · 🟦 **FHA** neutral, screened,
> objective · 🟩 **GLBA** consent/RLS/scoping/delete · 🟪 **RESPA** fee-free, flat · 🟧 **UDAP**
> conditional claims · 🟫 **SAFE-Act** process-not-rate.

---

### S1 — Reminders + cockpit (buildable-now agent value; **no gate; ship first**)

**KPI:** % of active deals with ≥1 reminder armed; weekly cockpit return rate of signed-in users.
**Build sequence:** H2 (independent) ‖ R3 (pure) → R1 last (introduces the scheduler).

#### R3 — Active next-actions cockpit
**Pri:** P0 · **Est:** M · **ID:** S1-R3

> **As a buyer, I want** the 1–3 things to do this week and why, in one cockpit, **so that** I
> don't drift in the middle of my deal the way I would without an agent.

- **Value/KPI:** highest effort-to-value item in the replan; defends mid-journey drop-off; the
  spine that S5/S6/S10 tools plug into. *KPI:* weekly cockpit return rate.
- **Dependencies:** shipped selectors only (`computeMilestones`, stage selectors, A4 contacts,
  `buildHomeRollups`/`deriveNextAction`). Can land in parallel with R1's pure core.
- **Acceptance criteria:** top band of `/dashboard` (My Deal anchor), replacing the static
  `WhatsNext` strip; default landing for returning signed-in users. 1–3 ranked action cards
  (verb-led title, one-line "why now", urgency chip, primary deep link). States: **default**
  (ranked cards), **empty** (first-run "Tell us where you are" prompt, never a blank page),
  **loading** (skeleton until `hydrated`), **all-clear** ("nothing needs you this week — next
  up: <milestone> on <date>"), **overdue** (`statusFor` tone + icon + text label, never color
  alone), **error** (per-card fallback to the static next-action string; the cockpit never blanks
  the dashboard). Cards are an `<ol>`; keyboard-reachable with visible focus ring; `aria-live`
  only on the count needing attention; mobile single-column ≥44px above the bottom tab bar.
- **Test plan:** unit — next-action selection/ranking + why-string (~8-10); RTL — top-N render,
  empty/all-clear states (~5); E2E — cockpit shows ≥1 action after dates set (~1).
- **Impl notes / ADR:** pure `lib/cockpit/next-actions.ts` (`computeNextActions`) + a
  `rankNextActions(rollups, today)` selector; thin `CockpitBand` client component. No new data
  model, no flags. **No ADR.**
- **Compliance:** 🟡 UPL — process ("schedule your inspection by the contingency date"), never
  "you should waive…"; every date carries "the contract governs — no deadline here is of record."
- **Gate → unblock:** none.
- **Roles consulted:** PM, Architect, Engineer, QA, UX.

#### R1 — Reminders (in-app + browser push first; email deferred to S2)
**Pri:** P0 · **Est:** L · **ID:** S1-R1

> **As a buyer, I want** to be nudged before each contract deadline, **so that** I never miss a
> contingency — the single highest harm-prevention thing an agent does for me.

- **Value/KPI:** converts the one-shot `.ics` (A8) into a proactive nag. *KPI:* reminders armed
  per deal. Foundational — F1 (S5), F2 (S6), and the S2 email path compose onto it.
- **Dependencies:** accounts/cloud-sync (shipped); `computeMilestones`. R3 consumes its output.
- **Acceptance criteria:** opt-in stored per account/deal; a reminder arms for each computed
  milestone; **two channels** — in-app banner (driven purely by the deriver on load/focus, ships
  first) and background browser push (Web Push API + VAPID + service worker). **Re-fire on date
  move:** moving a contract date reschedules affected reminders and cancels stale ones (no orphan,
  no historical burst when a date moves to the past, no double-arm on re-entry). **Permission UX:**
  push is **never** requested on page load — only on an explicit value-first gesture; *denied* →
  graceful in-app-only fallback (never re-spam the native prompt). **Gated state:** signed-out →
  disabled "Sign in to arm reminders" with an explanatory tooltip, not a dead button. **Error:**
  "couldn't arm — your dates are still saved; try again," never silent. Controls keyboard-operable,
  armed state announced (`aria-pressed`/live), ≥44px.
- **Test plan:** unit — reminder-schedule math (milestone→fire-datetime, tz normalization,
  re-fire diffing, past-due suppression, dedupe via `dedupeKey`) **~18-24** (load-bearing, mirror
  `deadlines.test.ts`); RTL — opt-in toggle, armed-count badge, armed/disarmed (~5); E2E — set
  dates → armed indicator; change date → updates (~2, push mocked not asserted live).
- **Impl notes / ADR:** pure `lib/reminders/` — `computeReminders(milestones, opts)`,
  `dueReminders(reminders, lastSeenISO, nowISO)` (idempotent). Scheduler = **Vercel Cron**
  (`/api/cron/reminders`, guarded by `CRON_SECRET`) over pg_cron (decision #2). New tables
  `push_subscriptions`, `reminder_state`, RLS via `is_deal_member`. Env: `VAPID_PUBLIC_KEY`
  (`NEXT_PUBLIC_`-ok), `VAPID_PRIVATE_KEY` (server), `CRON_SECRET`; kill switch
  `REMINDERS_DISABLED`; background push behind `PUSH_ENABLED`. **Risk:** idempotency on cron
  overlap (key on `(deal_id, milestone_id, fired-at-bucket)`) + UTC `YYYY-MM-DD` tz correctness.
  **ADR-014** (Architect, this sprint).
- **Compliance:** 🟡 UPL — process nudges only; footer "we surface your dates; the contract is the
  source of truth"; no deadline "of record."
- **Gate → unblock:** **none on the shipped path.** In-app needs no key; background push only needs
  VAPID + `PUSH_ENABLED`, default-OFF, so the build lands now. Email is the S2 fast-follow.
- **Roles consulted:** PM, Architect, Engineer, QA, UX.

#### H2 — Fact/date freshness sweep + `SourceStamp` primitive
**Pri:** P1 · **Est:** S · **ID:** S1-H2

> **As a founder, I want** dated legal/market/tax facts to carry a visible source + as-of date and
> fail CI when they don't, **so that** our claims don't rot into UDAP exposure.

- **Value/KPI:** accuracy/UDAP protection; introduces the reusable `SourceStamp`. *KPI:* zero
  unsourced dated facts in CI.
- **Dependencies:** none.
- **Acceptance criteria:** a `*.freshness.test.ts` fails when a typed dated fact lacks `source` +
  `asOf`; one tiny `<SourceStamp asOf source />` primitive renders source + as-of in `ink-soft`
  as real screen-reader-legible text (not a tooltip), used under every dated fact.
- **Test plan:** unit — every dated claim carries `source` + `asOf`; staleness flag past a
  threshold (~4-6).
- **Impl notes / ADR:** pure data assertion + the `SourceStamp` component. No runtime feature.
  **No ADR.**
- **Compliance:** 🟧 UDAP — neutral data presentation, no editorializing.
- **Gate → unblock:** none.
- **Roles consulted:** PM, Researcher, Architect, Engineer, QA, UX.

---

### S2 — Monetization on (close the "free while rivals charge" gap)

**KPI:** free→paid conversion at the unlock; WTP read across price points; realized-savings event
fires at unlock.
**Build sequence:** payments seam + entitlement table (no key) → webhook → paywall gate on the
artifact. Email seam composes onto the S1 cron in parallel.

#### #41 / #58 — Paywall / unlock + paid export
**Pri:** P0-gate · **Est:** L · **ID:** S2-PAY

> **As a buyer, I want** to unlock and export my finished offer packet for one honest flat fee,
> **so that** I keep 95%+ of my ~$10k without a commission, loan-, or title-cross-sell.

- **Value/KPI:** captures revenue + first measurable WTP; the realized-savings event fires here.
  *KPI:* free→paid conversion; price-point WTP read. Reused by S10 agent seats.
- **Dependencies:** funnel events (shipped); R1 (S1) for the email receipt path; **#58 binder-export
  depth attaches when R2 (S3) lands** (decision #5).
- **Acceptance criteria:** `/pricing` page (footer + marketing header + every unlock CTA target)
  with the **"How we make money" trust band** (`TrustCallout tone="info"`: "one flat fee — no
  commission, no kickbacks, no loan/title upsell"). The unlock moment is **inline at the
  highest-value artifact** (operative offer/export, `/deal/print`, handoffs) — never gating the
  educational journey or estimate tools. **Default-OFF (`PAYMENTS_ENABLED` unset):** unlock CTA
  renders "Paid export — coming soon" (mirrors the AI pill), free experience untouched —
  **mandatory default-off test.** **Enabled:** watermarked preview, DIY-vs-Guided semantic
  `<table>`, Stripe checkout with loading/success ("Unlocked ✓" + fires realized-savings)/cancel
  (nothing lost)/error ("you weren't charged") states. **Server-checked entitlement** on the
  artifact, never a client boolean. Honest pricing — real price before checkout, no fake scarcity,
  one-time flat fee stated plainly. Tier table keyboard-navigable, readable at 360px.
- **Test plan:** unit — webhook event → entitlement reducer (verify, idempotency on replay/dup,
  refund revokes, deal-scoping so a webhook for deal A never unlocks deal B) **~12-16**; paywall
  gate (default-off / source+key / kill switch) **~5**; tier→entitlement mapping **~4-6**. RTL —
  locked vs unlocked artifact, CTA, default-off absence (~6). E2E — paywall visible when enabled
  (test mode), export disabled until unlock; **webhook stays out of E2E** (mock at the seam) (~2).
- **Impl notes / ADR:** new `lib/payments/` seam mirroring RentCast — `PaymentsProvider`
  (`createCheckout`, `verifyUnlock`) + `NullPaymentsProvider` default + `StripePaymentsProvider`;
  `getPaymentsProvider()` gates on `!isPaymentsDisabled() && PAYMENTS_PROVIDER==="stripe" &&
  STRIPE_SECRET_KEY`. Pure `entitlement.ts` (`isUnlocked`, `tierFor`, `gate`). Routes
  `api/payments/checkout` + `api/payments/webhook` (**raw body** via `req.text()` +
  `constructEvent`, Next-15 body-parse off). New `deal_entitlements` table (migration `0009`,
  member-read / service-role write). Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `PAYMENTS_PROVIDER`/`PAYMENTS_ENABLED`,
  `PAYMENTS_DISABLED` kill switch. **ADR-016** (Architect, this sprint).
- **Compliance:** 🟪 RESPA — flat one-time unlock, never % of price or referral-for-fee. 🟧 UDAP —
  savings copy conditional ("up to ~2.5%, if you ask and the deal allows"), public-savings copy
  does not launch ahead of legal sign-off; realized-savings event asserts no guaranteed amount.
  🟩 GLBA — entitlement isolation (wrong-deal test). Entitlement spoofing — server-verified only.
- **Gate → unblock:** **Stripe test key + pricing decision #63.** Build lands behind
  `PAYMENTS_ENABLED` (Null provider) before the live key; flip on after #63 + key.
- **Roles consulted:** PM, Researcher, Architect, Engineer, QA, UX, Marketing.

#### #63 — Pricing decision + tiered DIY/Guided WTP test
**Pri:** P0 (founder decision) · **Est:** S (eng) · **ID:** S2-PRICE

> **As a founder, I want** to commit the flat unlock price, the DIY anchor, and at least one Guided
> tier tested *upward* toward the $1,995 in-market anchor, **so that** the team can monetize and we
> can measure WTP.

- **Value/KPI:** the single most blocking decision; gates S2 and S10. *KPI:* price-point WTP read.
- **Dependencies:** none (it *is* the dependency).
- **Acceptance criteria:** tiers are typed data (`tiers.ts`: `{id, priceId, includes[]}`) so the
  decision is a config change, not a rebuild; a bucket-assignment hook renders different price copy
  per bucket and fires the funnel event; DIY = export + binder, Guided = + handoffs/priority,
  Guided tested upward toward $1,995 (the $199–$499 band alone risks anchoring us "cheap DIY").
- **Test plan:** unit — pure bucket-assignment + tier→entitlement mapping (~4-6).
- **Impl notes / ADR:** config + instrumentation only; no architecture. **No ADR** (uses ADR-016).
- **Compliance:** 🟪 RESPA / 🟡 UPL — tiers are tools + education, not advice; flat, not %.
- **Gate → unblock:** **founder decision** — confirm (a) flat one-time unlock, (b) DIY anchor + ≥1
  Guided tier tested upward, (c) DIY-vs-Guided artifact split. Blocks S2; gates S10.
- **Roles consulted:** PM, Founders, Researcher, Architect, Engineer, QA, Marketing.

#### Funnel → unlock instrumentation + realized-savings event
**Pri:** P0 · **Est:** S · **ID:** S2-FUNNEL

> **As a founder, I want** the unlock funnel and a realized-savings event instrumented, **so that**
> every success metric in this backlog is measurable.

- **Value/KPI:** gates every conversion KPI. *KPI:* funnel completion at each stage.
- **Dependencies:** existing funnel events; `calculateSavings` (`lib/savings.ts`).
- **Acceptance criteria:** fire `unlock_viewed`, `checkout_started`, `unlock_completed`, and the
  **realized-savings** event (composes `calculateSavings` at unlock); pure event-payload builders.
- **Test plan:** unit — event-payload builders; regression — existing event schemas unbroken (~4-6).
- **Impl notes / ADR:** extend existing funnel events; pure builders. **No ADR.**
- **Compliance:** 🟧 UDAP — realized-savings payload asserts no guaranteed amount.
- **Gate → unblock:** none.
- **Roles consulted:** PM, Architect, Engineer, QA.

#### #42 — Email fast-follow (R1 reminders + receipts)
**Pri:** P1-gate · **Est:** M · **ID:** S2-EMAIL

> **As a buyer, I want** deadline reminders and my unlock receipt by email, **so that** I'm nudged
> even when the app is closed and have proof of purchase.

- **Value/KPI:** lights up R1's email channel + receipts. *KPI:* reminder email open / receipt deliverability.
- **Dependencies:** R1 (S1) for the reminder payload; #41 webhook for the receipt.
- **Acceptance criteria:** **default-OFF (`EMAIL_ENABLED` unset):** email path no-ops, in-app/push
  still work (mandatory default-off test). **Enabled:** R1 reminder + receipt enqueue with correct
  template/recipient; double opt-in; unsubscribe link in every email; receipts plain-text legible.
  Vendor mocked at the seam — **no live send in tests.**
- **Test plan:** unit — send-decision + payload build (`buildReminderEmail`/`buildReceiptEmail`)
  (~6); no E2E for delivery.
- **Impl notes / ADR:** new `lib/email/` seam (`EmailProvider.send`, `NullEmailProvider` default)
  + Resend impl behind `EMAIL_ENABLED` + `RESEND_API_KEY` + `EMAIL_DISABLED`. Wire into R1's
  `dueReminders` (adds an `email` channel) + the Stripe webhook. **ADR-020** (optional; fold into
  ADR-014 if not standalone — Architect, this sprint).
- **Compliance:** 🟧 UDAP — receipt/reminder copy non-directive.
- **Gate → unblock:** **Resend key** (recommend Resend; DNS verification is ops, not code). Ships
  default-OFF behind `EMAIL_ENABLED`.
- **Roles consulted:** PM, Architect, Engineer, QA, UX.

---

### S3 — Document custody (the connective tissue)

**KPI:** % of paid deals storing ≥1 document; binder retention to closing.
**Build sequence:** bucket + `deal_documents` table + Storage RLS → signed-URL upload/download
routes → consent gate + delete → attach-points.

#### R2 — Documents (upload / store / organize / consent / delete on Supabase Storage)
**Pri:** P0-gate · **Est:** L (heaviest single item) · **ID:** S3-DOCS

> **As a buyer, I want** a private, encrypted, per-deal vault for my disclosure, inspection report,
> and title commitment, **so that** my documents live with my deal and the paid unlock is worth
> keeping.

- **Value/KPI:** the connective tissue — A5 has nothing to attach a disclosure to, A4 can't hold a
  title commitment, T1 (S8) is hollow without it, and it unblocks #58 paid-export depth. *KPI:*
  paid deals storing ≥1 document; retention to closing.
- **Dependencies:** Supabase Storage (in stack). Build after S2 so paid deals are the ones storing
  docs. **Blocks S8 (T1)** and #58 depth.
- **Acceptance criteria:** a **"Documents" band** inside My Deal (`/dashboard` section + `/deal`),
  named distinctly from the existing print `DealBinder` (decision #1), with **attach-points** on
  A5 disclosure-review, A4 contacts, and the tracker. States: **empty** (single Upload + privacy
  one-liner), **upload** (per-deal **consent gate fires before the first upload** — explicit,
  dated, scoped, revocable GLBA copy — then progress bar → file row), **organized** (rows grouped
  Disclosures · Inspection · Title/Closing · Wire/Escrow · Other), **loading** (skeleton),
  **error** (too-large/blocked-type "we accept PDF/JPG/PNG up to N MB"; failure leaves other files
  safe), **default-OFF (`DOC_BINDER_ENABLED`)** ("Secure document storage — coming soon"),
  **delete** (confirm step → "Removed from our storage," brief Undo where feasible). The
  **wire-instructions** object carries the existing wire-fraud `TrustCallout`. Upload control
  keyboard-operable with a real `<input type="file">` fallback; progress via `aria-live`; type
  conveyed by text label not color.
- **Test plan:** unit — upload validator (size/MIME/count), deal-scoped storage-path builder,
  access-decision (role × consent, clone `canSeeFinancials` default-deny), delete-completeness,
  retention (`deletableAt`/`isExpired`) **~14-18**; RTL — uploader, list, delete confirm,
  default-off absence (~6); E2E — locked/empty state only (gated + needs storage) (~1). **RLS
  isolation:** member of deal A cannot list/read/download deal B (policy/integration test).
  **Consent-before-visibility:** non-owner sees no docs until consent; viewer never.
- **Impl notes / ADR:** new `lib/documents/` pure core — `validate.ts` (PDF/image allowlist, **no
  OCR-into-advice**), `binder.ts` (`organizeBinder`), `retention.ts`. Private Supabase bucket
  `deal-docs`, objects keyed `deal/<dealId>/<docId>`; **Storage RLS via `is_deal_member`/
  `has_deal_role`** (member-read, editor-write, owner-delete — analogue of `0005_deal_data.sql`).
  `deal_documents` metadata table + RLS (migration `0009`/`0010`); `kind` enum
  (`wire_instructions`/`disclosure`/`title_commitment`/`other`). **Signed-URL-only** upload/download
  (short TTL, never public). Encryption-at-rest is Supabase-native. No-op-safe client wrappers.
  Env: bucket name + `DOC_BINDER_ENABLED`. **Spikes:** signed-URL RLS enforcement (non-member
  token), delete removes object *and* row, path-traversal in the deal-id parse. **ADR-015**
  (Architect, this sprint).
- **Compliance:** 🟩 GLBA — per-deal consent + field-scoping + retention/delete-on-demand is the
  **hard gate**. 🟡 UPL — store, never interpret legal sufficiency. 🟦 FHA — no protected-class
  signal derived from stored docs; no OCR-into-advice. Wire-instructions renders the wire-fraud
  callout (assert copy).
- **Gate → unblock:** **GLBA custody legal sign-off** on per-deal consent + field-scoping +
  retention/delete. Ships behind `DOC_BINDER_ENABLED` default-OFF; flip after sign-off.
- **Roles consulted:** PM, Architect, Engineer, QA, UX, Legal.

---

### S4 — Productionize the AI explainers (cheapest jump in agent intelligence)

**KPI:** % of offer/budget sessions viewing an explainer; explainer→offer-completion lift.
**Build sequence:** `source-claude.ts` + seam branch → caching + rate-limit + abuse controls →
default-OFF until sign-off, then flip the env.

#### AI1 — Promote #36 offer-strength + #57 budget explainers to Claude
**Pri:** P0-gate · **Est:** M · **ID:** S4-AI1

> **As a buyer, I want** a grounded plain-English read of my offer strength and budget, **so that**
> I understand the deterministic factors the way an agent would narrate them — never advice.

- **Value/KPI:** the cheapest large jump in perceived agent intelligence; a decision + cost
  controls, not a rebuild. *KPI:* explainer view rate; explainer→completion lift. No R2 dependency.
- **Dependencies:** the shipped AI explainer seam + two impls + screening (`src/lib/ai/explainer/`);
  the existing Claude connector (`src/lib/ai/comps-ai.ts`, decision #3).
- **Acceptance criteria:** **same in-place explainer panels** (`OfferStrength`, `BudgetCalculator`)
  — no new IA. **Default-OFF (pre-sign-off):** the existing gray "Coming soon" pill — unchanged.
  **Offered:** secondary button → "Explaining…" (existing `AiState`) → indigo box under the LOUD
  uppercase production label ("AI-generated, educational only — not legal or financial advice, no
  acceptance guarantee") + "only restates the factors above" + attorney/lender handoff.
  **Unavailable / blocked-by-screening / error:** graceful fall-back to the deterministic read.
  **Rate-limited / cost-capped (new):** "You've reached today's explainer limit — the read above
  is always available." Output still passes `screenOutput`; the connector **never throws, never
  fabricates, returns `null`** on any failure/blocked output.
- **Test plan:** unit — Claude request-body builder (grounded, allowlisted inputs only, system
  instruction forbids advice/numbers — clone `buildGeminiRequestBody`/`GEMINI_SYSTEM_INSTRUCTION`),
  response mapper (valid/empty/garbage), gating, 429/timeout→null, screening integration, `cacheKey`
  **~20-26**; a gated `*.live.test.ts` for the real call. RTL — button present only when
  `NEXT_PUBLIC_AI_EXPLAINER` set; deterministic insights always render (default-off) (~4). No live
  E2E (CI has no key). **Regression (biggest):** the seam contract (`explainOfferStrength`/
  `explainBudget` signatures, Null-default, screening) and the Gemini impl stay green.
- **Impl notes / ADR:** new `source-claude.ts` (`ClaudeAiExplainer`) copying the
  `comps-ai.ts` connector shape (Anthropic Messages REST, `claude-haiku-4-5-*`, `x-api-key`/
  `anthropic-version` headers); generalize the Gemini system prompts to provider-neutral
  `buildExplainerMessages`. One `AI_EXPLAINER_SOURCE==="claude"` branch in `getAiExplainerSource()`.
  **The real work:** pure `cache.ts` (`cacheKey(input)` — hash of safe input + factor ids),
  per-deal/IP rate limit + daily spend cap (degrade to `{available:false}`), Anthropic
  prompt-caching of the static preamble — **all before default-on.** Env: `ANTHROPIC_API_KEY`,
  `AI_EXPLAINER_SOURCE=claude`; existing `AI_EXPLAINER_DISABLED` kill switch. **ADR-017**
  (Architect, this sprint; extended in S7).
- **Compliance:** 🟡 UPL is the whole ballgame — model only narrates our deterministic factors,
  never invents/computes/advises (allowlist + `screenOutput`). 🟦 FHA — no free-text reaches the
  model unscreened. 🟧 UDAP — conservative grounded-only claim copy; rising enforcement makes it
  non-optional.
- **Gate → unblock:** **public-AI-claims legal sign-off (hard) + Anthropic key.** Ship the provider
  **live but default-OFF**; flip `AI_EXPLAINER_SOURCE=claude` only after sign-off.
- **Roles consulted:** PM, Architect, Engineer, QA, UX, Legal.

---

### S5 — Financing spine (the most dangerous under-contract gap)

**KPI:** % of under-contract deals tracking ≥1 financing milestone; reminder coverage of the
financing date.

#### F1 — Financing-milestone tracker
**Pri:** P0 · **Est:** M · **ID:** S5-F1

> **As a buyer, I want** to track the loan process — application, appraisal, underwriting
> conditions, clear-to-close-by-financing-date — **so that** my financing doesn't quietly blow up
> the deal between acceptance and closing.

- **Value/KPI:** between offer-accepted and CTC the loan is the thing most likely to collapse a
  deal; composes cleanly on S1. *KPI:* financing-milestone coverage; financing-date reminder coverage.
- **Dependencies:** R1 (S1) + R3 (S1); appraisal arithmetic exists (`lib/tools/clear-to-close.ts`).
- **Acceptance criteria:** a new stage-scoped tool (`STAGE_TOOLS`, under-contract/financing stages,
  not the top bar) + cockpit-surfaced. Milestone checklist with date inputs (loan app, appraisal,
  CTC-by) → status chip + "Set a reminder" per milestone; financing milestones **flow into
  `computeMilestones` → R1 reminders → R3 cockpit** as "do this now" cards. States: default,
  empty ("enter your financing dates"), loading (`hydrated`), inline date-validation error. No
  vendor gate (reminders still gated on sign-in per R1).
- **Test plan:** unit — financing-milestone computation + CTC-by-date/appraisal arithmetic
  (clone/extend `clear-to-close.test.ts`) + reminder/cockpit composition; date-move re-fires; missing
  date → graceful empty **~10-14**; RTL — milestones + empty state (~4); E2E — milestone appears in
  cockpit after dates set (~1).
- **Impl notes / ADR:** pure `lib/financing/milestones.ts` (`computeFinancingMilestones`) extending
  the `clear-to-close` step model, anchored off `financingContingencyDays` from `lib/deadlines.ts`;
  emits `Milestone[]`-compatible items so R1/R3 consume them with no new plumbing. Persist via
  `useStageTool("financing")`. No new tables, no flags. **No ADR.**
- **Compliance:** 🟫 SAFE-Act — process-only; "ask your lender," never quote a rate-as-offer or
  recommend a lender; no lender names as advice. Reuses low-appraisal math with neutral framing.
- **Gate → unblock:** **none** (SAFE-Act is a content boundary, not a vendor gate).
- **Roles consulted:** PM, Architect, Engineer, QA, UX.

---

### S6 — Title/closing depth + post-close LTV

**KPI:** title-review completion among under-contract deals; post-close page engagement / return visits.

#### F2 — Title-commitment review + pre-CD closing-cost estimator
**Pri:** P1-gate · **Est:** M · **ID:** S6-F2

> **As a buyer, I want** a checklist of what to check and ask the title officer, plus a pre-CD
> closing-cost estimate, **so that** I catch a title problem and aren't surprised by cash-to-close.

- **Value/KPI:** title-risk catch + cash-to-close transparency. *KPI:* title-review completion.
- **Dependencies:** state engine + A5/A6 checklist pattern (shipped); S3 binder for the attached
  title commitment; S1 milestone integration.
- **Acceptance criteria:** title review is an **A5-pattern checklist** ("what to check / what to
  ask the title officer," never "this exception is/isn't a problem"), state-aware via
  `getStateProfile`, attaching the stored title commitment from the S3 binder. Closing-cost
  estimator: inputs → estimated cash-to-close before the CD, labeled estimate-only. States mirror
  the existing checklist tools (default/empty/loading-via-`hydrated`/inline-validation). Quiet
  `ToolDisclaimer` on the estimator; loud `TrustCallout` on the CD-3-day edge.
- **Test plan:** unit — closing-cost estimator math (~10), title-checklist generation; RTL —
  neutral checklist copy, estimator (~6); E2E — title review on an under-contract deal (~1-2).
- **Impl notes / ADR:** pure `lib/tools/title-review.ts` (`buildTitleChecklist`) + `lib/tools/
  closing-cost-estimate.ts` (`estimateClosingCosts`, reusing `formatUSD`/CD line patterns).
  Component clones `disclosure-review.tsx`. **No ADR.**
- **Compliance:** 🟡 UPL — surface what to check/ask, never adjudicate exceptions.
- **Gate → unblock:** **title-review legal boundary** — reuse the already-cleared A5/A6 boundary
  copy verbatim (same regime; do not re-author).
- **Roles consulted:** PM, Architect, Engineer, QA, UX, Legal.

#### F3 — Post-close depth (homestead/exemption deadlines, tax-appeal windows, escrow literacy, refi-watch)
**Pri:** P1 · **Est:** M · **ID:** S6-F3

> **As a buyer, I want** state-aware post-close deadlines and literacy (homestead, tax-appeal,
> escrow analysis, refi-watch), **so that** I don't miss a filing window after I close.

- **Value/KPI:** the cheapest retention/referral surface + evergreen SEO that extends LTV past the
  one transaction. *KPI:* post-close return visits.
- **Dependencies:** the 50-state engine (`StateProfile`). Independent evergreen content.
- **Acceptance criteria:** a real linkable post-close surface (journey stage-14+ extension +
  `/states/[code]` "After you close in <state>" band) with state-aware deadline cards (homestead
  filing deadline, tax-appeal window), an escrow-analysis explainer, and a passive refi-watch note.
  Each fact carries a `SourceStamp` (source + as-of, H2 cadence). Empty/no-state → state picker.
  Unknown state → safe fallback, no crash.
- **Test plan:** unit — state-aware deadline resolution (~8) + source/as-of presence (~4); RTL —
  post-close page; E2E — page loads per state (~1).
- **Impl notes / ADR:** state-aware typed `StateProfile` data (ADR-008 pattern), pure
  `lib/tools/post-close.ts` (`postCloseDeadlines(state)`). Refi-watch is content/education, **not**
  a live-rate feed. No flags. **No ADR.**
- **Compliance:** 🟡 UPL / 🟧 UDAP — tax/homestead framed neutrally, sourced, as-of-dated ("check
  your county's deadline," never "you qualify"). 🟦 FHA — no demographic/value proxies. 🟫 SAFE-Act
  — refi-watch is education, not a rate quote.
- **Gate → unblock:** none.
- **Roles consulted:** PM, Researcher, Architect, Engineer, QA, UX.

---

### S7 — SEO + tools flywheel (press the moat) + AI explainer extension

**KPI:** organic sessions to tool pages; tool-page→activation; A2-rationale explainer view rate.

#### SEO1 — Tool-led transactional-intent pages on the 50-state engine
**Pri:** P1 · **Est:** M · **ID:** S7-SEO1

> **As a buyer, I want** working "…in <state>" tool pages (savings calc, offer builder, closing
> path), **so that** I find HomeOffer organically and land on a usable tool, not just prose.

- **Value/KPI:** lowest-CAC acquisition; presses the 50-state moat (Homa is FL-only). *KPI:* organic
  sessions to tool pages; tool-page→activation.
- **Dependencies:** the shipped 50-state engine + 51 pages.
- **Acceptance criteria:** transactional "…in <state>" tool-led pages under `src/app/tools/.../
  [state]/page.tsx` via `generateStaticParams` + per-state `generateMetadata`, **tuned for
  AI-Overview resilience** = interactive tool embeds + structured data, not pure prose. Each page =
  a working tool above the fold + "…in <state>" framing + a keyboard-reachable, descriptive "Start
  your <state> journey" activation CTA. Empty/unknown-state → sensible default + state picker;
  invalid slug → 404/safe. `SourceStamp` on any state facts. Mobile-first.
- **Test plan:** unit — page-data/metadata + state resolution (~6); RTL — tool pages render
  expected tool + disclaimer (~4); E2E — a sample of state tool pages load with correct heading
  (role/text, `.first()`) (~3). Regression — existing 51 routes unbroken (`states.test.ts`).
- **Impl notes / ADR:** extend the 50-state page engine (ADR-001/008); the state×tool matrix is
  generated, not hand-authored; pure metadata/param builders. No new infra, no flags. **No ADR.**
- **Compliance:** 🟦 FHA — SEO/saved-search on objective attributes only, no demographic / "good
  schools as value" proxies (assert allowlist excludes such fields).
- **Gate → unblock:** none.
- **Roles consulted:** PM, Researcher, Architect, Engineer, QA, UX, Marketing.

#### AI2 — Grounded explainers on A2 price-band rationale + disclosure red-flags
**Pri:** P1-gate · **Est:** M · **ID:** S7-AI2

> **As a buyer, I want** a grounded narration of my suggested price-band rationale and disclosure
> red-flags, **so that** I understand the range the way an agent would — "you decide," never "offer $X".

- **Value/KPI:** extends the proven seam to the highest-value, most-directive-prone surface. *KPI:*
  A2-rationale explainer view rate.
- **Dependencies:** AI1 (S4) provider + public-claims sign-off being live. Pure reuse of the seam.
- **Acceptance criteria:** same in-place explainer pattern (S4), extended to the A2 suggested-range
  step (`suggested-range-step.tsx`) and disclosure-review. Same LOUD label, same "restates the
  factors above," same handoff. **Default-OFF "Coming soon" pill** until the S4 sign-off. **A2 is
  the most conservatively grounded surface** — narration says "comps + the market *suggest a range*;
  you decide," **never "offer $X."**
- **Test plan:** unit — A2 explainer grounding + no-directive screening (`screenOutput` rejects any
  "offer $N") (~10); RTL — explainer renders with the conservative label (~4); E2E — none for the
  live provider (assert default-off). Same seam-contract regression suite as S4.
- **Impl notes / ADR:** add `explainPriceBand`/`explainDisclosure` to `AiExplainerSource` + new
  grounded input types, grounded in `suggestPriceBand` output (`lib/offer/suggested-price.ts`) and
  the disclosure checklist; new system-instruction constants + pure prompt builders; routes mirror
  `api/offer/explain/route.ts`. No new provider. **Extends ADR-017** (Architect).
- **Compliance:** 🟡 UPL — most conservative grounding (suggests a range, never a number). 🟦 FHA —
  disclosure narration on property condition, not people.
- **Gate → unblock:** **the same public-AI-claims sign-off as S4.** Ships default-OFF.
- **Roles consulted:** PM, Architect, Engineer, QA, UX, Legal.

---

### S8 — Light up the shared deal workspace (the dormant two-sided promise)

**KPI:** invited-member activation (invitee performs ≥1 action on a shared deal); co-buyer/agent retention.

#### T1 — Shared activity feed, attribution, presence, conflict handling + agency capture
**Pri:** P1-gate · **Est:** L→XL (split per decision #5) · **ID:** S8-T1

> **As a represented buyer, I want** to invite my agent/co-buyer/attorney into a shared deal with a
> live activity feed and consent-controlled visibility, **so that** we coordinate without exposing
> my financials before I agree.

- **Value/KPI:** activates the dormant collaboration foundation; serves the represented-buyer
  persona. *KPI:* invitee activation; multi-party deal retention.
- **Dependencies:** **R2 (S3)** — nothing worth sharing without documents (the "Attach a document"
  affordances become the shareable objects). Deals/roles/RLS/invites + `DealAgency` shipped.
- **Acceptance criteria:** lives in `/deal` (gated by `isDealsEnabled`, route 404s when off). The
  flow is **consent-before-visibility:** (1) owner invites a member by email/role; (2) **forced
  agency-relationship capture** (`represents_buyer`/`listing_side`/`unrepresented`, using
  `lib/deals/agency-copy.ts`, with the dual-agency caution on `listing_side`) before an **agent**
  sees any buyer data; (3) a distinct, **dated, revocable, default-OFF financial-data consent**
  toggle before financials become visible (until then the agent sees only non-financial context —
  **field-level scoping enforced in RLS, not just UI**); (4) shared state with an activity feed
  (change attribution), presence ("Y is viewing"), and **conflict handling** (last-write with a
  visible "Z changed this since you opened it — review," never a silent clobber). States: empty
  (solo reassurance), pending invite, invitee first-action first-run (the activation KPI),
  consent-not-given (honest "financial details hidden until <owner> consents"), **DRAFT legal state**
  (`LEGAL_DRAFT_BANNER` until `LEGAL_REVIEW_APPROVED`), conflict, revoked (immediate "Access
  removed"). Consent toggle is a real labelled checkbox (`aria-pressed`), not a custom non-operable
  control.
- **Test plan:** unit — conflict/merge resolution (clone `sync/merge.test.ts`) **~10-14**; visibility
  decision (role × consent × agency-captured, extending `canSeeFinancials`) **~10**; activity-
  attribution reducer **~6**; RTL — feed, presence, consent-gated empty state (~6); E2E — invitee
  acts → appears in feed (single-browser proxy; realtime kept thin) (~1-2). Regression — re-run
  deals/membership/invites/financials/sync suites.
- **Impl notes / ADR:** pure `lib/workspace/` — `activity.ts` (`buildActivityFeed`), `conflict.ts`
  (extends `lib/sync/merge.ts`). `deal_activity` append-only table + RLS via `is_deal_member`.
  **Realtime phased (decision #5):** Phase-1 Supabase Postgres-Changes → re-fetch (reuses RLS) for
  the feed/shared tool state — **ship this in S8**; Phase-2 Broadcast/Presence is the fast-follow.
  Realtime authorization **reuses RLS** — never broadcast a financial field the recipient lacks
  consent for. Wire the existing `agency-consent.tsx`/`deal_agency`/`saveDealAgency` in as a
  visibility *gate*, don't rebuild. Env: `WORKSPACE_REALTIME` (poll-fallback default) + deals flag.
  **Spikes:** realtime transport, conflict semantics on one `deal_data` row, GLBA field-scoping.
  **ADR-018** (Architect, this sprint). **This is the realtime-transport decision S9 reuses.**
- **Compliance:** 🟩 GLBA — field-level scoping + per-deal consent-before-visibility (dated,
  revocable) + dual-agency capture is the **hard gate**. 🟪 RESPA — review any shared revenue surface
  (assert none is referral-for-fee).
- **Gate → unblock:** **GLBA scoping + consent + dual-agency capture; RESPA review** (legal sign-off
  on consent-before-visibility + agency-capture). Ships default-OFF behind the workspace flag; if
  realtime slips, feed + consent-gating ship as L and presence trails.
- **Roles consulted:** PM, Architect, Engineer, QA, UX, Legal.

---

### S9 — In-deal comms + live-data parity

**KPI:** messages sent per active shared deal; live-data tool usage at no margin breach.

#### T3 — In-deal messaging / structured comments (the top FHA leak vector)
**Pri:** P1 · **Est:** M→L · **ID:** S9-T3

> **As a buyer, I want** to message my co-buyer, agent, or attorney inside the deal, **so that**
> coordination stays on-platform — with every message screened so nothing discriminatory or
> steering reaches the other party.

- **Value/KPI:** keeps coordination on-platform. *KPI:* messages per shared deal. **The riskiest
  high-volume free-text surface in the roadmap.**
- **Dependencies:** T1 (S8) for a workspace to comment on + the realtime transport decided in S8.
- **Acceptance criteria:** a messaging band inside `/deal`. **Every message routes 100% through
  `screenText`/`screenOutput` on the server before persist/broadcast, and is OFF the AI allowlist**
  — it's a comms pipe, not advice. States: empty, composing (send disabled while empty/sending),
  sent (attributed + timestamped semantic list, `aria-live` on arrival), **screened-out** (honest,
  non-accusatory "this message can't be sent as written — keep it about the property and the deal"),
  error (draft preserved). Compose box keyboard-operable, send ≥44px.
- **Test plan:** unit — message screening with the **full protected-class matrix + love-letter/
  "forever home"/steering** (the densest screening density in the roadmap), dedupe, clean-passthrough
  **~16-20**; assert messaging is **not** on `buildSafeAiInput`/the model path; RTL — composer
  blocks/flags, thread renders (~5); E2E — clean message appears, flagged message blocked/sanitized
  (~2).
- **Impl notes / ADR:** pure `lib/messaging/message.ts` (`prepareMessage` routing through
  `src/lib/ai/screening.ts`). `deal_messages` table + RLS via `is_deal_member`; realtime via the
  S8 transport. **ADR-019** (Architect, this sprint).
- **Compliance:** 🟦 FHA — 100% through the server-side screen (never client-side); no protected-
  class/steering/love-letter content reaches the other party. 🟡 UPL — comms pipe, not advice.
- **Gate → unblock:** **none new** (FHA enforced in-code; the screening seam is the gate).
- **Roles consulted:** PM, Architect, Engineer, QA, UX.

#### P2-6 — Productionize the flagged RentCast market/listings tools to parity
**Pri:** P2 · **Est:** M · **ID:** S9-RC

> **As a buyer, I want** real market/listings data where available, **so that** my comps and market
> read are live — table stakes, capped by a kill switch when data-cost spikes.

- **Value/KPI:** data parity (becoming table stakes, not a wedge). *KPI:* live-data tool usage at no
  margin breach.
- **Dependencies:** the shipped, flagged RentCast seam.
- **Acceptance criteria:** **default (`RENTCAST_DISABLED` / no key):** mock/null source + the
  existing "sample listings" `DisclaimerBanner` — never a broken/empty grid (clone
  `rentcast-flag.test.ts`). **Enabled + key:** real source within margin guardrails; a data-cost
  breach trips the kill-switch path. Loading skeletons; per-tool error → "Live data unavailable;
  showing samples." `SourceStamp` on live data; no FHA-proxy filters in search. Resolve the open
  `/v1/markets` field-name spike (ADR-013) and finish `mapRentCastMarket` / the listings connector.
- **Test plan:** unit — gating + margin guard (~8) + source mapping (~6); E2E — listings page works
  with mock source (default) (~1). Regression — re-run all RentCast flag/listings/market/comps
  suites (CI has no RentCast key; default behavior must stay green).
- **Impl notes / ADR:** land the existing seams; flip `LISTINGS_DATA_SOURCE`/`MARKET_DATA_SOURCE`
  to `rentcast` with the key; `RENTCAST_DISABLED` caps all three RentCast seams at once. Keep
  manual-entry as the permanent thin-coverage fallback. **No new ADR** (resolves ADR-013 spike).
- **Compliance:** 🟦 FHA — `MarketStats` carries transactional data only; honest sample-vs-live copy.
- **Gate → unblock:** **none new** (shipped, flagged; kill switch caps cost).
- **Roles consulted:** PM, Architect, Engineer, QA, UX.

---

### S10 — Agent console wedge (gated expansion) + trust upkeep

**KPI:** agent seat sign-ups / pipeline deals per agent (pilot); honesty-copy currency.

#### T2 (#62) — Agent multi-client console / pipeline / "For agents" + seat model
**Pri:** P1-gate · **Est:** L→XL (hard-gated) · **ID:** S10-T2

> **As an agent, I want** a multi-client pipeline console and a paid seat, **so that** I can manage
> my buyer deals in one place — without the product ever becoming a referral-for-fee scheme.

- **Value/KPI:** the expansion/monetization wedge. *KPI:* agent seat sign-ups; pipeline deals per
  agent. **Last by design** — defends the buyer-hero lane first.
- **Dependencies:** T1 (S8) proving the single-deal loop; the S2 payments seam (seat = a distinct
  entitlement tier — no second billing integration); S8 field-scoping + agency-capture.
- **Acceptance criteria:** audience-aware nav (for audience=agent, the Journey anchor becomes
  "Console" at `/agent`; My Deal scopes to the selected client; a "For agents" entry that **does not
  dilute the buyer homepage hero**). Console = a cross-deal pipeline filtered by the agent's
  `deal_members` rows (`role='agent'`) — **agents see only member deals (RLS)**; per-client deadline/
  next-action reuses the S1 cockpit rollup; selecting a client re-scopes My Deal respecting S8
  consent (an agent still sees only consented financials). **Seat/paywall state:** "coming soon"
  when the pricing gate is unset (mirrors the S2 paywall). Empty (no clients) → "invite a client or
  add a deal." Console is a semantic table/list, keyboard-navigable.
- **Test plan:** unit — seat/entitlement model (RESPA-clean, **no referral-fee field**) (~6),
  agent-deal scoping/RLS (clone `canSeeFinancials`/membership) (~8); RTL — console pipeline + default-
  off absence (~5); E2E — "For agents" entry renders when enabled (~2). Regression — T1 + all RLS/
  membership/consent suites; buyer-side UPL/FHA suites stay green (agent path is additive).
- **Impl notes / ADR:** pure `lib/agent/pipeline.ts` (`buildPipeline`, composing `listMyDeals`/
  `listMembers`/`getDealAgency`). New `src/app/agents/` route + `useAudience` audience-aware nav.
  Seat = an entitlement kind on the **S2 payments seam** (reuse ADR-016, no new payment infra). New
  flag `AGENT_CONSOLE_ENABLED` (default off). **No new ADR** (reuses ADR-016/018).
- **Compliance:** 🟪 RESPA — paid seats must NOT be referral-for-fee; the pro directory stays the
  only referral surface, fee-free; seat copy is a tool subscription. 🟡🟦 the agent path must not
  relax buyer UPL/FHA guardrails. The unrepresented buyer stays the homepage hero.
- **Gate → unblock:** **pricing decision #63 + RESPA review.** Build only after S2 monetization
  proves out; ships default-OFF behind `AGENT_CONSOLE_ENABLED`.
- **Roles consulted:** PM, Founders, Architect, Engineer, QA, UX, Legal.

#### H1 — Listings/MLS honesty refresh
**Pri:** P2 · **Est:** S · **ID:** S10-H1

> **As a founder, I want** `/listings` honesty copy kept current as Clear Cooperation / portal
> policy evolves, **so that** we never imply MLS-completeness or a real feed we don't have.

- **Value/KPI:** trust/accuracy currency. *KPI:* honesty-copy currency.
- **Dependencies:** the existing sample-data `DisclaimerBanner`.
- **Acceptance criteria:** `/listings` honesty copy current (Clear Cooperation / portal policy); no
  real-feed claim; the demo banner stays gated on the mock source.
- **Test plan:** component — honesty copy strings present (~3); E2E — copy on `/listings` (~1).
- **Impl notes / ADR:** copy + the H2 freshness stamp. **No ADR.**
- **Compliance:** 🟧 UDAP — no full-market-coverage implication; portal-neutral.
- **Gate → unblock:** none.
- **Roles consulted:** PM, Architect, Engineer, QA, UX, Marketing.

#### H2 — Recurring fact/date sweep
**Pri:** P2 · **Est:** S · **ID:** S10-H2

> **As a founder, I want** the recurring source+date sweep re-run, **so that** dated facts across
> the product stay current.

- **Value/KPI:** accuracy upkeep. *KPI:* zero stale dated facts.
- **Dependencies:** the S1 H2 freshness test + `SourceStamp`.
- **Acceptance criteria:** dated facts carry source + as-of; the staleness flag fires past threshold.
- **Test plan:** the S1 freshness test re-run as a standing cadence (~recurring).
- **Impl notes / ADR:** the recurring cadence of the S1 H2 mechanism. **No ADR.**
- **Compliance:** 🟧 UDAP — neutral, dated.
- **Gate → unblock:** none.
- **Roles consulted:** PM, Researcher, QA.

---

## 4. Spikes & open questions

Resolve each before committing the dependent story.

1. **Scheduler / push (S1, blocks R1 background push only).** Vercel Cron route + `CRON_SECRET`
   idempotency (don't double-fire on cron overlap; key on `(deal_id, milestone_id, fired-at-bucket)`)
   and UTC `YYYY-MM-DD` tz/DST correctness; VAPID keypair as a default-OFF `PUSH_ENABLED` flag.
   *In-app + client-on-open ships regardless, gate-free.*
2. **Storage RLS (S3).** Verify a Storage policy calling `is_deal_member` on the deal-id parsed from
   the object path actually denies a non-member token; signed-URL TTL; path-traversal in the deal-id
   parse; delete removes both object and row.
3. **Stripe webhook (S2).** Raw-body signature verification in the App Router (`await req.text()` +
   `constructEvent`, Next-15 body-parse off); idempotency on replay/duplicate/out-of-order events;
   test-mode price IDs per tier; entitlement source of truth = webhook-written DB row.
4. **Realtime transport (S8, reused by S9).** Supabase Postgres-Changes/Presence vs. polling for the
   feed + presence; conflict semantics on one `deal_data` row; GLBA field-scoping of which financials
   facets an invited agent may read pre-consent. **Decide once in S8** (recommend Phase-1 Postgres-
   Changes, presence as fast-follow, `WORKSPACE_REALTIME` poll-fallback default).
5. **Provider cost / caching (S4).** `cacheKey` hash of grounded input; where the daily spend-cap
   state lives (in-memory vs. counter row); Anthropic prompt-caching of the static preamble; confirm
   streaming not needed (short narration → single shot). Plus the residual **RentCast `/v1/markets`
   field-name spike** (S9, ADR-013) — DOM/inventory/list-price-trend are available; list-to-sale and
   the months-of-supply denominator stay manual-entry.

### Founder-decision / legal-sign-off register (critical path)

| Item | Type | Blocks (default-ON) | Recommended action / timing |
|---|---|---|---|
| **Pricing model + tier boundary (#63)** | Founder decision | **S2 paywall**; gates **S10** | Confirm now: flat one-time unlock; DIY anchor + ≥1 Guided tier tested upward toward $1,995; DIY-vs-Guided split. *Single most blocking decision.* |
| **Public AI claims sign-off** | Legal | **AI1 default-on (S4)**; **AI2 (S7)**; public-savings copy (S2) | Schedule now; clear conservative grounded-only "narrate-our-numbers" copy. One clearance covers S4 + S7. |
| **Document-custody consent/retention** | Legal (GLBA) | **R2 (S3)** | Schedule now; sign per-deal-consent + field-scoping + retention/delete-on-demand. |
| **Shared-workspace consent + agency-capture + RESPA posture** | Legal (GLBA/RESPA) | **T1 (S8)**; **T2 (S10)** | Schedule now; sign consent-before-visibility + agency-capture; RESPA review on shared revenue + agent seats. |
| **Title-review boundary** | Legal | **F2 (S6)** | Reuse the already-cleared A5/A6 disclosure-review boundary copy (same regime; no re-author). |
| **Vendor keys** | Vendor | per story | Stripe test key (S2, now), Resend (S2), Anthropic key (S4), VAPID (S1 push). All ship behind default-OFF flags. |
| **E-signature (#45)** | Vendor | — | **NOT on this 10-sprint critical path.** Defer to the legally-reviewed paid-contracts epic; flag only. |
| **Real listing feed (IDX/MLS)** | Strategic/cost | — | Out of sprint scope; keep `/listings` honest (H1) until a data deal exists. |

---

## 5. Sprint-1 "Definition of Ready" check — confirm S1 is gate-free and ready to build now

S1 (reminders + cockpit) is the **buildable-now** sprint and **carries no external gate**. Against
the DoR:

1. **Stories unambiguous?** ✅ R3 (cockpit), R1 (reminders, in-app first / push trailing), H2
   (freshness + `SourceStamp`) each have agreed acceptance criteria + a layered test plan above.
2. **Dependencies met or scheduled earlier?** ✅ All composable from shipped code — accounts/sync,
   `computeMilestones`, stage selectors, A4 contacts, `buildHomeRollups`/`deriveNextAction`. R3 has
   no new infra; R1's only new infra (the scheduler) is the sprint's long pole and is owned by
   ADR-014; H2 is independent.
3. **Factual claims sourced/dated?** ✅ S1 surfaces no new market/legal facts; H2 *establishes* the
   source+date discipline (`SourceStamp` + freshness test) the later sprints depend on.
4. **Legal sign-off / vendor key cleared or scheduled, with a default-OFF seam?** ✅ **No legal
   sign-off and no vendor key are required for the shipped S1 path.** In-app reminders + the cockpit
   need neither; background Web Push needs only a VAPID keypair, which ships **default-OFF behind
   `PUSH_ENABLED`** — so the build lands now and the key (if/when added) clears into merged software.
   Email is deliberately the S2 fast-follow.
5. **IA + reused patterns identified?** ✅ Cockpit = top band of `/dashboard` (My Deal anchor,
   replaces the static `WhatsNext` strip — **no new top-bar anchor**); reminders = per-card "Set a
   reminder" affordance + an `/account` preferences panel; H2 = the `SourceStamp` primitive. Reuses
   `WhatsNext`/`hydrated`, `UndoToast`, `statusFor`, the `role="dialog"` sheet, `useAuth`.

**Verdict: S1 is READY to build now.** Recommended in-sprint build order: **H2 (independent) ‖ R3
(pure composition) → R1 last** (the scheduler is the only new infrastructure; ship the pure deriver
+ in-app channel first, with background push trailing behind `PUSH_ENABLED` if the scheduler spike
runs long — S1 stays gate-free either way).
