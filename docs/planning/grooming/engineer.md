# Engineer grooming — 10-sprint roadmap

_Contributor: Engineer · 10-sprint grooming · 2026-06-16_

Implementation plans + estimates for `docs/planning/roadmap-10-sprints.md` (S1..S10),
grounded in a targeted review of the existing code. Size key: **S** ≤0.5d · **M** 1–2d ·
**L** >2d · **XL** multi-sprint.

## Conventions this codebase already proves (reuse, don't reinvent)

These are the patterns every story below leans on — confirmed in the tree:

- **Provider seam = one interface + Null default + env-gated real impl.** See
  `src/lib/ai/explainer/source.ts`: `NullAiExplainer` (default, returns `null`) vs the real
  provider, selected only when `AI_EXPLAINER_SOURCE` + key are set AND the kill switch
  (`src/lib/ai/explainer/explainer-flag.ts`) is off. RentCast/comps follow the same shape.
  **Every gated vendor feature ships this way: plumbing-first, default-off, one-file swap.**
- **Anthropic Messages REST is already wired** in `src/lib/ai/comps-ai.ts` (model
  `claude-haiku-4-5-20251001`, `ANTHROPIC_API_KEY`, direct `fetch`, no SDK). The S4 "swap to
  Claude" is a *known* path, not a research task — copy that connector shape into a new
  `source-claude.ts`.
- **Pure-lib-first.** Logic lives in `src/lib/**` pure functions with a co-located
  `*.test.ts` (Vitest); the `.tsx` component is a thin shell. Deadlines (`src/lib/deadlines.ts`),
  savings (`src/lib/savings.ts`), offer (`src/lib/offer/*`), tools (`src/lib/tools/*`) all
  do this. **Keep every estimate/state-machine/screening decision in a pure fn.**
- **FHA screening seam is built** (`src/lib/ai/screening.ts`): `buildSafeAiInput` allowlist
  projection, `screenText` (redact inputs), `screenOutput` (reject outputs). Any new free-text
  or AI surface routes through these — they are the UPL/FHA chokepoint.
- **Per-stage tool persistence** = `useStageTool(toolId, initial)` (localStorage + sync seam
  via `emitLocalChange`). New worksheets reuse it verbatim; they auto-flow into sync later.
- **Cloud sync + deals/RLS** = Supabase, no-op-safe (`getSupabaseClient()` returns null →
  `[]`/`null`, app still runs on localStorage). Deal data mirrors `user_data` shape keyed by
  `deal_id`; RLS via `is_deal_member` / `has_deal_role` SQL helpers; owner writes via
  `SECURITY DEFINER` RPCs. Migrations are additive, idempotent, numbered (`0008` is latest).
- **Route envelope discipline:** API routes NEVER 500 at the user; gated features return
  `{ available:false }` when off (see `src/app/api/offer/explain/route.ts`). Mirror this.

**Cross-cutting flag note:** every gated item below confirms it ships default-off/
plumbing-first behind an env flag, so the vendor key / legal sign-off clears into working
software rather than blocking the sprint — exactly the roadmap's stated posture.

---

## S1 — Reminders + cockpit (no gate; ship first)

### R1 — reminders (in-app / browser-push first) — **L**
Today there is only a one-shot `.ics` export (`src/components/tracker-ics-export.tsx`,
`src/lib/tools/ics.ts`) — **no scheduler, no push, no notification primitive exists**
(grep confirms). This is net-new infrastructure; it is the heaviest S1 item.

- **Pure core (unit-tested), new `src/lib/reminders/`:**
  - `schedule.ts` — `computeReminders(milestones: Milestone[], opts): Reminder[]` deriving
    fire-times (e.g. T-3d / T-1d / day-of) from `computeMilestones` output. Pure, reuses
    `daysBetween`/`statusFor` from `src/lib/deadlines.ts`. `Reminder = { milestoneId, fireAtISO, channel, dedupeKey }`.
  - `due.ts` — `dueReminders(reminders, lastSeenISO, nowISO): Reminder[]` — pure "what should
    have fired since last check," so the delivery mechanism is dumb. Idempotent via `dedupeKey`.
  - **Re-fire on date change** is just recomputation: when contract/closing dates move, the
    derived `fireAtISO` set changes; `dueReminders` naturally surfaces the new ones. No mutable
    scheduler state to migrate.
