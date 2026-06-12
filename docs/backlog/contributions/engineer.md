_Contributor: Engineer · Backlog grooming · 2026-06-12_

# Engineer notes — buyer-agent gap backlog (implementation lens)

Grounding read of the codebase establishes the patterns every item below reuses:

- **Per-stage tools** = a client component (`src/components/tools/*.tsx`) using
  `useStageTool<T>(toolId, initial)` for localStorage persistence (key
  `hod:tool:<id>:v1`, undo + cross-tab sync built in), a route
  `src/app/tools/<slug>/page.tsx` wrapping it in `ToolPageHeader`, a registration
  entry in `STAGE_TOOLS` (`src/lib/journey/navigation.ts`), and a pure lib in
  `src/lib/tools/<x>.ts` holding all math/types (unit-tested). `ToolDisclaimer` /
  `TrustCallout` carry the UPL/FHA guardrail copy. See `inspection-findings.tsx`
  as the canonical example.
- **RentCast seam** = server-only modules behind env flags
  (`LISTINGS_DATA_SOURCE` / `COMPS_DATA_SOURCE` == `"rentcast"` + `RENTCAST_API_KEY`),
  always gated by `isRentCastDisabled()` kill switch, exposing a pure mapper +
  a connector that returns `[]` on any failure and never throws. Routes under
  `src/app/api/*` return 503 when unconfigured. Pure mappers are unit-tested;
  the connector is not.
- **State engine** = `StateProfile` in `src/lib/states/{types,data}.ts` already
  carries `disclosureRegime`, `disclosureFormName`, `disclosureNote`,
  `dualAgency`/`dualAgencyNote`, `closingPath` — A5/A6/I1/J1 read from it, no new
  fetch.
- **Money formatting** = `formatUSD` from `src/lib/savings.ts`. **Dates** =
  `src/lib/deadlines.ts` pure helpers (`computeMilestones`, `addDays`, `formatISO`).

General rule applied to every estimate: keep all logic in a pure
`src/lib/tools/*.ts` (vitest), components are thin (one Testing Library smoke
test for save/render), reserve Playwright for one flow per *new route* only.

---

## P0

### A1 — Market-conditions read
**Files:** new pure lib `src/lib/tools/market.ts` (types `MarketInputs`
{daysOnMarket, listToSaleRatio, monthsOfSupply, priceTrendPct} + `MarketRead`
{temperature: "buyers"|"balanced"|"sellers", score, drivers[], plainEnglish});
new `src/components/tools/market-conditions.tsx` (useStageTool id `"market"`,
manual-entry fields + the read); route `src/app/tools/market/page.tsx`; register
in `STAGE_TOOLS` under `search` and `make-an-offer`. RentCast auto-pull is a
**separate, deferrable sub-task** (see spike) — ship manual-entry first.
**Pure functions:** `classifyMarket(inputs): MarketRead` — deterministic
banding (e.g. DOM<14 & ratio>=100 → sellers). This is the load-bearing testable
unit.
**Size:** **M.** Cost driver is the copy/banding thresholds needing sign-off
(neutral, FHA-safe, sourced) more than code. Manual-entry alone is ~S.
**Spike:** Does RentCast expose a market-stats endpoint? The comps connector
uses `/v1/avm/value` and listings uses `/v1/listings/sale`; neither returns
months-of-supply/list-to-sale. Confirm `/v1/markets` (or derive DOM/ratio from
the listings feed) **before** committing to an auto-pull. If yes, add
`src/lib/market/source-rentcast.ts` + `src/app/api/market/route.ts` mirroring the
comps seam (own env flag, kill-switch, returns null on failure) — that's a
second **M**.
**Test seams:** `classifyMarket` heavily unit-tested (banding boundaries);
component smoke test; one E2E for the new route. Mapper unit-tested if auto-pull
ships.
**Sequencing:** Foundation for A2 and J4. Ship manual-entry A1 first.

