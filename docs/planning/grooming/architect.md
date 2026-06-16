# Architect — 10-Sprint Grooming (technical direction)

_Contributor: Architect · 10-sprint grooming · 2026-06-16_

Source of truth: `docs/planning/roadmap-10-sprints.md` (S1..S10). This document grooms
each sprint epic into technical direction: the approach (extend an existing seam vs. a
new module/service), data/storage, external deps + env flags + default-off gating, the
ADRs to write, and the risks + build-sequence.

## Architectural through-lines (apply to every sprint)

These are the codebase invariants every epic below inherits — do not re-derive them per
sprint.

- **Provider-seam pattern (the house style).** Every external/gated capability ships as
  a `Null*`/`Mock*` default implementation behind a typed contract, plus a real
  implementation selected by a server-only switch function. The switch is a **three-part
  gate**: `!isXDisabled()` (kill switch) AND `X_SOURCE === "<vendor>"` AND the vendor key
  is present — see `getListingsDataSource()` / `isRentCastListingsActive()`
  (`src/lib/listings/provider.ts`) and `getAiExplainerSource()` / `isAiExplainerActive()`
  (`src/lib/ai/explainer/source.ts`). The real source **never throws and never
  fabricates**; any failure degrades to the safe default. New gated work MUST follow this
  shape so it ships default-off and the gate clears into working software.
- **Separate, tracked kill switch per capability.** `isRentCastDisabled()`
  (`src/lib/rentcast-flag.ts`) and `isAiExplainerDisabled()`
  (`src/lib/ai/explainer/explainer-flag.ts`) are the template: one truthy
  (`1|true|yes|on`) env var that the gate checks FIRST, flippable without disturbing
  provider config (cost spike, outage, bad data, legal hold). Every new vendor seam gets
  its own `*_DISABLED` flag.
- **Pure, unit-tested core.** Domain logic is pure functions with no React/IO
  (`lib/deadlines.ts`, `lib/savings.ts`, `lib/market/classify.ts`) so it is trivially
  testable and reused by multiple consumers without divergence. Favor this for every new
  computation; isolate IO at the seam edge.
- **Secrets are server-only.** Switch functions and connectors read `process.env`
  (non-`NEXT_PUBLIC_`) and are never imported by client code. A `client-flag.ts` exposes
  only an availability boolean to the UI (see `src/lib/ai/explainer/client-flag.ts`).
- **Persistence ladder.** Device-local `localStorage` via namespaced hooks
  (`useStageTool`, `useProgress`, `useTracker`) is the default; `emitLocalChange()` lets a
  future story sync any tool to the deal without touching the tool. Shared data lives in
  Supabase behind **RLS via `SECURITY DEFINER STABLE` membership helpers**
  (`is_deal_member`, `has_deal_role`) with membership columns indexed, additive migrations,
  and `TO authenticated` policies wrapped in `select(...)` (see
  `supabase/migrations/0004_deals.sql`). All multi-user/Supabase features are
  **feature-gated on Supabase being configured** — no keys ⇒ app behaves exactly as today.
- **FHA/UPL boundary is in code, not policy.** Any AI/free-text surface routes through
  `screenText` (inputs) + `screenOutput` (outputs) with a hard **allowlist**
  (`AI_INPUT_ALLOWLIST`, `src/lib/ai/screening.ts`); the model narrates OUR deterministic
  factors and never computes/advises/steers.

ADR numbering continues from the latest in `adr.md` (**ADR-013**), so new ADRs start at
**ADR-014**. Proposed ADRs are summarized at the end.

---

## S1 — Reminders + cockpit (no gate; ship first)

### R1 — Reminders (in-app / browser-push first)
- **Approach: new module + a server scheduler service — the one genuinely new piece of
  infra in S1.** The deadline math already exists and is pure (`computeMilestones`,
  `lib/deadlines.ts`); a reminder is "a milestone whose date crosses a threshold relative
  to today, not yet acknowledged." Build `lib/reminders/` as **pure functions**
  (`deriveReminders(milestones, offsets, now) → Reminder[]`, `nextFireAt(reminder)`,
  re-fire diffing when contract dates move) so the whole policy is unit-testable; the
  scheduler is a thin IO shell over it.