- **Delivery (thin, the spike):** opt-in stored on the existing account/deal. Two channels:
  (a) **in-app** — a cockpit banner driven purely by `dueReminders` on load/focus, zero infra,
  ship this first; (b) **browser push** — `Notification`/Push API + a service worker
  (`public/sw.js`) + subscription persisted per-deal. Push needs a server tick to fire when the
  tab is closed.
- **Spikes to resolve first:**
  1. **Scheduler mechanism** — decide the server tick: a Supabase scheduled Edge Function /
     `pg_cron` row that reads `deal_data.tracker` + a `reminder_subscriptions` table and sends
     web-push, vs. purely client-side "fire when the app is open." **Recommend: ship in-app +
     client-on-open first (no server tick, no gate), defer true background push** to a
     follow-up — keeps S1 gate-free as the roadmap demands.
  2. **Web-push key** — VAPID keypair needed for real background push; treat as the same
     flag-gated/default-off pattern (`PUSH_ENABLED`). In-app path needs none.
- **Test seams:** `computeReminders`/`dueReminders`/dedupe = pure unit (the bulk). Banner +
  permission prompt = component test. One Playwright E2E: set dates → reminder banner appears.
- **Sequencing:** foundational. R3, F1 (S5), F2 (S6) all compose its output. Build the pure
  scheduler + in-app first; push can trail within the sprint.
- **Guardrail:** copy is *process* ("schedule your inspection by the contingency date"), never
  directive; every reminder reiterates "your contract governs, not this date."

### R3 — active next-actions cockpit — **M**
Cheap composition of shipped selectors (roadmap's best effort-to-value item).

- **Pure core, new `src/lib/cockpit/next-actions.ts`:** `computeNextActions(input): NextAction[]`
  ranking the 1–3 things due-now and *why*, composing `computeMilestones` + `statusFor`
  (deadlines), stage `progress` map, A4 contacts (`src/lib/contacts/*`), and (later) R1
  `dueReminders`. `NextAction = { id, title, why, dueISO, urgency, href }`. Pure → fully unit-tested.
- **Component:** `src/components/cockpit/next-actions.tsx` rendered on the tracker/home cockpit,
  reading from `useTracker`/sync — pattern-identical to `tracker-app.tsx`. No new data model.
- **Test seams:** ranking/why-string logic = pure unit; render = component test.
- **Sequencing:** depends only on shipped selectors; can land in parallel with R1's pure core.

### H2 — fact/date freshness sweep — **S**
Operational, not a feature. Audit dated legal/market constants for `source` + `as-of` fields;
add a `*.freshness.test.ts` (or extend an existing data test) that fails when a dated fact lacks
a source/date stamp, so rot is caught in CI. Pure data assertion. No runtime change.

**S1 rough total: ~L+M+S ≈ 4–5 dev-days.** R1 is the long pole (scheduler spike); R3 and H2 are
cheap. No vendor/legal gate on the shipped path.

---

## S2 — Monetization on

### #41 paywall / unlock + #58 paid export — **L**
- **Provider seam (reuse the AI-seam shape):** new `src/lib/payments/` with
  `provider.ts` exporting `PaymentsProvider` + a `NullPayments` default and a `StripePayments`
  impl selected only when `PAYMENTS_ENABLED==="true"` AND `STRIPE_SECRET_KEY` present. Mirrors
  `getAiExplainerSource()` exactly → ships default-off, build lands before the live key.
- **Pure core:** `src/lib/payments/entitlement.ts` — `isUnlocked(deal): boolean`,
  `tierFor(deal): "free"|"diy"|"guided"`, `gate(artifact, tier): "allow"|"locked"`. Pure,
  unit-tested. This is the load-bearing logic and stays vendor-agnostic.
- **Routes:** `src/app/api/payments/checkout/route.ts` (create session) +
  `src/app/api/payments/webhook/route.ts` (verify signature → flip entitlement). Persist
  entitlement on a new `deal_entitlements` table (migration `0009`, RLS: member-read,
  service-role write from the webhook).
- **Paywall UI:** wrap the high-value artifacts — operative offer export (`src/lib/tools/budget-export.ts`
  pattern, offer term-sheet, doc binder once S3 lands) — in a `<Locked>`/`<UnlockCta>` gate that
  reads `isUnlocked`. The paywall renders even with `NullPayments` (shows the CTA, disabled
  checkout) so the surface ships now.
- **Spikes:** (1) **Stripe webhook signature verification** — must read the *raw* body in the
  App Router (`await req.text()` + `stripe.webhooks.constructEvent`); Next 15 route config to
  not parse the body. (2) Test-mode price IDs per tier. (3) Entitlement source of truth =
  webhook-written DB row, never the client.
- **Test seams:** `entitlement.ts` + `gate` = pure unit. Webhook handler = unit test against a
  signed fixture event (no live Stripe). Checkout→unlock = one E2E with Stripe test mode (or
  mocked). FHA/UPL untouched (transaction-only).
- **Gate:** **Stripe key + pricing decision #63.** Confirmed shippable default-off behind
  `PAYMENTS_ENABLED`.

### #63 pricing decision + tiered DIY/Guided WTP test — **S (eng) / founder decision**
Eng cost is just config: a `src/lib/payments/tiers.ts` table (`{ id, priceId, includes[] }`) +
the A/B price-point assignment hook feeding the funnel event. The *decision* is the blocker, not
the build. WTP test = render different price copy by bucket; pure bucket-assignment fn is unit-tested.

### Funnel → unlock instrumentation + realized-savings event — **S**
Extend the existing funnel events: fire `unlock_viewed`, `checkout_started`, `unlock_completed`,
and the **realized-savings** event (compose `calculateSavings` from `src/lib/savings.ts` at
unlock). Pure event-payload builders, unit-tested.

### #42 email fast-follow (R1 reminders + receipts) — **M**
- New `src/lib/email/` provider seam (Resend), same Null-default pattern, behind
  `EMAIL_ENABLED` + `RESEND_API_KEY`. Pure `buildReminderEmail`/`buildReceiptEmail` template
  fns (unit-tested); thin `sendEmail` transport. Wire into R1's `dueReminders` (adds an `email`
  channel) and the payment webhook (receipt).