### A2 — comps + market → suggested price band
**Files:** new pure lib `src/lib/tools/suggested-price.ts`; surfaced inside the
**existing** comps worksheet (`comps-worksheet.tsx`) and/or offer builder, not a
new route. Reads the comps `CompsEstimate` (`estimatedLow/Mid/High` already
computed in `src/lib/tools/comps.ts`) + the A1 `MarketRead`.
**Pure functions:** `suggestPriceBand(estimate: CompsEstimate, read: MarketRead):
{ low, high, rationale: string }` — returns the comps range tightened/nudged with
a plain-English *reason* string ("comps $380–410k; hot market → toward top").
Must return a **range + rationale, never a single directive number** (UPL).
**Size:** **S–M.** Logic is small and pure; cost is wiring two tools' state
together. The two tools persist under different `useStageTool` ids, so A2 needs
the buyer to have entered both — decide whether to read the other tool's
localStorage (via a shared `read` helper) or have the user re-enter the market
read inline (simpler, recommended).
**Spike:** Cross-tool state read — confirm whether to share via localStorage key
or co-locate. Lean co-locate to avoid coupling.
**Test seams:** `suggestPriceBand` pure unit tests (incl. "no usable comps" →
null path); component test that the band renders with rationale.
**Sequencing:** **Depends on A1** (consumes `MarketRead`). Do A1 → A2.

### J1 — when-to-go-solo decision aid + post-NAR framing
**Files:** mostly **content**. New pure data lib `src/lib/tools/go-solo.ts`
(array of `DecisionFactor` {situation, leanSolo|leanPro, why} covering complex
title, unusual financing, hot multiple-offer, new construction, probate/short
sale) + new `src/components/tools/go-solo.tsx` (an interactive checklist that
tallies factors into a neutral "here's where stakes rise" read — NOT a verdict),
route `src/app/tools/go-solo/page.tsx`, register under `get-ready`. Post-NAR
buyer-agreement facts go in the copy with a cited source/date (consistent with
state-engine sourcing).
**Pure functions:** `summarizeGoSolo(selected: string[]): { elevated: number;
notes: string[] }` — tally only, no recommendation.
**Size:** **M**, almost entirely copy + compliance review (must be balanced, cite
the Aug-2024 NAR facts). Code is trivial.
**Spike:** None technical. Needs Buyer-Agent advisor + legal sign-off on framing.
**Test seams:** tally function unit-tested; component smoke; one E2E.
**Sequencing:** Independent. Pairs naturally with J2 messaging.

### J2 — conditional savings framing
**Files:** copy-only change to `src/components/tools/savings-calculator.tsx`
(and any savings hero/landing copy). The math in `src/lib/savings.ts` already
models this correctly: `captureRatePercent` exists and defaults must read as
"up to ~2.5%, **if you ask and the deal allows**". Tighten labels + add a note
about lender seller-credit caps. No new lib.
**Pure functions:** none new (optionally a `captureCaveat()` string helper for
reuse, trivial).
**Size:** **S.** Pure copy + maybe surfacing a caveat constant.
**Spike:** None.
**Test seams:** snapshot/Testing-Library assertion that the conditional copy and
caveat render; no new unit logic.
**Sequencing:** Independent; quick win, do early alongside J1.

---

## P1

### A3 — escalation / appraisal-gap / multiple-offer
**Files:** education content already exists in `src/lib/offer/tactics.ts`
(`OFFER_TACTICS` has escalation, appraisal-gap, as-is, rent-back). Two pieces to
add: (1) a pure **appraisal-gap modeler** `src/lib/offer/appraisal-gap.ts`
(`modelGap({contractPrice, appraisedValue, coverCap}) → {gap, cashImpact}`) —
distinct from the post-appraisal `src/lib/tools/clear-to-close.ts`; (2) a pure
**escalation illustrator** in `src/lib/offer/escalation.ts`
(`illustrateEscalation({base, increment, cap, competingOffer}) → resultingPrice`)
that *models a what-if*, never drafts the clause. Surface both in `offer-help`
page + offer builder. Multiple-offer = a content card.
**Pure functions:** `modelGap`, `illustrateEscalation` — both fully testable.
**Size:** **M.** Two small pure calcs + UI cards; cost is keeping the UPL line
crisp ("illustration, hand drafting to an attorney", echoing the existing tactics
copy).
**Spike:** None.
**Test seams:** both calcs unit-tested (incl. appraised>=contract → gap 0,
competing<base → no escalation); component test for the cards.
**Sequencing:** Benefits from A1 (market read informs when to use these) but not
blocked by it.