- **Delivery: in-app + Web Push (default), no email.** In-app is a cockpit read of the
  pure deriver. Browser push uses the **Web Push API + VAPID** keys (a service worker +
  `PushSubscription` stored per user) — no third-party vendor, satisfying "no gate this
  sprint."
- **Scheduler mechanism — recommend Vercel Cron** over a Supabase scheduled function (pg_cron).
  Rationale: accounts/sync are already server-side and the app deploys to Vercel (ADR-001);
  a Vercel Cron route (e.g. `/api/cron/reminders` hourly) runs in the same TypeScript
  runtime, can import the pure deriver directly, holds the VAPID/server key as a Vercel env
  secret, and is observable with the rest of the app. pg_cron would split reminder logic
  into SQL/Edge and duplicate the deadline math. Guard the cron route with a
  `CRON_SECRET` header check. (If Web Push proves flaky, the same cron route is the email
  sender in S2 — one mechanism, two channels.)
- **Data/storage:** new `push_subscriptions` (user_id, endpoint, keys, created_at) and
  `reminder_state` (deal_id, milestone_id, fired_at, acknowledged_at, last_seen_date) tables,
  RLS-scoped via `is_deal_member`. Reminder *preferences* (opt-in, lead-time) persist
  per-tool via `useStageTool`/`useTracker` and sync to the deal.
- **Deps/flags:** Web Push (no vendor). Env: `VAPID_PUBLIC_KEY` (can be `NEXT_PUBLIC_`),
  `VAPID_PRIVATE_KEY` (server-only), `CRON_SECRET`. New kill switch
  `REMINDERS_DISABLED` (mirrors `RENTCAST_DISABLED`). Ships behind the opt-in; the cron
  no-ops when disabled or no subscriptions exist.
- **Risk:** the scheduler is the first always-on server job — idempotency (don't double-fire
  on cron overlap; key on `(deal_id, milestone_id, fired_at-bucket)`) and clock/timezone
  correctness (reuse the UTC `YYYY-MM-DD` frame from `lib/deadlines.ts`). **UPL:** reminders
  are *process* nags ("schedule your inspection by the contingency date"), never directive;
  no deadline is "of record."

### R3 — Active next-actions dashboard
- **Approach: pure composition, no new infra.** A `lib/cockpit/` selector
  (`deriveNextActions(syncData, now) → Action[]`) composes shipped selectors
  (`computeMilestones`, stage selectors, A4 contacts) into "the 1–3 things to do this week
  and why." No tables, no flags. UI is a client component reading the selector. Highest
  effort-to-value in the sprint.

### H2 — Fact/date freshness sweep
- **Approach: tooling/test, not a feature.** A unit test / lint check asserting that dated
  legal/market facts in typed content carry `source` + `asOf`, plus a recurring checklist.
  No runtime code, no storage.

### Build sequence (S1)
H2 (independent) ‖ R3 (pure, no deps) → R1 last (introduces the scheduler). R1 is the
foundation the financing spine (S5) and email path (S2) compose onto.

---

## S2 — Monetization on

### #41 / #58 — Paywall / unlock + paid export
- **Approach: NEW payments seam mirroring RentCast, default-off.** Create `lib/payments/`
  with a `PaymentsProvider` contract (`createCheckout(tier) → {url}`, `verifyUnlock(deal) →
  Entitlement`), a `NullPaymentsProvider` default (returns "unavailable", everything stays
  free/locked-open as today), and a `StripePaymentsProvider`. Server-only
  `getPaymentsProvider()` gates on `!isPaymentsDisabled() && PAYMENTS_PROVIDER === "stripe"
  && STRIPE_SECRET_KEY`. **The paywall build lands behind the gate before the live key
  exists** — exactly the RentCast/Gemini pattern.
- **Entitlement model:** an `entitlements` table (deal_id or user_id, tier, unlocked_at,
  stripe_ref), RLS-scoped. The paywall is a server-checked entitlement gate on the
  highest-value artifact (operative offer/export + binder + handoffs), NOT a client boolean
  — never trust the client for a paid gate. Tier boundary (DIY vs. Guided) is data, so the
  founders' pricing decision (#63) is a config change, not a rebuild.
