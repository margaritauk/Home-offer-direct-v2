# QA / Test — 10-Sprint Grooming

_Contributor: QA / Test · 10-sprint grooming · 2026-06-16_

Test strategy for the 10-sprint roadmap (`docs/planning/roadmap-10-sprints.md`, S1..S10 is the
source of truth). The CI gate is **typecheck + lint + Vitest + build + Playwright E2E, all green
per PR** — every story below lands with tests in the same PR or it does not merge.

## Repo conventions this strategy reuses (do not reinvent)

- **Gating / provider seam.** Every gated feature ships a Null/default-off impl plus a real impl
  selected by env, exactly like `src/lib/ai/explainer/source.ts` (`isAiExplainerActive`,
  `getAiExplainerSource` → `NullAiExplainer`) and `src/lib/rentcast-flag.ts`
  (`isRentCastDisabled`, kill-switch overrides source+key). Gate tests use `vi.stubEnv` +
  `vi.unstubAllEnvs()` in `beforeEach`/`afterEach`. **Pattern to clone for every new flag:**
  default-off → Null impl returns the inert value (`null`/mock/no-op); source+key → real impl;
  kill switch overrides source+key.
- **FHA screening seam.** `src/lib/ai/screening.ts` — `buildSafeAiInput` (allowlist projection,
  drops free-text/demographic keys), `screenText` (strip-and-flag input), `screenOutput`
  (reject protected-class / love-letter output). Tested in `src/lib/ai/screening.test.ts`. Any
  new free-text surface (messaging S9, market notes) routes through these and gets the same
  matrix: race/color, religion, familial status, disability, national origin, source of income,
  love-letter / "forever home" appeals.
- **Pure math/scheduling first.** Thresholds and arithmetic are pure-lib unit tests
  (`src/lib/savings.test.ts`, `src/lib/offer/deadlines.test.ts`, `src/lib/budget.test.ts`,
  `src/lib/tools/clear-to-close.test.ts`). New math (financing/title/closing-cost, reminder
  date arithmetic) lands as pure functions with exhaustive unit tests, never validated only
  through the UI.
- **Component RTL.** `*.test.tsx` mock `useStageTool` with real React state (see
  `budget-calculator.test.tsx`), assert via `getByTestId` for computed values and `getByRole`
  for controls, and assert default-off behavior (e.g. AI button absent when
  `NEXT_PUBLIC_AI_EXPLAINER` unset).
- **RLS / consent.** `canSeeFinancials(role, consent, isOwner)` in `src/lib/deals/financials.ts`
  is the default-deny model (owner always; viewer never; editor-ish roles only with consent).
  New per-deal visibility decisions clone this and get the same exhaustive role × consent matrix.
- **E2E selector discipline (CI-only).** Playwright runs in CI only. Use roles
  (`getByRole("heading"|"button"|"tab"|"checkbox", { name })`), unique accessible text
  (`getByLabel`, `getByText`), and `.first()` for repeated elements (see `e2e/tracker.spec.ts`).
  **Never** CSS/nth-child/brittle selectors. Assert disabled→enabled transitions and
  accessible explanations, not just presence.

## Cross-cutting compliance test hooks (apply to every sprint)

- **UPL — no directive output.** Process language only ("schedule X by the contingency date",
  "ask the title officer about exception Y"), never "you should" / "we recommend" / "offer $X".
  Unit-assert system-instruction copy forbids directives (see
  `source-gemini.test.ts` `GEMINI_SYSTEM_INSTRUCTION` test) and `screenOutput`/explainer output
  never computes new numbers.
- **FHA — top leak vector is free text.** Every free-text path through `screenText`/`screenOutput`
  with the full protected-class matrix. **Messaging (S9) is the highest-risk surface and gets the
  densest matrix.**
- **GLBA — per-deal RLS isolation, consent-before-visibility, delete-on-demand.** Default-deny
  visibility tests; cross-deal isolation tests (deal A member cannot read deal B); delete actually
  removes the artifact and any derived index.
- **RESPA — agent seats are not referral-for-fee.** Assert the pro directory stays fee-free; paid
  seats grant tooling, not paid placement; no referral-fee field on the seat model.
