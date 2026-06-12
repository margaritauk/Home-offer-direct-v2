_Contributor: Architect · Backlog grooming · 2026-06-12_

# Technical direction — buyer's-agent gap items

Lens: extend existing seams and patterns, not invent new infrastructure. Three
patterns carry almost everything here:

- **Provider seam** (ADR-011): `lib/listings/provider.ts` and the comps seam
  `lib/tools/comps-source.ts`. Server-only `getXDataSource()` switch, real
  source gated on `X_DATA_SOURCE === "rentcast"` + `RENTCAST_API_KEY` + the
  `isRentCastDisabled()` kill switch; mock/null fallback otherwise. API route
  wraps it and never 500s (`{ data, source }`, degrade to empty).
- **`useStageTool<T>`** localStorage hook (`hod:tool:<id>:v1`, `emitLocalChange`
  for future deal-sync). Every checklist/worksheet tool rides this; the work is
  a typed shape + a pure compute/normalize function + a thin client UI.
- **Pure, unit-tested lib modules** (`lib/offer/*`, `lib/tools/*`,
  `lib/deadlines.ts`): plain data in, plain data out, no React/IO. This is where
  every item's logic should live; the UI is a shell.

Compliance is a hard constraint on the *data layer*, not just copy: UPL means
the pure functions emit **ranges/facts/trade-offs, never a directive number**
(mirror `explainOfferStrength`/`OFFER_TACTICS`, which deliberately carry no
dollar amounts). Server secrets stay server-only (no `NEXT_PUBLIC_`, never
logged) — the existing connectors are the template.

---

## P0

### A1 — Market-conditions read

**Approach.** New **market-data provider seam**, sibling to comps/listings:
`lib/market/source.ts` with `MarketDataSource.fetchMarketStats(area)` →
`NullMarketDataSource` default + `RentCastMarketDataSource`. RentCast has a
`/v1/markets` (zip-level) endpoint returning sale/rental stats; map it like the
existing connectors (pure `mapRentCastMarket`, server-only key, `[]`/`null` on
any failure, `sample` flag for any illustrative fallback). Gate on a **new**
`MARKET_DATA_SOURCE === "rentcast"` env var (do NOT overload
`COMPS_DATA_SOURCE`) plus the shared `RENTCAST_API_KEY` and the shared
`isRentCastDisabled()` kill switch. Manual-entry path always available so the
tool works with zero data wired (buyer types DOM / list-to-sale / months-supply).

The **interpretation** (stats → "hot seller's market" band) is a **pure
function** `classifyMarket(stats): MarketRead` in `lib/market/classify.ts`,
fully testable, returning a band enum + plain-English narrative + the
trade-off framing — never "offer $X".

**Types** (`lib/market/types.ts`): `MarketStats { areaLabel; daysOnMarket?;
listToSaleRatio?; monthsOfSupply?; medianPrice?; priceTrendPct?; asOf?;
source: "rentcast"|"manual"|"sample" }`; `MarketRead { band:
"strong-buyer"|"balanced"|"strong-seller"|...; headline; factors[];
caveats[] }`.

**Deps/flags.** RentCast `/v1/markets`; `MARKET_DATA_SOURCE`, `RENTCAST_API_KEY`,
`RENTCAST_DISABLED`. Persist last-entered area via `useStageTool` (`market`).

**Risks.** Market-stat coverage/accuracy is thinner than comps; always cite
source + `asOf` date (per compliance §6 accuracy). FHA: present area/market data
neutrally, **no school/demographic fields** in the type. ADR warranted —
**ADR-013: Market-data provider seam** (new env var, new endpoint, the
classify-as-pure-function decision).

### A2 — "What should I offer?" bridge