- **Spike:** Resend domain/DNS verification (ops, not code). **Gate:** Resend key, default-off.
- **Sequencing:** depends on R1 (S1) for the reminder payload; receipts depend on #41 webhook.

**S2 rough total: ~L + M + 2×S ≈ 4–5 dev-days.** Gates: Stripe key, Resend key, pricing
decision #63 — all confirmed default-off / plumbing-first.

---

## S3 — Document custody (R2 binder) — **L (heaviest single item)**
Roadmap's "connective tissue"; every later feature attaches here.

- **Storage:** Supabase Storage bucket `deal-docs`, objects keyed `deal/<dealId>/<docId>`.
  **Storage RLS policies** in migration `0009`/`0010` reusing the existing `is_deal_member` /
  `has_deal_role` helpers (member-read, editor-write, owner-delete) — exact analogue of the
  `deal_data` policies in `0005_deal_data.sql`.
- **Metadata table:** `deal_documents (id, deal_id, kind, filename, content_type, size,
  uploaded_by, consented_at, created_at)` + RLS. `kind` enum includes `wire_instructions`
  (carries the existing wire-fraud callout) / `disclosure` (A5 attach-point) / `title_commitment`
  (A4/F2 attach-point) / `other`.
- **Pure core, new `src/lib/documents/`:** `validate.ts` (`validateUpload(file): Result` —
  size/type allowlist, **PDF/image only, no OCR-into-advice**), `binder.ts`
  (`organizeBinder(docs): BinderSection[]` grouping by kind/stage), `retention.ts`
  (`deletableAt`, `isExpired` — drives delete-on-demand + retention policy). All pure, unit-tested.
- **Client lib:** `src/lib/documents/storage.ts` — no-op-safe upload/list/delete wrappers (return
  `[]`/no-op when Supabase unconfigured), mirroring `src/lib/deals/queries.ts`.
- **UI:** `src/components/documents/document-binder.tsx` (upload dropzone, per-kind sections,
  delete + consent checkbox), gated behind `DOC_BINDER_ENABLED`. Attach-points surfaced in the
  disclosure-review (A5) and contacts (A4) tools.
- **Spikes:** (1) **Supabase Storage signed-URL upload + RLS** — verify member-scoped
  read/write actually enforced (test with a non-member token). (2) **Encryption-at-rest +
  delete-on-demand** — confirm bucket encryption + that delete removes the object *and* the row.
  (3) Consent capture timestamp model (dated, per the deals `consent_captured_at` precedent).