- **SAFE-Act — no rate-as-offer.** Financing surfaces educate on process; assert no rate quote,
  no lender recommendation, "ask your lender" copy present.

---

## S1 — Reminders + cockpit (no gate)

### R1 — Reminders (in-app / browser-push first; re-fire on date moves)
Acceptance scenarios:
- **Given** a deal with an under-contract + closing date, **When** the user opts in, **Then** a
  reminder is armed for each computed milestone (composes `computeOfferMilestones`).
- **Given** an armed reminder and the contract closing date moves, **When** dates change,
  **Then** affected reminders re-fire / reschedule and stale ones are cancelled (no orphan).
- **Given** opt-out, **When** dates change, **Then** nothing schedules.
- **Edge — timezone:** a milestone at local midnight does not slip a day across DST / UTC
  boundary; a date entered as `YYYY-MM-DD` fires on that calendar day in the user's tz.
- **Edge — date-move past-due:** moving a date to the past does not fire a burst of historical
  reminders; only future-dated reminders schedule.
- **Edge — duplicate suppression:** re-entering the same dates does not double-arm.

Layers / counts:
- Pure unit — reminder-schedule computation (milestone → fire-datetime, tz normalization,
  re-fire diffing, past-due suppression, dedupe): **~18-24 cases**. This is the load-bearing
  scheduling math; mirror `deadlines.test.ts`.
- Component RTL — opt-in toggle renders, armed-count badge, "armed/disarmed" states: **~5**.
- E2E — `/tracker` (or cockpit): set dates → reminder armed indicator visible; change date →
  indicator updates: **~2** (role/text selectors, push notification mocked, not asserted live).

Compliance: UPL — reminder copy is process ("inspection contingency ends"), not directive; no
deadline is "of record." Unit-assert copy strings.

### R3 — Active next-actions dashboard
- **Given** a deal at a stage, **When** the cockpit renders, **Then** it shows the 1-3 highest
  next actions composed from `computeMilestones` + stage selectors + A4 contacts, ordered by
  urgency, with the "why."
- **Edge:** no dates set → empty/prompt state, no crash; all milestones complete → "you're
  caught up" state.
- Layers: pure unit — next-action selection/ranking **~8-10**; RTL — renders top-N, empty/done
  states **~5**; E2E — cockpit shows ≥1 action after dates set **~1**.

### H2 — Fact/date freshness sweep
- Pure unit — every dated legal/market claim carries `source` + `as-of` date; a sweep helper
  flags entries past a staleness threshold: **~4-6**. (UDAP/accuracy protection.)

### Regression risk (S1)
Reminders compose shipped `computeMilestones` and tracker selectors — re-run
`offer/deadlines.test.ts`, `tracker.spec.ts`. Adding scheduling must not change milestone
computation outputs (snapshot the existing milestone ids/dates).

---

## S2 — Monetization on (Stripe + pricing + email)

### #41/#58 — Paywall / unlock + paid export
Acceptance scenarios:
- **Given** `PAYMENTS_ENABLED` unset (default-off), **When** the unlock surface renders,
  **Then** the paywall is inert and the build/tests pass with no Stripe key — **this is the
  mandatory default-off test** (clone the explainer gate test).
- **Given** payments enabled + valid webhook for the deal, **When** payment is verified,
  **Then** and only then is the export/binder artifact unlocked.
- **Edge — payment-verified-before-unlock:** an export request with no verified payment is
  denied (server-side gate, not just hidden UI button).
- **Edge — Stripe webhook:** invalid signature → rejected, no unlock; replayed/duplicate event →
  idempotent, single unlock; out-of-order events → final state correct.
- **Edge — refund:** refund webhook revokes the unlock (or marks deal locked) per policy.
- **Edge — wrong deal:** a webhook for deal A never unlocks deal B (ties to GLBA isolation).

Layers / counts:
- Pure unit — webhook event → entitlement reducer (verify, idempotency, refund, deal-scoping):
  **~12-16**. Mirror `offer-status/reducer.test.ts` style.
- Pure unit — paywall gate (`isPaymentsActive` default-off / source+key / kill switch): **~5**.
- Component RTL — locked vs unlocked artifact, "unlock" CTA, default-off (no CTA): **~6**.
- E2E — paywall visible when enabled (test mode), export disabled until unlock; **keep webhook
  out of E2E** (mock at the seam): **~2**.