**Approach.** Pure function only — **no new data source**. `lib/offer/suggested-
price.ts`: `suggestPriceBand({ compsEstimate, marketRead, listPrice }):
PriceBand`. It composes the existing `CompsEstimate` (estimatedLow/mid/high) with
the `MarketRead` band (A1) to produce a **range + rationale string** ("comps
$380–410k; strong-seller market → guidance leans to the upper half"). Output is
a band and reasoning, never a single directive number (UPL). Degrades
gracefully: comps-only when no market read; emits "add comps"/"add market"
prompts when inputs missing.

**Types.** `PriceBand { low; high; emphasis: "lower"|"middle"|"upper"|"none";
rationale: string[]; basis: { hasComps; hasMarket } }`.

**Risks.** Must not look like an appraisal/advice — reuse the comps "estimate,
not appraisal" guardrail copy. **No external deps, no ADR.** Depends on A1 +
existing `compsEstimate`.

### J1 — When-to-go-solo decision aid + post-NAR framing

**Approach.** Pure **typed content** (ADR-003 pattern), not a data feed. A
scored worksheet: `lib/guidance/solo-readiness.ts` with a `SoloFactor[]`
dataset (complex title, unusual financing, hot multiple-offer market,
new-construction, probate/short-sale, comfort reading contracts) and a pure
`assessSoloReadiness(answers): SoloReadiness` returning a lean
("reasonable-solo" / "consider-help" / "strongly-consider-attorney") + which
factors drove it + a pointer to `/pros` (flat-fee attorney). State-aware: pull
`attorneyRequiredAtClosing` from the state engine to surface "your state
requires an attorney anyway." Post-NAR framing is content: a short module
explaining the written buyer-agency agreement + that buyer-side comp is
negotiable, **cited with source + date**.

**Types.** `SoloFactor { id; question; weight; helpLeanNote }`;
`SoloReadiness { lean; drivers: SoloFactor[]; attorneyRequiredByState: boolean }`.
Persist answers via `useStageTool` (`solo-readiness`).

**Risks.** Stays educational (frames trade-offs, routes to a licensed pro — not
"you don't need an agent"). Accuracy: cite the NAR-settlement facts. **No ADR**
(content + pure fn). Pairs with J2.

### J2 — Conditional savings framing

**Approach.** **Copy + small math guardrail**, no new module. The model already
has `captureRatePercent` (`lib/savings.ts`) — the fix is framing: default/label
the headline as **"up to ~X%, if you ask and the deal allows"**, surface the
capture-rate input prominently, and (light addition) cap displayed savings by a
**lender seller-credit ceiling** note tied to financing type. Tighten copy in
the savings UI + landing teaser; keep math pure.

**Risks.** UDAP/over-promising is the whole point — the conditional language is
the deliverable. **No ADR, no new types** (optionally a `creditCapNote` helper).
Independent; do early.

---

## P1

### A3 — Competitive-offer tactics (escalation / appraisal-gap / multiple-offer)

**Approach.** Extend the existing **education-only** `lib/offer/tactics.ts`
(escalation + appraisal-gap cards already exist) with a multiple-offer/bidding-
war playbook card set, PLUS a **non-directive modeler** in
`lib/offer/escalation.ts` / `lib/offer/appraisal-gap.ts`: pure functions that
take **buyer-entered** numbers and show the **cash impact** ("at this cap and
increment, max price = $Y; at this gap, cash needed = $Z") — it computes the
arithmetic of *the buyer's own* inputs, it does not pick the cap. This is the
UPL line: model what they enter, never suggest the figure. Appraisal-gap modeler
is distinct from the post-appraisal `clear-to-close` calc; share no state.

**Types.** `EscalationInputs { base; increment; cap }` → `EscalationModel`;
`AppraisalGapInputs { contractPrice; appraisedValue; coverageCap }` →
`AppraisalGapModel { gap; cashNeeded; remainingExposure }`.

**Risks.** Escalation drafting "is the practice of law" (already stated in the
card) — modeler must visibly route drafting to an attorney. **No ADR.** Benefits
from A1 (market context) but independent.

### A4 — Contacts / who's-who hub

**Approach.** Pure localStorage tool via `useStageTool` (`contacts`). Typed
`DealContact[]` (role enum, name, phone, email, notes). Render card on
`/dashboard` + tracker. Attach the existing wire-fraud callout component to the
`escrow`/`title` role. No compute, no external deps.

**Types.** `lib/contacts/types.ts`: `DealContact { id; role:
"loan-officer"|"escrow-title"|"closing-attorney"|"inspector"|"listing-agent"|
"insurance"|"other"; name; phone?; email?; note? }`.

**Risks.** None notable (pure organization). Forward-compatible with ADR-012
deal model via `emitLocalChange`. **No ADR.**

### A5 — Seller-disclosure review worksheet

**Approach.** `useStageTool` checklist seeded by **state engine**: pure
`buildDisclosureChecklist(stateProfile): DisclosureChecklist` keying off
`disclosureRegime` + `disclosureFormName` to choose prompt sets (red-flag
categories: water/roof/foundation, prior repairs, deaths-where-required, HOA,
environmental). Buyer checks/notes; "have your attorney/inspector confirm" copy
fixed. Facts/questions only.

**Types.** `lib/disclosures/types.ts`: `DisclosurePrompt { id; category; prompt;
askYourPro }`; persisted `DisclosureReview { byPrompt: Record<id,{flag;note}> }`.

**Risks.** UPL — prompts surface what to *ask*, never interpret legal effect.
Reuses ADR-008 state data. **No ADR.**

### A8 — Deadline reminders / `.ics` export

**Approach.** **Pure `.ics` generator** `lib/calendar/ics.ts`:
`buildICS(events): string` (RFC-5545 VCALENDAR/VEVENT, all-day VALUE=DATE,
escaping, stable UIDs) and a per-event variant. Feed it directly from
`computeMilestones()` (`lib/deadlines.ts`) — map each `Milestone` →
`{ uid, date, summary, description }`. Trigger a client-side Blob download
(`text/calendar`); no server, no account. Add `VALARM` for a day-before alert.

**Types.** `CalendarEvent { uid; date; summary; description?; alarmDaysBefore? }`.

**Risks.** Calendar-client quirks (line folding, CRLF, DTSTART for all-day) —
exactly the regression-prone pure logic that earns unit tests. **No ADR**
(implements ADR-010's tracker). High value / low effort — do early in P1.

### A9 — Listing-alert & access guide

**Approach.** Static typed content (ADR-003) + reuse `isRentCastListingsActive()`
to honestly state coverage. Mostly a guide page; no data layer. Pairs with J3.
**No ADR.**

### I1 — Showing access + scripts + dual-agency caution

**Approach.** Typed content scripts + reuse **state engine `dualAgency`**
(`DualAgencyStatus`) for the state-aware caution. In-person tour checklist via
`useStageTool` that **feeds the existing Tour Scorecard** (`lib/tools/tour-
scorecard.ts`) — extend that tool's shape rather than a parallel one. **No ADR.**

### I2 — Negotiation playbook depth

**Approach.** Typed playbook content + pure helpers that read **existing**
counter-offer + inspection state (the Counter-offer Tracker already stores a
private walk-away max; surface "walk-away discipline" against it). Pure
`summarizeRepairLeverage(inspection)` from the inspection summary. Education
only. **No ADR.**

---

## P2

### A6 — HOA/condo review checklist

`useStageTool` checklist (`hoa-review`), same shape family as A5. Static prompt
set (budget/reserves, special assessments, CC&Rs, litigation, rental caps,
insurance). Pure, no deps. **No ADR.**

### A7 — Needs-assessment / criteria worksheet

`useStageTool` (`criteria`): `must/nice/dealbreaker` typed lists. Output **seeds
the Tour Scorecard rubric** (shared type with `tour-scorecard.ts`) — design the
criteria shape to be consumable there. Pure. **No ADR.**

### I3 — Pre-offer due-diligence checklist

`useStageTool` fields (last sold, price changes, DOM, seller motivation),
surfaced on listing detail + offer builder. When RentCast listings are active,
**prefill DOM/price** from the `Listing` shape (already has `daysOnMarket`).
Pure. **No ADR.**

### I4 — Guided comp adjustments

Pure `lib/tools/comps-adjust-prompts.ts`: suggested adjustment **prompts**
(condition, sqft, garage, lot, recency) layered on the existing `Comp.adjustment`
field — prompts + methodology copy, the buyer still enters the dollar figure (no
auto-adjustment = no fabricated valuation). Extends `comps.ts`. **No ADR.**

### J3 — Listings-stub labeling

Copy/label change on `/listings`, driven by `source === "mock"` from the search
route. Route serious search to portals (ties A9). **No ADR.**

### J4 — Surface market data buyer-side

UI placement of the A1 `MarketRead` front-and-center (its own band/page), not
buried in comps. No new logic beyond A1. **No ADR** (consumes ADR-013).

---

## Build sequence & dependencies

```
Wave 1 (P0 foundation):
  J2 (copy)            ── independent, ship first (de-risk over-promising)
  A8 (.ics)            ── independent, pure, high-value safety net
  A1 (market seam)     ── ADR-013; unblocks A2, J4, and A3 context
       └─> A2 (price bridge)   depends on A1 + existing compsEstimate
  J1 (solo aid)        ── independent (uses state engine); pair w/ J2 framing

Wave 2 (P1):
  A4 contacts · A5 disclosures (state engine) · A9 alerts · I1 showings
  (state engine) · I2 negotiation — all independent localStorage/content tools
  A3 tactics+modeler — better after A1 (market context), not blocked by it

Wave 3 (P2):
  A7 criteria ─┐ (shared rubric)
  I1 tour ─────┴─> feeds Tour Scorecard
  A6 HOA · I3 pre-offer (consumes Listing.daysOnMarket) · I4 comp prompts
  J3 labeling (consumes listings source flag) · J4 (consumes A1 MarketRead)
```

**Critical path:** A1 → A2 (and A1 → J4). Everything else parallelizes.

**ADRs warranted:** exactly one — **ADR-013: Market-data provider seam** (A1).
It introduces a new env-gated source + endpoint and the classify-as-pure-
function pattern; J4 and A2 consume it. All other items fit existing ADRs (011
seam reuse, 003 typed content, 004/`useStageTool` localStorage, 010 deadlines).