### A4 — contacts / who's-who hub
**Files:** new pure lib `src/lib/tools/contacts.ts` (type `Contact` {role enum,
name, phone, email, notes}; `ROLES` list: loan officer, escrow/title, attorney,
inspector, listing agent, insurance); new `src/components/tools/contacts-hub.tsx`
(useStageTool id `"contacts"`, add/edit/remove rows — same CRUD pattern as
`inspection-findings.tsx`); render on `/dashboard` and the tracker. Attach the
existing wire-fraud `TrustCallout` to the escrow role.
**Pure functions:** minimal — a `roleLabel`/validation helper. Mostly CRUD state.
**Size:** **S–M.** Pure organization, no advice, no external data. The repeating
add/remove/patch pattern is copy-paste from inspection findings.
**Spike:** None.
**Test seams:** component test for add/remove/persist; trivial unit test for any
label/validation helper.
**Sequencing:** Independent.

### A5 — disclosure review worksheet
**Files:** new pure lib `src/lib/tools/disclosure-review.ts`
(`CATEGORIES` = water/roof/foundation, prior repairs, deaths-where-required, HOA,
environmental; each a checklist item with prompts/questions), new
`src/components/tools/disclosure-review.tsx` (useStageTool id `"disclosure"`,
checkbox + "question to ask" notes), route + register under `search` or the
diligence stage. Reads `StateProfile.disclosureRegime` / `disclosureFormName`
(already in `src/lib/states/data.ts`) to tailor the intro — no new data source.
**Pure functions:** `categoriesForState(profile): Category[]` — gate
deaths-where-required etc. by `disclosureRegime`. Facts only, "confirm with
attorney/inspector" guardrail.
**Size:** **M.** Cost is the content per category + the state-tailoring, plus
legal review that it stays facts-not-advice.
**Spike:** Confirm which red-flag categories are statutorily state-specific vs.
universal — Buyer-Agent advisor input.
**Test seams:** `categoriesForState` unit-tested across regimes; component smoke.
**Sequencing:** Independent; shares the state-engine read pattern with A6/I1.

### A8 — .ics deadline export
**Files:** new pure lib `src/lib/tools/ics.ts` (`buildICS(milestones: Milestone[],
opts) → string` producing a valid VCALENDAR with one VEVENT per milestone +
VALARM). Wire a "Add to calendar" / "Export all" button into
`src/components/tracker-app.tsx`, generating a Blob download client-side (no
backend, no account needed). `computeMilestones` already produces the
`Milestone[]` with dates.
**Pure functions:** `buildICS` + `escapeICS` + a per-milestone
`milestoneToVEvent` — all pure strings, highly testable.
**Size:** **S.** Self-contained, no external deps (hand-roll the ICS string;
avoid a library). Main care: correct CRLF line-folding, UID/DTSTAMP, all-day
DATE values, and `BEGIN:VALARM` for the reminder.
**Spike:** Tiny — decide all-day VALUE=DATE events vs timed; all-day is simplest
and matches the calendar-day model in `deadlines.ts`.
**Test seams:** `buildICS` unit-tested against fixed milestones (golden string /
field assertions); a download-click component test.
**Sequencing:** Independent; high value/low cost — do early in P1.