Compliance: UPL/RESPA — tiers are tools+education not advice; referrals stay flat/disclosed/
fee-free (assert copy). UDAP — savings copy stays conditional ("up to ~2.5%, if you ask"),
realized-savings event payload does not assert a guaranteed amount.

### #63 — Pricing decision
Not directly testable (founder decision); but the tier→entitlement mapping (DIY vs Guided gates
which artifacts) is pure unit: **~4-6**.

### #42 — Email fast-follow (reminders + receipts)
- **Given** email vendor (Resend) unset, **Then** email path is no-op, in-app/push still works
  (default-off test). **Given** configured, **Then** R1 reminder + receipt enqueue with correct
  template/recipient. Mock the vendor at the seam — **no live send in tests**.
- Layers: pure unit — send-decision + payload build **~6**; no E2E for email delivery.

### Regression risk (S2)
Funnel/analytics events (`analytics/index.test.ts`) — adding the unlock event must not break
existing event schemas. The savings tool (`savings.test.ts`) feeds the realized-savings number;
re-run.

---

## S3 — Document custody (R2 binder)

Acceptance scenarios:
- **Given** `DOC_BINDER_ENABLED` unset, **Then** binder UI/endpoints inert (default-off test).
- **Given** a paid deal, **When** a user uploads a document, **Then** it stores in Supabase
  Storage under the deal's path with consent recorded.
- **Edge — upload limits:** oversize file rejected; disallowed MIME rejected; per-deal count/size
  cap enforced (pure unit on the validator).
- **Edge — RLS isolation:** a member of deal A cannot list/read/download deal B's documents
  (server/RLS test; clone `canSeeFinancials` default-deny matrix for storage access).
- **Edge — consent-before-visibility:** an invited non-owner sees no documents until per-deal
  consent is recorded; viewer role never.
- **Edge — delete-on-demand:** delete removes the object AND any metadata row / derived index;
  a deleted doc is not downloadable and not listed.

Layers / counts:
- Pure unit — upload validator (size/MIME/count limits), storage-path builder (deal-scoped),
  access-decision (role × consent), delete-completeness assertions: **~14-18**.
- Component RTL — uploader, list, delete confirm, default-off absence: **~6**.
- E2E — only if a non-gated demo path exists; otherwise skip (binder is gated + needs storage).
  Keep E2E to the locked/empty state: **~1**.

Compliance: GLBA — per-deal consent + field-scoping + retention/delete (the bar). UPL — store,
never interpret legal sufficiency (no OCR-into-advice; assert no advice output). FHA — no
protected-class signal derived from stored docs. Wire-instructions object renders the wire-fraud
callout (assert copy present).

### Regression risk (S3)
A4 contacts / A5 disclosure attach-points must not change existing tool state shape.

---

## S4 — Productionize the AI explainers (AI1)

Acceptance scenarios:
- **Given** no provider configured, **Then** `NullAiExplainer` returns `null` — **default-off,
  already covered; extend the existing `source.test.ts` matrix to the Anthropic/Claude impl.**
- **Given** Anthropic source + key, **Then** real impl selected; kill switch overrides source+key.
- **Given** the model returns FHA-unsafe text, **Then** `screenOutput` rejects → `null` (grounding
  + screening still hold after provider promotion — clone the existing "blocks FHA-unsafe output"
  test against the new provider).
- **Given** the model invents a number / gives a directive, **Then** output is rejected / does not
  surface (UPL: narrate-our-deterministic-factors only).
- **Edge — cost / rate-limit / 429 degradation:** a 429 / rate-limit / timeout returns `null`
  gracefully (never throws, UI falls back to deterministic insights — mirror the existing
  "provider transport fails → null" test); caching reduces duplicate calls (assert cache hit).
- **Edge — abuse controls:** per-session call cap; oversized/garbage payload → `null`.

Layers / counts:
- Pure unit — Anthropic request body builder (grounded, allowlisted inputs only, system
  instruction forbids advice/numbers — clone `buildGeminiRequestBody` / `GEMINI_SYSTEM_INSTRUCTION`
  tests), response mapper (valid / empty / garbage shapes), gating, 429/timeout→null, screening
  integration, cache: **~20-26**.