- **Test seams:** validate/organize/retention = pure unit (the bulk). RLS = a migration/policy
  integration test (non-member denied). Upload→list→delete = one E2E behind the flag.
- **Gate:** **GLBA custody bar + legal sign-off on retention/consent** (roadmap). Ships behind
  `DOC_BINDER_ENABLED` default-off. **Guardrail:** store, never interpret legal sufficiency
  (UPL); no protected-class signal derived from docs (FHA).
- **Sequencing:** **blocks S8 (T1 has nothing to share without it)** and the paid-export depth
  in S2/#58. Build after S2 so paid deals are the ones storing docs.

**S3 rough total: ~L ≈ 3–4 dev-days** (storage RLS + consent are the cost drivers).

---

## S4 — Productionize the AI explainers (AI1) — **M**
The hard part (grounding, screening seam, two impls, route envelope) is **done**. This is a
provider swap + cost/abuse controls + a flag flip — not a rebuild.

- **New `src/lib/ai/explainer/source-claude.ts`:** `ClaudeAiExplainer implements
  AiExplainerSource`, copying the connector shape from `src/lib/ai/comps-ai.ts` (Anthropic
  Messages REST, `ANTHROPIC_API_KEY`, `claude-haiku-4-5-*`, `x-api-key`/`anthropic-version`
  headers, `fetch`, returns `null` on any failure). Reuse the existing pure
  `buildGeminiRequestBody`/system instructions by generalizing them to provider-neutral
  `buildExplainerMessages` (the system prompts in `source-gemini.ts` are already
  provider-agnostic text). Output still passes `screenOutput`.