### A9 — listing-alert & access guide
**Files:** content. Either a section on the existing `/listings` page or a small
route `src/app/tools/listing-alerts/page.tsx`. No lib, no data source — static
guidance on portal saved-searches + coming-soon/off-market honesty. Pairs with
J3.
**Pure functions:** none.
**Size:** **S.** Pure content.
**Spike:** None.
**Test seams:** render/content test only; no unit logic.
**Sequencing:** Bundle with J3 (same surface). Independent otherwise.

### I1 — showing access + scripts + dual-agency caution
**Files:** new pure lib `src/lib/tools/showing-scripts.ts` (script/fallback data
+ a pure `dualAgencyCaution(profile): string` reading
`StateProfile.dualAgency`/`dualAgencyNote`), and a short tour checklist that can
seed the existing Tour Scorecard (`src/lib/tools/tour-scorecard.ts`). Surface in
the showings area (`src/components/showings/*`) or a new tools route.
**Pure functions:** `dualAgencyCaution(profile)` — unit-tested across
permitted/banned/restricted.
**Size:** **M.** Mostly scripts content + the state-driven caution; reuse the
state-engine read pattern.
**Spike:** Decide whether the tour checklist *feeds* the Tour Scorecard rubric
(shared type) or is standalone — minor.
**Test seams:** `dualAgencyCaution` unit-tested; component smoke.
**Sequencing:** Shares state-engine read with A5/A6. Independent of others.

### I2 — negotiation playbook depth
**Files:** education content lib `src/lib/tools/negotiation-playbook.ts` (anchoring,
non-price concessions, repair leverage, walk-away discipline) surfaced in the
counter-offer tool (`src/components/tools/counter-offer-tracker.tsx` /
`src/lib/tools/counter-offer.ts`). Tie walk-away copy to the private walk-away
max the counter-offer tracker already stores. Optionally derive repair leverage
from the inspection summary (`summarizeFindings` in `src/lib/tools/inspection.ts`).
**Pure functions:** mostly static data; optional
`repairLeverageNote(summary)` deriving a neutral note from the findings total.
**Size:** **M**, content-heavy; small optional derivation.
**Spike:** None.
**Test seams:** any derivation unit-tested; otherwise content render test.
**Sequencing:** Independent; complements A3.

---

## P2

### A6 — HOA / condo review checklist
**Files:** same shape as A5: pure lib `src/lib/tools/hoa-review.ts` (categories:
budget & reserves, special assessments, CC&Rs/rules, litigation, rental caps,
insurance), component + route, useStageTool id `"hoa"`. No state data needed
(optionally show only for condo/HOA homes).
**Pure functions:** checklist summary tally.
**Size:** **S–M.** Content-driven; structurally a clone of A5.
**Spike:** None.
**Test seams:** tally unit test + component smoke.
**Sequencing:** Do **after** A5 (reuse the checklist component/pattern wholesale).

### A7 — needs-assessment / criteria worksheet
**Files:** pure lib `src/lib/tools/criteria.ts` (must-have / nice-to-have /
deal-breaker buckets), component `criteria-worksheet.tsx`, route, useStageTool id
`"criteria"`, register under `search`. Should seed the Tour Scorecard rubric —
share a type with `src/lib/tools/tour-scorecard.ts`.
**Pure functions:** `toScorecardRubric(criteria)` mapping criteria → rubric rows.
**Size:** **M.** The Tour Scorecard hand-off is the only non-trivial bit.
**Spike:** Confirm the Tour Scorecard rubric shape to map into — read
`tour-scorecard.ts` first.
**Test seams:** `toScorecardRubric` unit-tested; component smoke.
**Sequencing:** Best **before/with** Tour Scorecard usage; otherwise independent.