- Component RTL — explainer button present only when `NEXT_PUBLIC_AI_EXPLAINER` set; deterministic
  insights always render (default-off): **~4**.
- E2E — none required for the live provider (CI has no key); assert default-off UI.

Compliance: UPL is the whole ballgame — system-instruction copy test (no "should"/"recommend",
no invented numbers, educational label, "not legal/financial advice"). FHA — every input
allowlisted + screened, no free-text reaches the model unscreened (assert via `buildSafeAiInput`).
Ship live but **default-off**; flip only behind public-claims sign-off (the flag stays the gate).

### Regression risk (S4)
The biggest. Promoting the provider must not change the seam contract: `explainOfferStrength` /
`explainBudget` signatures, the Null-default behavior, and the screening pipeline. Re-run all of
`src/lib/ai/explainer/*.test.ts` and `screening.test.ts` against both impls. Keep the Gemini impl
tests green (seam supports multiple providers).

---

## S5 — Financing spine (F1)

Acceptance scenarios:
- **Given** an under-contract deal, **When** financing milestones are tracked (loan process,
  appraisal, underwriting conditions, CTC-by-financing-date), **Then** they compose into R1
  reminders + R3 cockpit.
- **Edge — financing-date math:** CTC-by-financing-date and appraisal arithmetic
  (clone/extend `clear-to-close.test.ts`); date-move re-fires the financing reminder.
- **Edge — missing financing date:** graceful empty state.

Layers / counts:
- Pure unit — financing-milestone computation + date arithmetic + reminder composition:
  **~10-14**.
- Component RTL — financing tracker renders milestones, empty state: **~4**.
- E2E — financing milestone appears in cockpit/tracker after dates set: **~1**.

Compliance: SAFE-Act — process-only. Assert no rate quote, no lender recommendation; "ask your
lender" copy present. UPL — process language not directive.

### Regression risk (S5)
Composes R1/R3 (S1) and `clear-to-close` — re-run those suites; financing milestones must not
perturb existing milestone ids.

---

## S6 — Title/closing depth + post-close (F2/F3)

Acceptance scenarios:
- **F2 title-commitment review** (A5-pattern clone): renders "what to check / what to ask the
  title officer," never "this exception is/isn't a problem." Clone `disclosure-review.test.ts`
  structure + `e2e/disclosure-review.spec.ts`.
- **F2 closing-cost estimator (pre-CD):** pure math — itemized estimate, totals, clamps on
  bad input (mirror `savings.test.ts` / `budget.test.ts` defensive cases).
- **F3 post-close:** state-aware homestead/exemption deadlines + tax-appeal windows resolve per
  state; escrow-analysis literacy + refi-watch content renders. State resolution clones
  `states.test.ts`.
- **Edge:** unknown state → safe fallback, no crash; every tax/homestead fact carries source +
  as-of date (H2 cadence).

Layers / counts:
- Pure unit — closing-cost estimator math (**~10**), state-aware deadline resolution (**~8**),
  source/as-of presence (**~4**).
- Component RTL — title-review checklist (neutral copy), post-close page: **~6**.
- E2E — title review on an under-contract deal; post-close page loads per state: **~2**.

Compliance: UPL — surface what to check/ask, never adjudicate exceptions (assert copy is
non-directive). Tax/homestead framed neutrally with source + as-of date.

### Regression risk (S6)
A5/A6 checklist pattern + state engine (51 pages) — re-run `states.test.ts`,
`legal/state-forms.test.ts`; reusing the disclosure boundary copy must not change A5.

---

## S7 — SEO/tools flywheel + AI explainer extension (SEO1/AI2)

Acceptance scenarios:
- **SEO1 transactional tool pages** on the 50-state engine (savings calc / offer builder /
  "…in <state>") render per state with correct metadata; AI-Overview-resilient structure.
  Clone `states.spec.ts`.
- **AI2 grounded explainers** on A2 price-band rationale + disclosure red-flags — pure reuse of
  the proven seam (same gating, screening, grounding tests as S4).
- **Edge — A2 most-conservative grounding:** narration says "comps + market *suggest a range*;
  you decide," **never** "offer $X." Unit-assert the A2 system-instruction/output copy and that
  `screenOutput` rejects any "offer $N" directive.