- **Webhooks:** a `/api/webhooks/stripe` route verifies the Stripe signature
  (`STRIPE_WEBHOOK_SECRET`) and writes the entitlement — the source of truth for unlock,
  independent of the redirect.
- **Deps/flags:** Stripe. Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, plus `PAYMENTS_PROVIDER` (default off) and a
  `PAYMENTS_DISABLED` kill switch. Default-off ⇒ no paywall, app free as today.
- **Risk:** **RESPA** — a flat one-time unlock is clean; the gate must never become a
  referral-for-fee or a % of price (recreates the commission conflict). **UDAP** — the
  realized-savings event and savings copy stay conditional and do not launch ahead of legal
  sign-off (J2). Entitlement spoofing — server-verified only.

### #63 — Pricing decision (founders) / WTP test
- **Approach: config + instrumentation, no architecture.** Tier definitions are typed data;
  fire a `funnel→unlock` analytics event and a `realized-savings` event at the unlock so WTP
  is measurable across price points. No new module.

### #42 — Email fast-follow (R1 email path + receipts)
- **Approach: extend R1's scheduler with an email channel + a new email seam.** Add a
  `lib/email/` provider seam (`EmailProvider.send()`, `NullEmailProvider` default) with a
  **Resend** implementation. The same Vercel Cron route from R1 becomes the reminder-email
  sender; receipts send on the Stripe webhook.
- **Deps/flags:** Resend. Env: `RESEND_API_KEY`, `EMAIL_PROVIDER` (default off),
  `EMAIL_DISABLED` kill switch. Default-off ⇒ in-app/push only (S1 unchanged).