- **Seam selection:** add `AI_EXPLAINER_SOURCE==="claude"` to `getAiExplainerSource()` in
  `source.ts` — one new branch, nothing downstream changes (the seam's whole point).
- **Cost / rate-limit / caching / abuse controls (the real new work):**
  - Pure `src/lib/ai/explainer/cache.ts` — `cacheKey(input)` (hash of safe input + factor ids)
    so identical offer states don't re-bill. Unit-tested.
  - Per-deal/IP rate limit + a daily spend cap honored by the route (degrade to
    `{ available:false }` when tripped — the envelope already supports it).
  - Anthropic prompt-caching of the static system instruction (cost lever, see comps pattern).
- **Spikes:** (1) **Claude provider swap** — low risk, the comps connector de-risks it; confirm
  Haiku model id + headers. (2) **Cost ceiling mechanism** — where the daily cap state lives
  (in-memory vs. a counter row). (3) Confirm streaming not needed (short narration → single shot).
- **Test seams:** prompt builder + `mapClaudeResponse` + `cacheKey` + rate-limit decision = pure
  unit. A `*.live.test.ts` (gated, like `source-gemini.live.test.ts`) for the real call.
- **Gate (hard):** **public-AI-claims legal sign-off** + `ANTHROPIC_API_KEY`. Ship the provider
  **live but default-off**; flip `AI_EXPLAINER_SOURCE=claude` only after sign-off. Kill switch
  (`AI_EXPLAINER_DISABLED`) already exists for fast rollback.
- **Guardrail:** model only narrates our deterministic factors; every input allowlisted +
  screened; no free-text reaches it unscreened. Unchanged from the shipped seam.

**S4 rough total: ~M ≈ 1.5–2 dev-days** (provider file is small; cost/abuse controls are the
cost). No R2 dependency.

---

## S5 — Financing spine (F1) — **M**
Composes cleanly on S1's reminders/cockpit; appraisal arithmetic already exists in
`src/lib/tools/clear-to-close.ts` (`CLEAR_TO_CLOSE_STEPS`, low-appraisal calc).

- **Pure core, new `src/lib/financing/milestones.ts`:** `computeFinancingMilestones(input):
  FinancingMilestone[]` — loan-process timeline (application, appraisal ordered/received,
  underwriting conditions, CTC-by-financing-date), extending the `clear-to-close` step model
  with dates anchored off `financingContingencyDays` from `src/lib/deadlines.ts`. Pure,
  unit-tested. Emits `Milestone[]`-compatible items so R1 `computeReminders` + R3
  `computeNextActions` consume them with no new plumbing.
- **State:** persist progress via `useStageTool("financing", …)` (device-local, auto-syncs).
- **UI:** `src/components/tools/financing-tracker.tsx` + route `src/app/tools/financing/page.tsx`,
  cloning the `clear-to-close.tsx` / tracker component pattern.
- **Test seams:** milestone computation + reminder/cockpit integration = pure unit; render =
  component test.
- **Gate:** none (SAFE-Act is a content boundary, not a vendor gate). **Guardrail:** process-only
  — "ask your lender," never quote a rate-as-offer or recommend a lender.
- **Sequencing:** depends on R1 + R3 (S1). Pure composition, low risk.

**S5 rough total: ~M ≈ 1.5 dev-days.**

---

## S6 — Title/closing depth + post-close LTV — **L**

### F2 — title-commitment review + pre-CD closing-cost estimator — **M**
- **Title review** is an A5-pattern clone: new `src/lib/tools/title-review.ts`
  (`buildTitleChecklist(profile, opts): TitleChecklist` — *what to check / what to ask the title
  officer*, never "this exception is/isn't a problem"), state-aware via `getStateProfile`. Pure,
  unit-tested. Component clones `disclosure-review.tsx`; attaches the stored title commitment doc
  from the S3 binder.
- **Closing-cost estimator:** pure `src/lib/tools/closing-cost-estimate.ts`
  (`estimateClosingCosts(input): CostLine[]`) reusing `formatUSD` from `src/lib/savings.ts` and
  the `closing-disclosure` line patterns. Pre-CD, labeled estimate-only.
- **Gate:** legal sign-off on the title-review boundary (reuse cleared A5/A6 boundary copy).

### F3 — post-close depth — **M**
- State-aware facts via the existing 50-state engine: `src/lib/tools/post-close.ts`
  (`postCloseDeadlines(state): PostCloseItem[]` — homestead/exemption deadlines, tax-appeal
  windows) + escrow-analysis literacy + refi-watch. Each fact carries `source` + `as-of` (H2
  cadence; enforced by the H2 freshness test). Pure, unit-tested. New route/page under `/tools`.
- **Guardrail:** tax/homestead framed neutrally with source + as-of date; UPL surface = what to
  check, never a determination.
- **Test seams:** checklist/deadline computation = pure unit; render = component.
- **Sequencing:** F2 depends on S3 (doc attach) + S1 milestone integration; F3 is independent
  evergreen content (cheapest retention/SEO surface).

**S6 rough total: ~2×M ≈ 3–4 dev-days.** Gate: title-review legal boundary (reuses cleared copy).

---

## S7 — SEO/tools flywheel + AI explainer extension — **L**

### SEO1 — tool-led transactional intent pages on the 50-state engine — **M**
- Extend the existing 50-state page engine (51 pages shipped) with tool-led "…in `<state>`"
  routes (savings calc, offer builder, state closing-path) under
  `src/app/tools/.../[state]/page.tsx` using `generateStaticParams` + per-state `generateMetadata`,
  reusing `getStateProfile`. **Tuned for AI-Overview resilience** = interactive tool embeds +
  structured data, not pure prose.
- **Pure core:** page-data/metadata builders per state = pure unit-tested fns; the
  state×tool matrix is generated, not hand-authored.
- **Test seams:** metadata/param generation = pure unit; a route-renders smoke test per template.
- **Cost driver:** breadth (states × tools) + AI-Overview structured-data tuning, not depth.

### AI2 — grounded explainers on A2 price-band rationale + disclosure red-flags — **M**
- **Pure reuse of the proven seam.** Add `explainPriceBand` / `explainDisclosure` methods to
  `AiExplainerSource` + new grounded input types in `src/lib/ai/explainer/types.ts`, grounded in
  `suggestPriceBand` output (`src/lib/offer/suggested-price.ts`, already produces a `PriceBand`)
  and the disclosure checklist. New system-instruction constants + prompt builders (pure,
  unit-tested) following `source-gemini.ts`/`source-claude.ts`. New routes mirror
  `api/offer/explain/route.ts`.
- **Gate:** governed by the **same public-AI-claims sign-off as S4** (AI1). **Guardrail (most
  conservative):** A2 narration says "comps + market *suggest a range*; you decide," never
  "offer $X."
- **Sequencing:** AI2 depends on AI1 (S4) provider + sign-off being live.

**S7 rough total: ~2×M ≈ 3–4 dev-days.** Gate: AI2 under the S4 public-claims sign-off.

---

## S8 — Shared deal workspace (T1) — **L→XL**
Foundation (deals/roles/RLS/invites/agency-consent) is **done** (`src/lib/deals/*`,
`supabase/migrations/0004–0007`). T1 makes invites meaningful: activity feed, attribution,
presence, conflict handling on shared tool state.

- **Pure core, new `src/lib/workspace/`:** `activity.ts` (`buildActivityFeed(events):
  FeedItem[]`, change-attribution formatting), `conflict.ts` (last-writer/merge resolution on
  shared `deal_data` — extends existing `src/lib/sync/merge.ts`). Pure, unit-tested. **This is
  where the real logic lives.**
- **Data:** `deal_activity` table (migration) + RLS (member-read, append-only) reusing
  `is_deal_member`. **Presence** = the spike below.
- **Agency-relationship capture** before an agent sees buyer data already exists
  (`src/components/deals/agency-consent.tsx`, `deal_agency` table, `saveDealAgency`); T1 must
  *enforce* it as a gate on visibility (consent-before-visibility) — wire it into the workspace
  shell, not rebuild it.
- **Spikes:** (1) **Realtime transport** — Supabase Realtime (Postgres changes / presence
  channel) vs. polling for the feed + presence. Decide first; presence is the only piece with no
  existing precedent. Recommend a `WORKSPACE_REALTIME` flag, poll-fallback default. (2) Conflict
  semantics on concurrent edits to one `deal_data` row. (3) Field-level scoping of financials
  (GLBA) — which `deal_data`/financials facets an invited agent may read pre-consent.
- **Test seams:** feed/attribution/conflict = pure unit (bulk). Visibility gating + RLS =
  policy/integration test. Invite→act-on-shared-deal = E2E.
- **Gate:** **GLBA field-scoping + per-deal consent + dual-agency capture; RESPA review** on any
  shared revenue surface. Default-off behind a workspace flag.
- **Sequencing:** **depends on S3 (R2)** — nothing worth sharing without documents. Realtime
  spike makes this **L→XL**; if presence/realtime slips, the feed + consent-gating ship as L and
  presence trails.

**S8 rough total: ~L→XL ≈ 4–6 dev-days** (realtime/presence is the swing factor).

---

## S9 — In-deal comms + live-data parity — **L**

### T3 — in-deal messaging / structured comments — **M→L**
- **Highest-risk free-text surface.** Pure `src/lib/messaging/` — `message.ts`
  (`prepareMessage(raw): {text, blocked}` routing **100% through `screenText`/`screenOutput`**
  from `src/lib/ai/screening.ts`, **off the AI allowlist entirely** — no model ever sees it).
  Unit-tested against FHA/love-letter fixtures (the screening tests already exist to extend).
- **Data:** `deal_messages` table + RLS (member-read/append) reusing `is_deal_member`; realtime
  via the same transport chosen in S8.
- **UI:** thread component on the S8 workspace shell.
- **Test seams:** `prepareMessage`/screening = pure unit (the FHA chokepoint — heavily tested);
  thread render = component; send→appears-for-other-member = E2E.
- **Guardrail:** comms pipe, not advice (UPL); no protected-class/steering/love-letter content
  reaches the other party — enforced by routing every message through the screen.

### P2-6 — productionize RentCast market/listings to parity — **M**
- The RentCast seam is **shipped, flagged** (`src/lib/rentcast-flag.ts`,
  `comps-source-rentcast.ts`, `COMPS_DATA_SOURCE`/`LISTINGS_DATA_SOURCE`). "Parity" = remove the
  sample fallbacks where keyed, harden error/empty handling, and respect margin via the
  `RENTCAST_DISABLED` kill switch (already exists). Mostly hardening + cost monitoring, not new
  surface.
- **Spike:** RentCast data-cost monitoring + the budget at which the kill switch trips.
- **Gate:** none new (FHA screening enforced in-code; kill switch caps cost).

**S9 rough total: ~M→L + M ≈ 3–4 dev-days.** Depends on S8 (a workspace to comment on) + the
realtime transport decision.

---

## S10 — Agent console (T2) + trust upkeep — **L→XL (gated)**

### T2 — agent multi-client console / pipeline / "For agents" + seat model (#62) — **L→XL**
- **Pipeline aggregation** across the deals an agent belongs to: pure
  `src/lib/agent/pipeline.ts` (`buildPipeline(deals, members, agency): PipelineRow[]`) composing
  existing `listMyDeals`/`listMembers`/`getDealAgency`. Pure, unit-tested — this is the safe core.
- **"For agents" entry + console UI** under a new `src/app/agents/` route, gated behind an
  `AGENT_CONSOLE_ENABLED` flag. **Seat model** reuses the S2 payments seam (a distinct
  seat-tier entitlement) — no second billing integration.
- **Spikes:** (1) seat/entitlement model on the S2 payments rails; (2) the agent-vs-buyer
  data-visibility matrix (reuses S8 field-scoping + agency-capture).
- **Gate (hard):** **pricing decision #63 + RESPA review** (paid seats must NOT be
  referral-for-fee; the fee-free pro directory stays the only referral surface). **Build only
  after S2 monetization proves out** (roadmap). Marked XL because it's a new persona + surface;
  ships default-off.