- **Edge:** invalid state slug → 404/safe; FHA — SEO/saved-search on objective attributes only,
  no demographic / "good schools as value" proxies (assert allowlist excludes such fields).

Layers / counts:
- Pure unit — A2 explainer grounding + no-directive screening (**~10**), page-metadata/state
  resolution (**~6**).
- Component RTL — tool pages render expected tool + disclaimer: **~4**.
- E2E — a sample of state tool pages load with correct heading/text (role/text, `.first()`):
  **~3**.

Compliance: A2 narration governed by the public-AI-claims sign-off (default-off until cleared).
FHA on SEO objective-attributes-only.

### Regression risk (S7)
AI2 depends on AI1 (S4) seam — same seam-contract regression suite. 51 state pages — re-run
`states.test.ts` / `states.spec.ts`; adding tool pages must not break existing routes.

---

## S8 — Shared deal workspace (T1)

Acceptance scenarios:
- **Given** a shared deal, **When** members act, **Then** activity feed + change attribution +
  presence reflect actions on shared tool state.
- **Edge — realtime conflict:** two members edit the same tool state concurrently → deterministic
  conflict resolution (last-write-wins or merge per `sync/merge.test.ts`), no lost-update, no
  corrupt state. Clone `sync/merge.test.ts` / `sync/remote-deal.test.ts`.
- **Edge — agency capture before visibility:** an agent cannot see buyer data until the
  agency-relationship capture workflow completes AND per-deal consent is recorded; consent is
  dated + revocable; revoking hides data again. Clone `canSeeFinancials` + `agency-copy.test.ts`.
- **Edge — field-level scoping:** invited agent sees scoped fields, not all financials, without
  consent (default-deny).
- **Edge — invitee activation:** invitee performs ≥1 action → attributed correctly.

Layers / counts:
- Pure unit — conflict/merge resolution (**~10-14**), visibility decision (role × consent ×
  agency-captured) extending `canSeeFinancials` (**~10**), activity-attribution reducer (**~6**).
- Component RTL — feed renders attributed events, presence indicator, consent-gated empty state:
  **~6**.
- E2E — invitee performs an action and it appears in the feed (single-browser proxy; realtime
  hard to E2E — keep thin): **~1-2**.

Compliance: GLBA — field-level scoping + per-deal consent before financials visible to agent
(consent dated + revocable). Force agency-capture (guards accidental dual agency) before agent
sees buyer data. RESPA — review any shared revenue surface (assert none touches referral-for-fee).

### Regression risk (S8)
Deals/roles/RLS/invites (shipped) — re-run `deals/membership.test.ts`, `invites.test.ts`,
`invite-utils.test.ts`, `financials.test.ts`, `sync/*.test.ts`. Sequenced after R2 (S3) docs.

---

## S9 — In-deal comms + live-data parity (T3 / P2-6)

### T3 — Messaging (the top FHA leak vector)
Acceptance scenarios:
- **Given** any message, **When** sent, **Then** it routes 100% through `screenText` (sender)
  and `screenOutput` is applied before it reaches the other party — **messaging is the densest
  screening matrix in the whole roadmap.**
- **Edge — full protected-class matrix** per message: race/color, religion, familial status,
  disability, national origin, source of income, **plus** love-letter / "forever home" /
  steering content blocked or stripped. Clone every case in `screening.test.ts`.