### I3 — pre-offer due diligence
**Files:** light pure lib `src/lib/tools/pre-offer-diligence.ts` (fields: last
sold, price changes, DOM, seller motivation) + a small fields block surfaced on
the listing detail page and/or offer builder. DOM/price-history are already on
the `Listing` type for RentCast-sourced homes (`daysOnMarket`); seller motivation
is buyer-entered.
**Pure functions:** a completeness/summary helper.
**Size:** **S–M.** Mostly a fields panel; thin logic.
**Spike:** Does RentCast expose price-history? The listings mapper does not map
it today — if needed, that's a mapper extension (small). Otherwise buyer-entered.
**Test seams:** summary helper unit-tested; component smoke.
**Sequencing:** Light dependency on listings data shape; independent of others.

### I4 — guided comp adjustments
**Files:** extend `src/lib/tools/comps.ts` with a pure
`suggestAdjustmentPrompts(subject, comp): Prompt[]` (condition, sqft, garage,
lot, recency) and surface the prompts in `comps-worksheet.tsx`. The adjustment
field + math already exist (`Comp.adjustment`, `adjust()`); this adds *guidance*,
not new math.
**Pure functions:** `suggestAdjustmentPrompts` — testable against
subject/comp deltas (e.g. sqft difference → prompt).
**Size:** **S–M.** Bounded; cost is methodology copy explaining each adjustment.
**Spike:** None.
**Test seams:** prompt generator unit-tested; component test that prompts render.
**Sequencing:** Touches the comps worksheet — coordinate with A2 (same file) to
avoid churn; do them in the same PR window if possible.

### J3 — listings stub labeling
**Files:** copy on `/listings` (`src/app/listings/*` + cards) — label clearly as
a demo/shortlist when on the mock source, route serious search to portals. The
seam already distinguishes real vs sample via `Listing.isSample` and
`isRentCastListingsActive()`; gate the "demo" banner on that so it disappears
when the real feed is live.
**Pure functions:** none new (reuse `isRentCastListingsActive`).
**Size:** **S.** Copy + a conditional banner.
**Spike:** None.
**Test seams:** content/render test; conditional-banner test.
**Sequencing:** Bundle with A9 (same surface).

### J4 — surface market data buyer-side
**Files:** if A1's RentCast market auto-pull lands, surface the `MarketRead`
prominently (dashboard / listing detail), not buried in comps. Reuses A1's
`classifyMarket` + `MarketRead` and the (spiked) market source.
**Pure functions:** none new — reuses A1.
**Size:** **S** (presentation) **on top of A1**, or folds into A1's auto-pull
sub-task.
**Spike:** Same market-endpoint spike as A1.
**Test seams:** component placement test; logic already covered by A1.
**Sequencing:** **Depends on A1** (and A1's auto-pull spike). Last.

---

## Cross-cutting sequencing & flags

- **Critical path:** A1 → A2; A1 → J4. Everything else is parallelizable.
- **RentCast-seam / env-flag work (the only items needing infra, not just a
  component):** A1 market auto-pull, J4, and the optional I3 price-history map.
  Each needs its own env flag, must respect `isRentCastDisabled()`, return
  `[]`/null on failure, and front with a 503-when-unconfigured route. **Resolve
  the market-stats endpoint spike before sizing the A1 auto-pull as committed
  work** — until then A1/J4 ship with manual entry, which carries no infra risk.
- **Content/compliance is the real cost** on A1, A3, A5, I1, I2, J1, J2 — every
  one needs Buyer-Agent advisor + (for J1/J2) legal sign-off on UPL/FHA-safe,
  sourced copy. Code for these is mostly thin pure libs + checklist components.
- **Pure-function discipline:** all banding/tally/modeling/ICS logic lives in
  `src/lib/tools/*` or `src/lib/offer/*` with vitest coverage; components get one
  Testing Library smoke test; only genuinely new *routes* get a Playwright flow.
- **Reuse multipliers:** A5 → A6 (same checklist scaffold); A4 reuses the
  inspection-findings CRUD pattern; A5/A6/I1/J1 all read `StateProfile` the same
  way; A8 builds on existing `computeMilestones`. Sequencing these together
  amortizes the scaffolding.