### H1 — listings/MLS honesty refresh — **S**
Content currency on `/listings` as Clear Cooperation / portal policy evolves; no real feed in
scope. Copy + the H2 freshness stamp.

### H2 — recurring fact/date sweep — **S**
The recurring cadence of the S1 H2 mechanism (freshness test already enforces stamps).

**S10 rough total: ~L→XL + 2×S ≈ 4–6 dev-days** (T2 dominates; hard-gated on #63 + RESPA).

---

## Cross-sprint dependency / sequencing summary

- **R1 (S1)** is foundational → R3 (S1), F1 (S5), F2 (S6) all consume its `Milestone`/reminder
  output. Build the **pure scheduler first**; defer true background push if the scheduler spike
  runs long (keeps S1 gate-free).
- **S2 payments seam** is reused by S10 seat model — build it cleanly once.
- **S3 (R2 binder) blocks S8 (T1)** and the S2/#58 paid-export depth, and provides F2's title-doc
  attach-point (S6). Custody-before-collaboration is the critical path.
- **S4 (AI1 Claude provider + public-claims sign-off) blocks S7 (AI2)** — same seam, same gate.
- **S8 realtime-transport decision** is consumed by S9 messaging — make it once, in S8.
- **#63 pricing decision** gates S2 *and* S10; **public-AI-claims sign-off** gates S4 *and* S7;
  **doc-custody legal sign-off** gates S3; **workspace consent/RESPA** gates S8/S10.

## Vendor key / env-flag ledger (all confirmed default-off / plumbing-first)

| Item | Flag / env | Gate | Ships before key? |
|---|---|---|---|
| R1 background push (S1) | `PUSH_ENABLED` + VAPID keys | none (in-app path needs none) | yes — in-app first |
| Paywall/Stripe (S2) | `PAYMENTS_ENABLED` + `STRIPE_SECRET_KEY` | Stripe key + #63 | yes (Null provider) |
| Email (S2) | `EMAIL_ENABLED` + `RESEND_API_KEY` | Resend key | yes (Null provider) |
| Doc binder (S3) | `DOC_BINDER_ENABLED` | GLBA custody legal sign-off | yes (flag off) |
| AI1 Claude (S4) | `AI_EXPLAINER_SOURCE=claude` + `ANTHROPIC_API_KEY` | **public-AI-claims sign-off** | yes — live but default-off, then flip |
| AI2 (S7) | same as AI1 | same public-claims sign-off | yes |
| Workspace/realtime (S8) | `WORKSPACE_REALTIME` (+ deals flag) | GLBA scoping + consent + RESPA | yes (poll fallback / flag off) |
| RentCast parity (S9) | `COMPS_/LISTINGS_DATA_SOURCE`, `RENTCAST_DISABLED` | none new (shipped, flagged) | already gated |
| Agent console (S10) | `AGENT_CONSOLE_ENABLED` | **#63 pricing + RESPA review** | yes (flag off) |
| E-signature (#45) | n/a | NOT on this 10-sprint critical path | flagged only, deferred |

Every gated feature follows the proven `NullX` / kill-switch seam, so each vendor key or legal
sign-off clears into already-merged, test-covered software — never a blocked sprint.