- **Edge — off the AI allowlist:** message content never enters `buildSafeAiInput` / the model
  (assert messaging is not on the AI input path — UPL: it's a comms pipe, not advice).
- **Edge:** empty/whitespace message safe; very long message handled.

Layers / counts:
- Pure unit — message screening (full FHA matrix, dedupe, clean-passthrough): **~16-20**
  (highest single screening density).
- Component RTL — composer blocks/flags screened content, thread renders: **~5**.
- E2E — send a clean message → appears in thread; a flagged message is blocked/sanitized
  (role/text selectors): **~2**.

Compliance: FHA — messaging is the riskiest free-text surface; 100% through the seam, off the
AI allowlist. UPL — comms pipe not advice.

### P2-6 — RentCast market/listings to parity
- **Given** `RENTCAST_DISABLED` (kill switch) or no key, **Then** mock/null source — clone
  `rentcast-flag.test.ts` exactly (kill switch overrides source+key; truthy/non-truthy value
  matrix). **Given** enabled + key, **Then** real source within margin guardrails.
- **Edge — margin guardrail:** a data-cost breach trips the kill-switch path / caps usage.
- Layers: pure unit — gating + margin guard (**~8**), source mapping (**~6**); E2E — listings
  page works with mock source (default): **~1**.

### Regression risk (S9)
The RentCast flag + market/listings seams (`rentcast-flag.test.ts`, `listings/provider.test.ts`,
`market/source*.test.ts`, `comps-source*.test.ts`) — re-run all; productionizing must not change
the mock/default behavior CI relies on (CI has no RentCast key). Messaging must not perturb the
AI screening allowlist.

---

## S10 — Agent console wedge + trust upkeep (T2 / H1 / H2)

Acceptance scenarios:
- **Given** pricing gate / monetization not proven, **Then** agent console default-off (flag).
- **T2 seat model (#62):** seats grant tooling/pipeline, not paid placement; pro directory stays
  fee-free; no referral-fee field on a seat. Assert RESPA-clean.
- **T2 console:** multi-client pipeline lists an agent's deals; agent sees only deals they're a
  member of (RLS isolation — clone `canSeeFinancials` / membership matrix).
- **H1 listings honesty refresh:** `/listings` honesty copy current (Clear Cooperation / portal
  policy) — assert copy strings; no real-feed claim.
- **H2 recurring sweep:** dated facts carry source + as-of; staleness flag fires.

Layers / counts:
- Pure unit — seat/entitlement model (RESPA-clean, no referral fee) **~6**, agent-deal scoping
  (RLS) **~8**, honesty-copy + freshness assertions **~5**.
- Component RTL — console pipeline renders agent's deals, default-off absence: **~5**.
- E2E — "For agents" entry renders when enabled; honesty copy on `/listings`: **~2**.

Compliance: RESPA — paid seats must not be referral-for-fee; pro directory stays the only
referral surface, fee-free. UPL/FHA — agent path must not relax buyer guardrails (re-run buyer
screening/UPL suites). The unrepresented buyer stays the homepage hero.

### Regression risk (S10)
T1 (S8) workspace + all RLS/membership/consent suites; the buyer-side UPL/FHA guardrails must
remain green unchanged (agent path is additive, not a relaxation).

---

## Standing reminders for every PR in this roadmap

1. **Pure unit first** for all math/scheduling/threshold logic (reminders, financing/title/
   closing-cost, webhook entitlement, conflict-merge, margin guard). Never validate math only
   through UI/E2E.
2. **Gated features must be testable in their default-off state** — every new flag ships the
   Null/default-off impl with a test proving the build + CI pass with no key
   (`PAYMENTS_ENABLED`, `DOC_BINDER_ENABLED`, AI provider, `NEXT_PUBLIC_AI_EXPLAINER`,
   `RENTCAST_DISABLED`). CI has no Stripe/Anthropic/Resend/RentCast keys — the default path must
   be fully green without them.
3. **Compliance is a test, not a comment** — UPL (no directive output / no invented numbers),
   FHA (free text through `screenText`/`screenOutput`, allowlist excludes free-text/demographic),
   GLBA (default-deny RLS + consent-before-visibility + delete-completeness), RESPA (fee-free
   directory, no referral-for-fee seat), SAFE-Act (no rate-as-offer / lender rec) each have an
   asserting test in the PR that ships the feature.
4. **E2E selector discipline (Playwright CI-only):** roles / unique accessible text / `.first()`;
   assert disabled→enabled transitions + accessible explanations; mock external vendors at the
   seam (no live Stripe webhook, email send, or model call in E2E).
5. **Regression watch — shipped surfaces:** the AI seam (`src/lib/ai/explainer/*`,
   `screening.ts`), RentCast flags (`rentcast-flag.ts`, `listings/`, `market/`, `comps-source*`),
   the tracker (`offer/deadlines`, `e2e/tracker.spec.ts`), and the offer/budget tools
   (`offer/strength`, `budget`, `savings`) re-run green on every PR that composes or extends them.