### Build sequence (S2)
Payments seam + entitlement table (plumbing, no key) → webhook → paywall gate on the
artifact. Email seam composes onto the S1 scheduler in parallel. Hard gates: Stripe test
key, pricing decision (#63), Resend.

---

## S3 — Document custody (the connective tissue)

### R2 — Document binder
- **Approach: NEW storage module on Supabase Storage + RLS — not a provider seam (no
  vendor choice; Supabase is in-stack).** A per-deal binder: upload/store/organize, with a
  `documents` table (id, deal_id, kind, filename, storage_path, size, content_type,
  uploaded_by, uploaded_at, consent_at) carrying metadata, and the bytes in a **private
  Supabase Storage bucket** (`deal-documents`).
- **Storage RLS is the crux.** Storage objects are RLS'd by reusing the **same membership
  helpers** — a Storage policy that calls `is_deal_member(<deal-id parsed from the object
  path>)`, with object paths namespaced `"<deal_id>/<doc_id>"`. Encryption-at-rest is
  Supabase-native. Uploads/downloads go through **server-issued signed URLs** (short TTL),
  never public URLs — bytes never become world-readable.
- **Consent + delete-on-demand (GLBA):** per-deal consent captured before storing
  (reuse the dated-consent shape from `DealAgency`); a hard delete removes both the row and
  the Storage object. A retention/delete policy is enforced server-side.
- **Attach-points:** A5 disclosure and A4 contacts get a `document_ref` so a stored binder
  document can hang off the existing surfaces; wire-instructions documents carry the
  existing wire-fraud callout.
- **Deps/flags:** Supabase Storage (in stack). Env: bucket name; `DOC_BINDER_ENABLED`
  (default off). Default-off ⇒ no binder UI, no bucket dependency.
- **Risk:** **GLBA custody bar** is the hard gate — legal must sign per-deal-consent +
  field-scoping + retention/delete before default-on. **UPL** — we *store*, never interpret
  legal sufficiency; **no OCR-into-advice**, no protected-class signal derived from stored
  docs (FHA). Signed-URL TTL and path-traversal in the deal-id parse are the security
  edges to test.

### Build sequence (S3)
Bucket + `documents` table + Storage RLS policy → signed-URL upload/download server routes
→ consent gate + delete → attach-points. Unblocks #58 paid-export (S2) and T1 (S8).

---

## S4 — Productionize the AI explainers

### AI1 — Promote #36 offer-strength + #57 budget to a production provider (Claude)
- **Approach: extend the EXISTING AI explainer seam — one new file.** The contract
  (`AiExplainerSource`), grounding (allowlist + OUR factors), and `screenOutput` gate are
  done (`src/lib/ai/explainer/`). Promoting to production is **adding `source-claude.ts`**
  (implements `explainOfferStrength` + `explainBudget` against the Anthropic Messages API)
  and a new `AI_EXPLAINER_SOURCE === "claude"` branch in `getAiExplainerSource()`. Nothing
  downstream changes — the seam was built for exactly this.
- **Model/provider:** Claude per `external-dependencies.md`. Use a small, cheap model for
  this narrow narration task (the model only restates our deterministic factors). The
  connector keeps the existing contract: **never throws, never fabricates, returns `null`
  on any failure/blocked output.**
- **Cost / rate-limit / caching / abuse controls (the real S4 work):** add a server-side
  **response cache keyed by a hash of the grounded input** (same factors ⇒ same narration,
  no repeat spend), a per-user/IP rate limit on the explainer route, and prompt-caching of
  the static system/grounding preamble. These ship BEFORE default-on.
- **Deps/flags:** Anthropic. Env: `ANTHROPIC_API_KEY`, `AI_EXPLAINER_SOURCE=claude`. The
  existing `AI_EXPLAINER_DISABLED` kill switch covers it. **Ship the provider live but
  default-off; flip on ONLY behind public-claims sign-off.**
- **Risk:** **UPL is the whole ballgame** — model narrates our numbers, never invents/
  computes/advises (enforced by allowlist + `screenOutput`). **UDAP** — rising enforcement
  makes conservative, grounded-only claim copy non-optional; **public-claims legal sign-off
  is a hard gate** on default-on. Cost/rate-limit before flip.

### Build sequence (S4)
`source-claude.ts` + seam branch → caching + rate-limit + abuse controls → keep default-off
until sign-off, then flip the env. No dependency on R2.

---

## S5 — Financing spine

### F1 — Financing-milestone tracker
- **Approach: extend the pure deadline engine + compose S1.** Add financing milestones
  (loan application, appraisal ordered, underwriting conditions, clear-to-close-by-financing-
  date) to `lib/deadlines.ts` (or a sibling `lib/financing/` pure module) so they flow
  through `computeMilestones` → R1 reminders → R3 cockpit with zero new infra. Appraisal
  arithmetic already exists (`clear-to-close`).
- **Data/storage:** financing dates/conditions persist per-tool via `useStageTool` and sync
  to the deal — no new tables. No flags (no vendor).
- **Risk:** **SAFE-Act** — process-only ("ask your lender"); never quote a rate-as-offer or
  recommend a lender. Hard dependency on R1 (S1) and R3 (S1).

---

## S6 — Title/closing depth + post-close LTV

### F2 — Title-commitment review + pre-CD closing-cost estimator
- **Approach: clone the shipped A5 checklist pattern + a pure estimator.** Title review is a
  typed-content checklist (what to check / what to ask the title officer) mirroring A5;
  the closing-cost estimator is a pure `lib/closing-costs/` function (fully unit-tested,
  like `lib/savings.ts`). No new infra; binder attach-point (S3) holds the actual title
  commitment.
### F3 — Post-close depth
- **Approach: extend the state engine (typed data).** Homestead/exemption deadlines,
  tax-appeal windows, escrow-analysis literacy, refi-watch as **state-aware typed
  `StateProfile` data** with `source` + `asOf` (H2 cadence) — the proven ADR-008 pattern.
  Refi-watch is content/education, not a live-rate feed (SAFE-Act). No flags.
- **Risk:** **UPL** — surface what to check / what to ask, never "this exception is/isn't a
  problem"; tax/homestead framed neutrally, sourced, dated. **Legal sign-off on the
  title-review boundary** (reuse the cleared A5/A6 copy regime).

---

## S7 — SEO/tools flywheel + AI explainer extension

### SEO1 — Tool-led transactional intent pages on the 50-state engine
- **Approach: extend the shipped 50-state engine + static generation (ADR-001/008).**
  New tool-led `…in <state>` pages (savings calc, offer builder, closing-path) via
  `generateStaticParams`, tuned for AI-Overview resilience. Pure content/routing; no new
  infra, no flags.
### AI2 — Grounded explainers on A2 price-band rationale + disclosure red-flags
- **Approach: pure reuse of the S4 seam.** New grounded explainer inputs (A2 rationale,
  disclosure red-flags) through the same `AiExplainerSource` + `screenOutput`; no new
  provider. **Governed by the public-AI-claims sign-off (S4)** — hard dependency on AI1.
- **Risk:** A2 is the most directive-prone surface — narration says "comps + market
  *suggest a range*; you decide," never "offer $X." **FHA** — SEO/saved-search stays on
  objective attributes, no demographic / "good schools as value" proxies.

---

## S8 — Light up the shared deal workspace

### T1 — Shared activity feed, attribution, presence, conflict handling; agency capture
- **Approach: extend ADR-012 infra + add realtime — the dormant collaboration foundation
  goes live.** Tables/roles/RLS/invites and the `DealAgency` agency-capture type are
  shipped; this sprint activates them. Add:
  - **Activity feed:** a `deal_activity` table (deal_id, actor, kind, payload, at),
    RLS-scoped, append-only — the change-attribution log.
  - **Realtime (phased, per ADR-012):** Phase 1 = **Supabase Postgres Changes → re-fetch**
    (reuses RLS, simplest, correct) for the shared feed / tool state; Phase 2 = **private
    channels + Broadcast/Presence** for live presence. Recommend Phase 1 only in S8;
    presence is a fast-follow. Realtime is **feature-gated on Supabase** like the rest.
  - **Conflict handling:** reuse the shipped `mergeSyncData` for last-writer-merge on shared
    `deal_data`; surface attribution rather than locking.
  - **Agency capture before visibility:** force the `DealAgency` capture
    (`agencyRelationship` + dated, revocable `financialConsent`) BEFORE an invited agent
    sees buyer financials — **field-level scoping enforced in RLS** (financials columns gated
    on consent), not just UI.
- **Deps/flags:** Supabase Realtime (in stack). No new vendor. Gated on Supabase configured.
- **Risk:** **GLBA field-scoping + per-deal consent-before-visibility + dual-agency capture**
  is the hard gate (legal sign-off). **RESPA** review if any shared surface touches
  referral/closing revenue. Consent dated + revocable. Realtime channel authorization must
  reuse RLS — never broadcast a financial field a recipient lacks consent for.
- **Dependency:** sequenced **after R2 (S3)** so there are documents worth sharing.

---

## S9 — In-deal comms + live-data parity

### T3 — In-deal messaging / structured comments
- **Approach: new messaging module routed 100% through the EXISTING screening pipe.** A
  `deal_messages` table (deal_id, author, body, at), RLS-scoped, realtime via the S8 Phase-1
  channel. **Every message passes through `screenText`/`screenOutput`** (`src/lib/ai/
  screening.ts`) on the server before persist/broadcast, and messaging is **off the AI
  allowlist** — it's a comms pipe, not advice (UPL).
- **Risk:** **FHA** — messaging is the riskiest high-volume free-text leak vector (no
  protected-class / steering / "love letter" content reaching the other party); routing 100%
  through the server-side screen is non-negotiable, never client-side. Dependency on T1 (S8).

### P2-6 — Productionize the flagged RentCast market/listings tools to parity
- **Approach: land the EXISTING seams — no new architecture.** Resolve the open `/v1/markets`
  field-name spike (ADR-013) and finish `mapRentCastMarket` / the listings connector behind
  the shipped gates. Flip `LISTINGS_DATA_SOURCE` / `MARKET_DATA_SOURCE` to `rentcast` with
  the key; the `RENTCAST_DISABLED` kill switch caps all three RentCast seams at once.
- **Risk:** data-cost / rate-limits — the kill switch caps it; keep the manual-entry path as
  the permanent thin-coverage fallback (ADR-013). FHA — `MarketStats` carries transactional
  data only.

---

## S10 — Agent console + trust upkeep

### T2 (#62) — Agent multi-client console + seat model
- **Approach: new pipeline view over the EXISTING deals model + a seat entitlement, reusing
  the S2 payments seam.** The agent console is a cross-deal pipeline read filtered by the
  agent's `deal_members` rows (`role='agent'`); a "For agents" entry; a seat = an
  entitlement tier through the S2 payments provider (no new payment infra). **Hard-gated on
  the pricing decision (#63) and built only after S2 monetization proves out.**
- **Data/storage:** reuse `deals`/`deal_members`/`entitlements`; an agent-seat entitlement
  kind. New flag `AGENT_CONSOLE_ENABLED` (default off). The unrepresented buyer stays the
  homepage hero.
- **Risk:** **RESPA** — paid seats must NOT be referral-for-fee; the pro directory stays the
  only referral surface, fee-free. The agent path must not relax buyer UPL/FHA guardrails.
### H1 / H2 — Trust upkeep
- **Approach: content sweep.** Keep `/listings` honesty copy current (Clear Cooperation /
  portal policy) and re-run the H2 source+date sweep. No infra.

---

## Cross-sprint build sequence & dependency map

1. **S1 R1 scheduler** is foundational — F1 (S5) and the S2 email path compose onto it.
2. **S2 payments seam** is reused by S10 agent seats — build the entitlement model once.
3. **S3 binder** unblocks #58 paid-export (S2 artifact) and T1 (S8 sharing) — custody
   before collaboration.
4. **S4 AI provider promotion** is a prerequisite for AI2 (S7); both gated on one
   public-claims sign-off.
5. **S8 realtime Phase-1** is the channel S9 messaging rides on — workspace before comms.
6. Three legal clearances are on the critical path and should be scheduled now:
   public-AI-claims (S4/S7), document-custody GLBA (S3), shared-workspace consent + RESPA
   (S8/S10). Everything gated ships **default-off** so a slipped gate never blocks a sprint.

---

## Proposed ADRs (continuing from ADR-013)

- **ADR-014 — Reminders & server scheduler (Vercel Cron + Web Push, default-off).**
  Pure reminder-derivation lib over `computeMilestones`; Vercel Cron (over pg_cron) given
  server-side accounts/sync; Web Push (VAPID) first, email channel as S2 fast-follow;
  `REMINDERS_DISABLED` kill switch; idempotent firing; UPL-process-only framing. (S1; email
  channel revisited in S2.)
- **ADR-015 — Document custody on Supabase Storage + RLS (GLBA, default-off).**
  Private bucket, deal-namespaced object paths, Storage RLS via the existing membership
  helpers, signed-URL-only access, encryption-at-rest, per-deal consent + retention/
  delete-on-demand, store-not-interpret (UPL/FHA); `DOC_BINDER_ENABLED`. (S3.)
- **ADR-016 — Payments seam (Stripe, flag-gated like RentCast, default-off).**
  `PaymentsProvider` contract with `Null` default + Stripe impl, three-part gate,
  server-verified entitlements table, signed webhook as source of truth, flat one-time
  unlock (RESPA-clean), tier boundary as config; `PAYMENTS_PROVIDER` / `PAYMENTS_DISABLED`.
  Reused for agent seats (S10). (S2.)
- **ADR-017 — Production AI provider promotion to Claude (existing seam, default-off).**
  Add `source-claude.ts` behind `AiExplainerSource`; response/prompt caching keyed on
  grounded-input hash, rate-limit + abuse controls; `ANTHROPIC_API_KEY`,
  `AI_EXPLAINER_SOURCE=claude`, existing `AI_EXPLAINER_DISABLED`; grounded-only, public-
  claims sign-off gates default-on (UPL/UDAP). (S4; extended in S7.)
- **ADR-018 — Shared-workspace realtime (Supabase Postgres Changes → Presence, phased).**
  Phase-1 Postgres-Changes re-fetch (reuses RLS) for activity feed / shared tool state,
  Phase-2 Broadcast/Presence; `deal_activity` append-only log; `mergeSyncData` conflict
  handling; consent-before-visibility with field-level RLS scoping + agency capture (GLBA);
  realtime authorization reuses RLS; RESPA review on shared revenue surfaces. (S8.)
- **ADR-019 — In-deal messaging through the screening pipe (FHA, default-off).**
  `deal_messages` over the S8 realtime channel; 100% server-side `screenText`/
  `screenOutput`, off the AI allowlist; comms-not-advice (UPL); no protected-class/steering/
  love-letter content. (S9.)
- **ADR-020 (optional) — Email provider seam (Resend, default-off).** If not folded into
  ADR-014: `EmailProvider`/`NullEmailProvider` + Resend, `EMAIL_PROVIDER`/`EMAIL_DISABLED`,
  reminder-email channel on the S1 cron + Stripe receipts. (S2.)
