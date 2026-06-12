# Product Backlog — Buyer's-Agent Gap

_Owner: Product Owner · Status: v1 · Last updated: 2026-06-12_

This backlog is the **single source of truth** the pod builds and tests off for
the buyer's-agent gap initiative. It synthesizes the 18 advisory items from
[`docs/advisory/buyer-agent-gap-analysis.md`](../advisory/buyer-agent-gap-analysis.md)
(A1–A9, I1–I4, J1–J4) into seven epics with ready-to-build, ready-to-test stories.
Every story carries a user story, priority, estimate, value/KPI, dependencies,
acceptance criteria, a layered test plan, implementation notes, a compliance line,
and the roles consulted — so it is buildable by Engineering and testable by QA
without re-reading the source docs.

It was **groomed by all eight roles** of the scrum pod, whose contributions live
in [`docs/backlog/contributions/`](./contributions/): Buyer's Agent Advisor
(domain DoD), Researcher (sourced facts), Business Analyst (value/WSJF/sequencing),
Marketing Analyst (GTM + copy-as-DoD), Product Designer/UX (IA, flows, a11y),
Architect (seams, types, ADR-013), Engineer (file-level notes, S/M/L), and QA/Test
(per-item test plans). Where the contributions disagreed, the reconciliation
decisions are recorded in [§3](#3-reconciliation-decisions).

---

## 1. Conventions

### Priority
- **P0** — core agent value that's missing; build first. (A1, A2, J1, J2.)
- **P1** — high value, scoped; build next. (A3, A4, A5, A8, A9, I1, I2.)
- **P2** — rounds out the experience; build last. (A6, A7, I3, I4, J3; J4 merged into A1.)

A `P0-framing` tag (J1, J2) marks a P0 that is primarily copy/framing rather than
new tooling.

### Estimate scale (from Engineering)
- **S** ≤ ~3 days — copy, content, or a thin component over existing logic.
- **M** ~1–2 weeks — a typed pure lib + checklist/worksheet component, or a modeler.
- **L** > 2 weeks — net-new infrastructure (none of these items is L on its own;
  the A1 RentCast auto-pull sub-task is a second **M** behind a spike).

### User-story format
> **As an unrepresented buyer, I want … so that …**

Each story is the unit of "ready" and "done." Stories that the BA reconciled
(merged/bundled) are noted in their headers.

### Definition of Ready (DoR)
A story is **Ready** to be pulled into a sprint when:
1. The user story, acceptance criteria, and test plan below are agreed and unambiguous.
2. Its **dependencies** are met or scheduled earlier in the sequence.
3. Any **factual claim** it surfaces has a sourced, dated entry in the Researcher
   brief (or is flagged as a spike/open question in [§6](#6-spikes--open-questions)).
4. Required **legal sign-off** items (J1, J2, A2, A3, A5, A6, A7) are either cleared
   or explicitly scheduled — public-claims surfaces (esp. J2) do not launch ahead of it.
5. The IA placement and reused house patterns are identified (UX brief).

### Definition of Done (DoD)
A story is **Done** when **all** of the following hold:
1. **Acceptance criteria met** — every criterion in the story is satisfied.
2. **Tests per QA** — unit (Vitest), component (RTL), and E2E (Playwright) at the
   layers named in the story's test plan, including the mandatory boundary and
   empty/off-state cases.
3. **Green gate** — typecheck + lint + build + Vitest + Playwright E2E all pass.
4. **UPL/FHA compliance checks pass** — at least one assertion that output carries
   **no directive** (no "offer $X", "waive the inspection", "you must/don't hire");
   contractual surfaces keep "have your attorney review"; every **new free-text
   field reaching AI/templates** is screened (`screenText`/`screenOutput`, kept off
   `AI_INPUT_ALLOWLIST` unless explicitly screened); no protected-class/steering or
   love-letter content; new public copy passes the FHA + UPL gates.
5. **Source + date on any factual claim** — every market stat and post-NAR/legal
   fact renders a cited source and as-of date, matching the state-engine/research
   convention; an assertion verifies the source/date node is present.
6. **Marketing copy shipped where it is part of DoD** (A1, A2, J1, J2, A9, I1, I2,
   J3) — the qualified/neutral wording is the deliverable, not a follow-up.

---

## 2. Epic & story summary

| Epic | Story | Title | Pri | Est | Critical-path / notes |
|------|-------|-------|:--:|:--:|---|
| **E1 Market Intelligence** | **A1** | Market-conditions read (incl. **J4** surfacing) | P0 | M | Foundation; ADR-013 + RentCast spike; ships manual-entry first |
| | **I4** | Guided comp adjustments | P2 | S–M | After A2; same file as comps |
| **E2 Offer Pricing & Strategy** | **A2** | "What should I offer?" price-band bridge (bundles **I3**) | P0 | S–M | Critical path A1→A2; the north-star surface |
| | **A3** | Competitive-offer tactics (escalation / appraisal-gap / multiple-offer) | P1 | M | Better after A1; pull into S2 if capacity |
| **E3 Honest Framing & Trust** | **J2** | Conditional savings framing | P0 (framing) | S | Compliance must-do; ship first |
| | **J1** | When-to-go-solo decision aid + post-NAR framing | P0 (framing) | M | Mostly copy; legal sign-off |
| | **J3** | Listings-stub labeling | P2→pulled up | S | Bundle with A9 |
| **E4 Coordination & Deadlines** | **A8** | `.ics` deadline export / reminders | P1→pulled up | S | Best value/effort; ship early |
| | **A4** | Transaction contacts / who's-who hub | P1 | S–M | Guided-tier coordination |
| **E5 Document Review** | **A5** | Seller-disclosure review worksheet | P1 | M | State-engine driven |
| | **A6** | HOA / condo document review checklist | P2 | S–M | Clone of A5 |
| **E6 Search & Showings** | **A9** | Listing-alert & access guide | P1 (leans P2) | S | Bundle with J3 |
| | **I1** | Showing access reality + scripts + dual-agency caution | P1 | M | State-engine driven; feeds Tour Scorecard |
| | **A7** | Needs-assessment / criteria worksheet | P2 (P1 if activation soft) | S–M | Seeds Tour Scorecard |
| **E7 Negotiation** | **I2** | Negotiation playbook depth | P1 (high) | M | Holds realized savings |

Cross-cutting (not a story column): **north-star/funnel instrumentation** alongside
A2, and **ADR-013 + the RentCast `/v1/markets` field-name spike** before A1 auto-pull.
See [§5](#5-sprint-plan) and [§7](#7-cross-cutting-work).

---

## 3. Reconciliation decisions

The BA's reprioritization calls are **accepted** and recorded here as the
authoritative scope decisions:

1. **Merge J4 into A1.** J4 ("surface market data buyer-side, not buried in comps")
   is a *placement* requirement of A1, not a separate computation. It becomes an
   acceptance criterion of A1 (a summary band on the Offer Builder/dashboard reusing
   A1's single `MarketRead`). No separate ticket. *(BA #4, Architect, UX, Engineer
   all concur — "don't double-implement A1's logic.")*
2. **Bundle I3 with A2.** The pre-offer due-diligence fields (last sold, price
   changes, DOM, seller motivation) are cheap and feed A2's band emphasis (seller
   motivation/DOM nudge where in the range). They ride along in the A2 sprint rather
   than stranded in P2. I3 keeps its ID for traceability but is delivered as part of
   the A2 epic. *(BA #5.)*
3. **Pull A8 forward.** `.ics` export is the best value/effort item in P1 (near-P0
   ROI) and protects the closed-deal outcome the north-star depends on — sequenced in
   Sprint 1. *(BA #2.)*
4. **Pull J3 forward.** Listings labeling is a tiny honesty/compliance fix; it ships
   in the early trust sprint bundled with A9/J1/J2, not deferred to P2. *(BA #3.)*
5. **Watch A3 / I2.** Both are high-value and coupled to realized savings; A3 may be
   pulled into Sprint 2 if capacity allows. They remain P1.
6. **A9 leans P2 in practice** (educational top-of-funnel) but keeps its P1 tag and
   ships bundled with J3.
7. **A7 stays P2** but is a candidate to pull to P1 if activation metrics are soft.

The single market read is computed **once** in A1 (`classifyMarket`) and consumed
by A2, I3, I4, and J4 — a hard architectural rule to avoid divergent classifications.

---

## 4. Stories

> Compliance shorthand used below: 🟡 **UPL** = facts/ranges/trade-offs, never
> directives, keep "have your attorney review"; 🟦 **FHA** = neutral data, source +
> date, no protected-class/steering/love-letter content.

---

### EPIC E1 — Market Intelligence

#### A1 — Market-conditions read · _(absorbs J4)_
**Pri:** P0 · **Est:** M (manual-entry ~S; RentCast auto-pull a second M behind a spike)

> **As an unrepresented buyer, I want** to see whether my target area is a buyer's
> or seller's market — with the underlying numbers and what they mean for my offer —
> **so that** I know how aggressive to be, the way an agent would tell me.

**Value / KPI.** The context that makes every offer decision credible and the
prerequisite for A2; a free **activation hook** and a top-of-funnel SEO surface.
*KPI:* % of offer-builder sessions where the market read was viewed before price
entry; offer-completion lift among viewers vs. non-viewers.

**Dependencies.** ADR-013 + RentCast `/v1/markets` field-name spike *before* the
auto-pull sub-task (manual-entry ships without it). Unblocks **A2**, **J4** (merged),
and **A3** context.

**Acceptance criteria.**
- Buyer can **enter or pull** four signals scoped to an area/segment: **days on
  market, list-to-sale ratio, months-of-supply, price-trend**.
- Output is a plain-English classification (**seller's / balanced / buyer's**) **with
  the underlying numbers shown**, not just a label; a gauge with a **text label** and
  `sr-only` summary (not color-only).
- Thresholds per the Researcher brief: **months-of-supply <~4 = seller's, ~4–6 =
  balanced, >~6 = buyer's** (primary, most-citable signal); DOM and list-to-sale read
  **relative to local norm**, not a hard national cutoff.
- Each metric carries a one-line "what this means for you" framed as a **trade-off**
  ("homes selling above ask → competition is high; negotiating room shrinks"), never
  a directive.
- **Degrades gracefully** on thin data ("insufficient comparable sales — low
  confidence") and on pull failure (inline "enter the numbers yourself", never blocks).
- Every figure is **dated and source-attributed** (RentCast + retrieval date); a
  "snapshot, conditions move" caveat is visible.
- **J4 (merged):** a compact read-only **summary band** surfaces at the top of the
  Offer Builder and on the dashboard, reusing the single stored `MarketRead` — not
  buried in the comps connector.
- Live updates with `aria-live="polite"`; mobile single-column, no horizontal scroll
  at 360px; glossary link on first use of DOM/list-to-sale/months-of-supply.

**Test plan.**
- **Unit** (`lib/tools/market.test.ts`, ~14): `classifyMarket` banding — seller/buyer
  example cases; **one `it` per threshold edge** (list-to-sale = 100.0%, MoS at each
  cutoff, DOM cutoffs, both just-below/just-above); partial inputs classify without
  NaN; all-empty → neutral/"unknown", no crash; negative/NaN clamped.
- **Component** (RTL, ~4): plain-English read per band; empty state; numbers echo inputs.
- **E2E** (1): `/tools/market` renders + disclaimer visible.
- **Compliance:** UPL `it` — copy contains no imperative price directive; FHA — any
  "market notes" free-text routed through `screenText`; source+date node asserted.

**Implementation notes.** New **market-data provider seam** (sibling to comps/
listings): `lib/market/source.ts` (`NullMarketDataSource` default +
`RentCastMarketDataSource`), pure `classifyMarket(inputs): MarketRead` in
`lib/market/classify.ts`, types in `lib/market/types.ts` (`MarketStats`,
`MarketRead` — **no school/demographic fields**). New env var
`MARKET_DATA_SOURCE === "rentcast"` (do **not** overload `COMPS_DATA_SOURCE`) +
shared `RENTCAST_API_KEY` + `isRentCastDisabled()` kill switch; route never 500s,
returns null/empty on failure. Component `market-conditions.tsx` via
`useStageTool("market")`; route `app/tools/market/page.tsx`; register in
`STAGE_TOOLS` under **search** and **make-an-offer**. **Ship manual-entry first**;
auto-pull is a deferrable second M gated on the spike. **ADR-013** governs the seam.
RentCast supplies **DOM, inventory, new-listing counts, list-price trend** directly;
**list-to-sale ratio is not available** and **months-of-supply lacks a sold-rate
denominator** — both are manual-entry fields. `ToolDisclaimer` (quiet) for this
estimate tool.

**Compliance.** 🟦 FHA: transactional market metrics only — no desirability/safety/
school-as-value framing; neutral, sourced, dated. 🟡 UPL: describes conditions and
typical buyer responses, never "offer $X."

**Roles consulted.** Advisor, Researcher, BA, Marketing, UX, Architect, Engineer, QA.

---

#### I4 — Guided comp adjustments
**Pri:** P2 · **Est:** S–M

> **As an unrepresented buyer, I want** prompts that walk me through adjusting comps
> for their differences **so that** I adjust like an agent would and get a sharper
> fair-value range.

**Value / KPI.** Improves comp accuracy → better suggested range (A2) → north-star
quality. A refinement of A2's input, not net-new capability. *KPI:* adjustment-prompt
usage; tighter variance between the user's range and comps.

**Dependencies.** After **A2** (touches the same comps worksheet file — coordinate
the PR window to avoid churn).

**Acceptance criteria.**
- **Suggested adjustment prompts** for the standard categories (condition, GLA/sqft,
  garage/parking, lot, recency, bed/bath) with the **methodology explained inline**
  (adjust the *comp toward the subject*; net the adjustments; weight closer/recent
  comps more).
- A **worked example** showing direction (superior comp → adjust **down**) — guards
  the classic beginner sign-direction error.
- Warns when total adjustment is large ("comp may be weak — pick better comps");
  recency/market adjustment reconciles with A1's price-trend (no double-counting).
- Stays a **DIY estimate, explicitly not an appraisal**; the buyer still enters the
  dollar figure (no auto-adjustment = no fabricated valuation).

**Test plan.**
- **Unit** (`tools/comps.test.ts` extension, ~10): `suggestAdjustmentPrompts` against
  subject/comp deltas (sqft diff → prompt); edges — zero adjustment, negative subject
  vs comp, recency=0, very large delta clamps; **regression:** existing
  `comps`/`comps-rank` math unchanged (numbers locked).
- **Component** (RTL, ~4): prompts walk through adjustments; methodology explainer present.
- **E2E** (1).

**Implementation notes.** Pure `lib/tools/comps-adjust-prompts.ts` (or extend
`comps.ts`) layered on the existing `Comp.adjustment` field; surface prompts in
`comps-worksheet.tsx`. **No ADR.** `ToolDisclaimer`.

**Compliance.** 🟡 UPL: methodology, not a directive valuation; lender's appraisal
governs. 🟦 FHA: "location adjustment" on objective site factors only (busy road,
lot, view), never neighborhood-by-demographics.

**Roles consulted.** Advisor, Researcher, BA, UX, Architect, Engineer, QA.

---

### EPIC E2 — Offer Pricing & Strategy

#### A2 — "What should I offer?" price-band bridge · _(bundles I3)_
**Pri:** P0 (top of P0) · **Est:** S–M

> **As an unrepresented buyer, I want** the comps fair-value range and the market
> read combined into a suggested price band with the reasoning **so that** I can
> decide what to offer — the way an agent bridges value and market for me.

**Value / KPI.** The single biggest north-star lever — it turns "what's it worth?"
into "what should I offer," the act that captures savings; the **paid offer-builder
unlock** the paywall sits on, and the strongest conversion proof. *KPI:* % of built
offers whose price falls inside the suggested band; offer-builder completion rate;
ultimately **estimated savings captured per completed offer**.

**Dependencies.** **A1** (consumes `MarketRead`) + existing `compsEstimate`.
**Critical path: A1 → A2.** Bundles **I3** diligence fields. Instrumentation (north-
star + funnel events) stands up alongside this story.

**Acceptance criteria.**
- The comps fair-value **range carries forward** into the offer flow (Comps Worksheet
  → Offer Builder — today disconnected).
- Output is a **suggested price band with explicit rationale** naming its two inputs
  ("comps support $380–410k; market read = hot → competitive offers cluster near the
  top"); **never a single directive number** and **never auto-filled** into the binding
  price field — the buyer types their own number; the offer-strength indicator updates
  from the chosen number.
- Anchored to **comps, not asking price**; weak/stale comps drop confidence and say so;
  cross-links to A3 + the existing low-appraisal calc so "go high" is never shown
  without its appraisal-gap cash consequence; non-price levers handed off to A3/I2.
- A "Where this comes from" disclosure expands the comps math + market inputs
  (transparent, not a black box).
- **Empty/partial states:** missing comps → "Add comps to see a range"; missing market
  → comps-only with "Add a market read to sharpen this"; neither → single prompt card,
  never an empty/broken panel; malformed legacy data normalized defensively.
- **I3 (bundled):** light pre-offer fields — last sold (price/date), price-change
  history, DOM/CDOM, prior listings, tax assessment, **seller motivation (manual,
  labeled unverified)** — surfaced on listing detail + offer builder; motivation/DOM
  nudge where in the band; **tax assessment ≠ market value** stated; non-disclosure
  states handled gracefully (sale prices not public).

**Test plan.**
- **Unit** (`lib/tools/suggested-price.test.ts`, ~10): `suggestPriceBand` — seller
  market skews top, buyer market skews bottom/mid; edges — inverted comps range
  normalized, single-comp/zero-width band, missing market → pass-through with neutral
  rationale, **missing comps → no band (don't fabricate a number)**; assert shape
  `{low, high, rationale}` with no single "offer $X" value (UPL).
- **Unit** (I3): `pre-offer-diligence` summary — partial fields → graceful partial summary.
- **Component** (RTL, ~5): band + rationale renders from mocked comps + market; empty
  states; **regression:** offer-strength indicator still renders.
- **E2E** (1): comps→offer flow shows the band with rationale text.
- **Compliance:** UPL `it` — rendered text "comps suggest / buyers in hot markets
  often…", excludes imperatives; I3 "why selling" free-text → `screenText`.

**Implementation notes.** Pure `lib/offer/suggested-price.ts`
(`suggestPriceBand({compsEstimate, marketRead, listPrice}): PriceBand`), composing
existing `CompsEstimate` + A1's `MarketRead`; **no new data source, no ADR**. Surface
as a **band/step inside the Offer Builder** (not a new route) + a mirror on the Comps
result. **Recommended:** co-locate the market read inline rather than coupling via
cross-tool localStorage. I3 in `lib/tools/pre-offer-diligence.ts`, prefilling
DOM/price from `Listing.daysOnMarket` when RentCast listings are active. Loud amber
`DisclaimerBanner` on the rationale (offer/contract surface).

**Compliance.** 🟡 UPL (the most directive-prone feature in the product): "comps +
market suggest a range; you decide" — the line is "competitive offers *tend to* land
near X" (market fact), never "you should offer X"; keep "have your attorney review the
contract terms." 🟦 FHA: rationale cites price/market facts only.

**Roles consulted.** Advisor, Researcher, BA, Marketing, UX, Architect, Engineer, QA.

---

#### A3 — Competitive-offer tactics: escalation / appraisal-gap / multiple-offer
**Pri:** P1 (pull into S2 if capacity) · **Est:** M

> **As an unrepresented buyer, I want** to model an escalation clause, an offer-time
> appraisal-gap, and learn multiple-offer levers **so that** I can structure a
> competitive offer in a hot market without an agent.

**Value / KPI.** In hot markets this is what *wins the house* → enables the north-star
(no closed deal, no realized savings); a premium, Guided-tier-signaling capability.
*KPI:* % of hot-market offers using an escalation/gap module; win-rate proxy (offers
reaching mutual acceptance) where instrumentable.

**Dependencies.** Benefits from **A1** (market context) but not blocked by it.

**Acceptance criteria.**
- **Escalation modeler:** inputs (base, increment, cap); shows resulting price under
  sample competing bids = **min(competing + increment, cap)**; explains risks (caps
  reveal your ceiling; requires proof-of-offer; some sellers/states **won't accept**
  or **restrict/disfavor** them — **TX: attorney-drafted/TREC-restricted; NC: NCREC
  discourages**; can trigger an appraisal gap). State-aware caution via the state
  engine where escalation is disfavored, but **kept usable as education**.
- **Appraisal-gap helper (offer-time):** given price + a hypothetical appraised value,
  shows **cash needed to cover the gap**, that lenders lend on the **lower of price or
  appraisal**, and that gap cash is **in addition to** down payment + closing costs and
  generally **not financeable**; clearly **distinct from the post-appraisal
  Clear-to-Close calc** (shares no state). Competitive norms for context: 3–5% to stay
  competitive, 5–10% to win a bidding war (market-dependent, dated).
- **Multiple-offer playbook:** educational checklist of levers beyond price (EM sizing
  typ. 1–3%, contingency/close-date levers, "highest & best", pre-approval > pre-qual),
  each with its **trade-off** (waiving a contingency = giving up an exit; EM at risk on
  default) — explained as a trade-off, **never recommended**.
- Input validation: cap < base or increment ≤ 0 → inline error, don't compute nonsense.

**Test plan.**
- **Unit** (`escalation.test.ts`, ~10): resulting price = min(C+I, Y); edges — competing
  above cap clamps at Y, competing == base → no escalation, increment 0, negative/NaN
  guarded.
- **Unit** (`appraisal-gap.test.ts` offer-time, ~10): cash-to-cover = contract −
  appraised (or chosen coverage); edges — appraised ≥ contract → 0 (not negative),
  partial coverage cap, NaN/negative → 0; **assert it doesn't share state with /
  regress Clear-to-Close numbers**.
- **Unit** (content, ~4): multiple-offer cards have unique ids, non-empty
  name/what/help/**backfires**, escalation routes drafting to an attorney.
- **Component** (RTL, ~5): modeler renders computed price; gap helper shows cash impact
  + zero/negative empty states; "some states disallow" note present.
- **E2E** (1): tactics page renders with UPL disclaimer.

**Implementation notes.** Extend the existing education-only `lib/offer/tactics.ts`
with a multiple-offer card set; add pure `lib/offer/escalation.ts`
(`illustrateEscalation`) and `lib/offer/appraisal-gap.ts` (`modelGap`) — both compute
the arithmetic of the *buyer's own inputs*, never pick the figure. Surface on the
existing `/tools/offer-help` page (`OfferTactics`) + offer builder — **no new route,
no ADR**. Reuse `StateAwareCallout`, low-appraisal math reference from
`clear-to-close.tsx`. Loud `DisclaimerBanner`.

**Compliance.** 🟡 UPL: model the mechanics/math; *drafting* a clause is practice of
law — visibly route drafting to an attorney; never "use an escalation clause" or
"waive your appraisal contingency." 🟦 FHA: no love-letter/personal-appeal tactic in
the multiple-offer playbook (terms only).

**Roles consulted.** Advisor, Researcher, BA, Marketing, UX, Architect, Engineer, QA.

---

### EPIC E3 — Honest Framing & Trust

#### J2 — Conditional savings framing
**Pri:** P0-framing (compliance must-do) · **Est:** S

> **As an unrepresented buyer, I want** the savings story framed honestly as
> conditional **so that** I'm not over-promised a number I can't actually capture.

**Value / KPI.** Protects the north-star's integrity and reduces FHA/UDAP over-promise
risk on the headline claim that appears on every landing page and the hero calculator —
**highest blast radius**. *KPI (negative):* absence of over-promise complaints/
chargebacks; maintained savings-calc completion rate after re-framing.

**Dependencies.** None. **Ship first** (de-risks the marketed number). Public-claims
surface — **do not launch ahead of the deferred external legal sign-off.**

**Acceptance criteria.**
- Savings copy reads as **conditional: "up to ~2.5%, if you ask and the deal allows"**
  — never an assumed/guaranteed figure; the **"up to" + conditionality appear adjacent
  to the dollar figure**, not in a distant footnote; the qualifier travels with the
  number across **landing pages, calculator result, and any paid-ad copy** (not just
  the tool).
- The calculator surfaces the **three preconditions**: (a) seller willing/offering
  buyer-side comp, (b) structured as a price reduction or credit, (c) within **lender
  seller-credit caps** (conventional 3–9% by down-payment, FHA 6%, VA 4%, USDA 6% —
  presented as "varies by loan type / down payment; confirm with your lender", not a
  blanket number; credits can't exceed actual closing costs).
- Price-reduction vs closing-credit vs buyer-paid-out-of-pocket shown as **distinct
  mechanics** with different cash/loan effects.
- The conditional caption is in the same `aria-live` result region (SR users hear the
  caveat with the number); "Estimates only — not advice" present. Edge: capture 0% →
  $0 with "the seller keeps it." Aligns with PRD ("real but NOT automatic").

**Test plan.**
- **Unit** (`savings.test.ts` ext, ~3): math **unchanged** — regression-lock numbers
  ($10k at 100% on $400k; 0% → $0).
- **Component** (`savings-calculator.test.tsx` ext, ~4): label reads the conditional
  copy; best-case sanity-note still appears at 100% capture and clears below; capture-
  rate slider still recomputes + persists.
- **E2E** (1): calculator shows the softened copy (**update any snapshot/string that
  hard-codes "save 2.5%"**).
- **Compliance:** assert no unconditional "you will save".

**Implementation notes.** **Copy-only** change to `savings-calculator.tsx` (and savings
hero/landing copy); the math (`captureRatePercent` in `lib/savings.ts`) already models
this. Optional trivial `captureCaveat()`/`creditCapNote` string helper. **No new lib,
no ADR.** **Flagged regression:** copy change can break existing string assertions in
`savings-calculator.test.tsx` and the e2e — update both in the same PR; don't change calc
outputs.

**Compliance.** 🟡 UPL/UDAP: this *is* the risk-reduction edit — no over-promise; the
*marketing* number and the *tool* number must agree. 🟦 FHA: n/a (negotiation framing
must not imply protected-class appeals).

**Roles consulted.** Advisor, Researcher, BA, Marketing, UX, Architect, Engineer, QA.

---

#### J1 — When-to-go-solo decision aid + post-NAR framing
**Pri:** P0-framing · **Est:** M (almost entirely copy + compliance review)

> **As an unrepresented buyer, I want** an honest, balanced read on when going solo is
> reasonable vs. when to bring in help, plus the post-NAR reality **so that** I can make
> an informed choice and trust this product.

**Value / KPI.** Pure trust + conversion: honestly saying *when to hire help* defuses
the "is this a scam / am I being reckless?" objection and is evergreen SEO. Best ROI in
the backlog (high value, small effort). *KPI:* decision-aid bounce rate; activation
(Journey start) among readers; trust/NPS comment coding.

**Dependencies.** None (reads the state engine). Pairs with J2. **Legal sign-off** on
framing required.

**Acceptance criteria.**
- A **balanced decision aid** — a short, **non-scored reflection checklist** of
  stake-factors (complex/clouded title, unusual financing, hot multiple-offer market,
  **new construction** with builder contracts, **probate/short-sale/REO/auction**,
  inherited/trust-held, major-rehab/as-is, low time/confidence). As factors are checked,
  a **two-sided read** appears ("several higher-stakes factors apply — many buyers in
  your situation bring in a flat-fee or hourly attorney for the contract while still
  self-representing elsewhere"). **A decision aid, not a verdict** — never "you must hire
  a lawyer"; always "many buyers choose to…".
- A **dated, sourced post-NAR explainer**: since **Aug 17, 2024**, a buyer who *uses* an
  MLS-participant agent signs a **written buyer-agency agreement before touring**, and
  buyer-side compensation is **negotiable / not guaranteed seller-paid** (no MLS
  advertising of buyer-agent comp). **Frame clearly that the unrepresented path this
  product champions does NOT trigger the agreement requirement.** Don't overstate scope
  (binds REALTOR®/MLS participants; state add-ons vary). Reality guard: commissions did
  **not** collapse (~2.4–2.67% in 2025) — no "agents are unnecessary" overclaim.
- Names the **menu of help**: full buyer's agent, **flat-fee/hourly buyer agent**,
  **flat-fee/hourly real-estate attorney** (esp. attorney-close states) — so "get help"
  isn't binary; state-aware via the state engine's `attorneyRequiredAtClosing` ("your
  state requires an attorney anyway"). Rebate legality varies by state — branch on the
  state engine. CTA to `/pros` framed as optional, not a funnel-out.
- Source + date node present (accuracy compliance); dynamic read in an `aria-live` region.

**Test plan.**
- **Unit** (`go-solo.test.ts`, ~8): factor → band mapping (reasonable-solo vs
  consider-help); each factor escalates the band; all-clear → "solo reasonable"; stacked
  factors → "consider help" (no hard "must hire"); empty → neutral default.
- **Component** (RTL, ~4): balanced both-sides copy; post-NAR facts block present;
  **citation + date node asserted**.
- **E2E** (1): page renders + balanced framing visible.
- **Compliance:** output is "when it's smart to consider help", **not** "do not use an
  agent"/"you must"; no directive to waive anything.

**Implementation notes.** Mostly **typed content** (ADR-003 pattern) — `lib/guidance/
solo-readiness.ts` (`SoloFactor[]` + pure tally `assessSoloReadiness`/`summarizeGoSolo`
— tally only, no recommendation), component `go-solo.tsx` via
`useStageTool("solo-readiness")`, route `app/tools/go-solo/page.tsx`, registered under
**get-ready**; linked from the homepage audience-routing path and the Savings Calculator.
Reuse a short "When to bring in a pro" callout on elevated-stakes stages. **No ADR.**

**Compliance.** 🟡 UPL: explains roles and trade-offs ("here are situations others find
complex and the kinds of pros who help"), never "you need a lawyer for your situation."
Accuracy: cite the Aug-2024 NAR facts with source + date.

**Roles consulted.** Advisor, Researcher, BA, Marketing, UX, Architect, Engineer, QA.

---

#### J3 — Listings-stub labeling
**Pri:** P2 (pulled up to the early trust sprint) · **Est:** S

> **As an unrepresented buyer, I want** the `/listings` page labeled plainly as a
> demo/shortlist **so that** I'm not misled about its coverage and know to search the
> real portals.

**Value / KPI.** Trust/accuracy — sets honest expectations; compliance-flavored,
near-zero effort. *KPI:* reduced bounce/confusion on `/listings`; fewer "no results"
complaints.

**Dependencies.** Bundle with **A9** (same surface).

**Acceptance criteria.**
- `/listings` clearly **labeled as a shortlist/demo, not a search engine**, with
  coverage limits stated; routes serious search to the portals (cross-link **A9**).
- Must **not imply MLS-completeness** or real-time accuracy; **no portal endorsement/
  affiliate framing** (UDAP/FHA). If demo homes are real addresses, no stale price/status
  misleads.
- The "demo" banner is **gated on the mock source** (`isRentCastListingsActive()` /
  `Listing.isSample`) so it disappears when the real feed goes live.

**Test plan.**
- **Component** (`listings-browser.test.tsx` ext, ~3): page labeled "shortlist/demo, not
  a search engine"; routes to portals (A9 cross-link).
- **E2E** (`e2e/listings.spec.ts` ext, 1): label visible; serious-search CTA present.
- **Flagged regression:** existing `listings-browser`, `listings/price-range`,
  `location-selector`, `api/listings/search/route` tests + `e2e/listings.spec.ts` may
  assert old copy — update copy assertions in the same PR; **keep search/provider logic
  untouched.**

**Implementation notes.** Copy + a conditional banner on `app/listings/*`; reuse the
existing "sample listings" `DisclaimerBanner`. **No ADR.** Marketing owns the label copy.

**Compliance.** 🟦 FHA: portal-neutral. 🟡 UPL: n/a. UDAP: don't imply full-market
coverage.

**Roles consulted.** Advisor, Researcher, BA, Marketing, UX, Architect, Engineer, QA.

---

### EPIC E4 — Coordination & Deadlines

#### A8 — `.ics` deadline export / reminders
**Pri:** P1 (pulled up — near-P0 ROI) · **Est:** S

> **As an unrepresented buyer, I want** to push my contract deadlines into my own
> calendar with alerts **so that** I don't miss a contingency date — the thing an agent
> chases for me.

**Value / KPI.** High-value safety net that compensates for the no-account MVP; missing
a contingency date costs money or the house. Best value/effort in P1. *KPI:* % of tracked
deals exporting ≥1 deadline; reduction in deadline-related support questions.

**Dependencies.** None (builds on existing `computeMilestones`). **Ship early.**

**Acceptance criteria.**
- **`.ics` export** (per-deadline "add to calendar" + "export all") generated
  **client-side** (Blob download, no account/server), derived from the tracker's existing
  deadlines.
- Each event has a **title, date, and short neutral description** ("Inspection
  contingency deadline — verify against your contract; missing this may affect your EM"),
  plus a **`VALARM`** day-before reminder.
- **Format correctness:** valid `VCALENDAR`/`VEVENT`, `VERSION:2.0`, `PRODID`, stable
  `UID` per deadline (re-export doesn't duplicate), CRLF line endings, line-folding >75
  octets, escaping of `, ; \` and newlines.
- **All-day deadlines:** `DTSTART;VALUE=DATE:YYYYMMDD` (no time/TZ) to avoid a date
  slipping a day; **business-day vs calendar-day basis labeled** per deadline type; the
  **CD 3-day rule reuses existing product logic** (don't hand-roll it).
- Buttons are real `<button>`s; disabled when no contract date is set, with an
  **accessible explanation** ("Set your contract date to enable calendar export") — not
  just dimmed; "Exported" confirmation announced (`aria-live`). It's a **convenience
  export, not a legal deadline of record** — the contract governs.

**Test plan.**
- **Unit** (`lib/tools/ics.test.ts`, ~14): envelope + one VEVENT per deadline with
  UID/DTSTAMP/SUMMARY; **all-day `VALUE=DATE` (no `T`/`Z`)**; CRLF, line-folding,
  escaping; each VEVENT date == milestone date (`computeMilestones`); empty milestone
  list → valid-but-empty (or no file), no crash; **stable UID** (no duplicates on
  re-export).
- **Component** (RTL, ~3): per-deadline button generates a blob/href; "export all" present.
- **E2E** (1): export triggers a `text/calendar` download (or data-URI href).
- **Flagged regression (tracker):** `use-tracker`/milestones, `tracker-closing-countdown`,
  and `deadlines.test.ts` numbers unaffected.

**Implementation notes.** Pure `lib/tools/ics.ts` (`buildICS` + `escapeICS` +
`milestoneToVEvent`) — **hand-roll the string, avoid a library**; wire "Add to calendar"
/ "Export all" into `tracker-app.tsx` and the dashboard "next deadline" card. All-day
`VALUE=DATE` matches the calendar-day model in `deadlines.ts`. **No ADR** (implements
ADR-010's tracker).

**Compliance.** 🟡 UPL: event copy is factual ("verify against your contract"), no advice.
🟦 FHA: n/a.

**Roles consulted.** Advisor, Researcher, BA, UX, Architect, Engineer, QA.

---

#### A4 — Transaction contacts / who's-who hub
**Pri:** P1 · **Est:** S–M

> **As an unrepresented buyer, I want** one place to store everyone on my deal **so
> that** I can reach the right party fast — the switchboard an agent normally runs.

**Value / KPI.** Pure organization that reduces mid-transaction drop-off → retention/
outcome; a Guided-tier coordination signal. *KPI:* % of active deals with ≥3 contacts
saved; correlation between contacts-saved and reaching the closing checklist.

**Dependencies.** None.

**Acceptance criteria.**
- Per-deal **Contacts card** on `/dashboard` + `/tracker`, scoped to the active home
  via `HomePicker`: add a contact → pick **role** (loan officer, escrow/title officer,
  closing attorney, inspector, listing agent, insurance, other) → name, phone, email;
  list grouped by role; `tel:`/`mailto:` one-tap on mobile.
- **Wire-fraud reminder pinned to the escrow/title (and closing-attorney) contact** ("we
  will never change wire instructions by email — call a known number to verify"), reusing
  the existing wire-fraud callout.
- **State-aware role prefill** from the state engine (no closing attorney in escrow
  states; title vs attorney closing).
- **Pure organization, no advice, no embedded referrals** (referrals stay in the pro
  directory — RESPA). Don't imply the listing agent represents the buyer — label roles by
  whose side they're on.
- Empty state ("Add the people on your deal…"); invalid email/phone → inline validation;
  hydration guard; persisted via `useStageTool` (rides the future deal-sync seam); tap
  targets ≥44px.

**Test plan.**
- **Unit** (~5): CRUD/validation reducer (add/edit/remove, dedupe by role, email/phone
  format, empty hub).
- **Component** (RTL, ~6): per-role cards; empty state; **wire-fraud reminder renders on
  the escrow/title row specifically**; persists via `useStageTool`.
- **E2E** (1): contacts card on `/dashboard` + tracker.
- **Compliance:** any free-text "notes" → `screenText` (no demographic leak); assert "no
  advice" copy.

**Implementation notes.** `lib/contacts/types.ts` (`DealContact` role enum) + component
`contacts-hub.tsx` via `useStageTool("contacts")` — same CRUD pattern as
`inspection-findings.tsx`; attach the wire-fraud `TrustCallout` to the escrow role.
**No compute, no external deps, no ADR**; forward-compatible with the deal model via
`emitLocalChange`.

**Compliance.** 🟦 FHA: role/contact facts only — screen any notes field. 🟡 UPL: n/a
(organizational). RESPA: not a referral engine.

**Roles consulted.** Advisor, Researcher, BA, Marketing, UX, Architect, Engineer, QA.

---

### EPIC E5 — Document Review

#### A5 — Seller-disclosure review worksheet
**Pri:** P1 · **Est:** M

> **As an unrepresented buyer, I want** a state-aware checklist of disclosure red flags
> with questions to ask **so that** I read the seller's disclosures the way an agent
> would and don't miss a warning sign.

**Value / KPI.** Replaces real agent judgment; trust + outcome (catches red flags), leans
on the existing state engine, defensible/educational. *KPI:* worksheet completion rate;
# of logged "questions for seller/attorney" per deal; handoff click-through to a pro.

**Dependencies.** None (reads the state engine). Shares the state-engine read pattern with
A6/I1/J1. **Legal sign-off** on the disclosure-interpretation boundary.

**Acceptance criteria.**
- A **state-aware checklist** driven by the state engine's `disclosureRegime` /
  `disclosureFormName`, walking the common red-flag categories (**water intrusion/
  drainage, roof, foundation/structural, electrical/plumbing/HVAC, prior repairs &
  claims, environmental — lead/radon/asbestos/mold/flood, pests/termite, boundary/
  easement, HOA, deaths/stigma where required**), each with "what to look for" and a
  **"questions to ask"** capture (free text, screened).
- **Caveat-emptor / minimal-disclosure states** (e.g. AL, AR, VA; some lists add GA, ND,
  WY) → an **empty-but-explained** checklist that warns *silence ≠ no defects, inspect
  harder* — not a crash, never a false "rich form exists" assumption.
- **"As-is"/REO/probate** path handles "little/no disclosure provided." **Death/stigma**
  category gated by state (some require, some prohibit asking) — never volunteer it where
  prohibited. **Federal lead-based-paint disclosure always included for pre-1978 homes.**
- Logs findings/questions and links to the existing Inspection Findings + Repair-Request
  tools; **facts/questions only**, every category ends with "have your attorney/inspector
  confirm"; does **not** interpret legal sufficiency. State-dependent content cites source
  + date.

**Test plan.**
- **Unit** (~8): `categoriesForState` from the regime — edges: caveat-emptor/no-statutory-
  disclosure → empty-but-explained (not a crash); "deaths" category only where the state
  flag requires it (boundary on the flag).
- **Component** (RTL, ~5): categories render; empty state for caveat-emptor; logs
  questions; "have your attorney/inspector confirm" disclaimer present.
- **E2E** (1): worksheet renders per a selected state.
- **Compliance:** "questions to ask" free-text → `screenText` (no protected-class
  phrasing); UPL — facts/questions only, no "this is a defect, rescind."

**Implementation notes.** Pure `lib/tools/disclosure-review.ts`
(`buildDisclosureChecklist(stateProfile)` / `categoriesForState`) keying off the state
engine (ADR-008 data — no new fetch); component `disclosure-review.tsx` via
`useStageTool("disclosure")`; route registered under **search/inspection**; linked from
`/states/[code]`. Reuse `StateAwareCallout`, showings free-text screening (`templates.ts`),
checklist pattern, loud `DisclaimerBanner`. **No ADR.**

**Compliance.** 🟡 UPL: surfaces what to *ask*, never interprets legal effect. 🟦 FHA:
property condition, not the neighborhood's people; screen free text; "deaths-where-
required" presented as a neutral state-law fact.

**Roles consulted.** Advisor, Researcher, BA, Marketing, UX, Architect, Engineer, QA.

---

#### A6 — HOA / condo document review checklist
**Pri:** P2 · **Est:** S–M

> **As an unrepresented buyer, I want** a checklist for the HOA/condo resale packet **so
> that** I don't miss a special assessment, a rental cap, or a financing red flag an agent
> would catch.

**Value / KPI.** Segment-specific trust/outcome (condo/HOA buyers). *KPI:* completion rate
among condo/HOA-flagged deals.

**Dependencies.** Do **after A5** (reuse the checklist component/pattern wholesale).
**Legal sign-off** on the document-review boundary.

**Acceptance criteria.**
- Checklist covering: **operating budget & reserve study/funding %, special assessments
  (pending or recent), CC&Rs/rules, litigation, rental caps / owner-occupancy ratio,
  insurance (master + owner), dues & history**, each with "what to look for" and "why it
  matters" as a **trade-off** ("low reserves can mean future special assessments").
- Surfaces that a state may grant a **statutory review/rescission window** to cancel
  (state-dependent; confirm with attorney) so buyers don't miss it.
- Flags **condo vs HOA vs co-op** differences (co-op = shares + board approval, not
  fee-simple) and **warrantable vs non-warrantable condo** as a **financing** gotcha to
  confirm with the lender (FHA/VA condo-approval lists noted for relevant buyers).
- Logs questions; ties into A5 + the A4 contacts hub (HOA management); "have your attorney
  review governing documents" on anything contractual; optionally shown only for condo/HOA
  homes. Rental caps presented neutrally (not investment advice).

**Test plan.**
- **Unit** (~6): checklist generation; **non-HOA → checklist hidden/empty-explained**
  (boundary on the "is condo/HOA" flag).
- **Component** (RTL, ~4): categories + empty state render.
- **E2E** (1).
- **Compliance:** rental-cap/occupancy notes phrased neutrally; screen any free-text;
  UPL — facts only.

**Implementation notes.** Pure `lib/tools/hoa-review.ts` (same shape family as A5),
component + route via `useStageTool("hoa")`; structurally a clone of A5. **No ADR.**

**Compliance.** 🟡 UPL: facts only, "have your attorney review governing documents." 🟦
FHA: occupancy/rental-cap notes neutral; screen free text.

**Roles consulted.** Advisor, Researcher, BA, UX, Architect, Engineer, QA.

---

### EPIC E6 — Search & Showings

#### A9 — Listing-alert & access guide
**Pri:** P1 (leans P2) · **Est:** S

> **As an unrepresented buyer, I want** an honest guide to setting up portal alerts and
> understanding what I might miss **so that** I get close to an agent's listing access
> without one.

**Value / KPI.** Honesty about the MLS gap → trust + activation; evergreen SEO. *KPI:* page
engagement; click-through to portal saved-search setup; downstream activation.

**Dependencies.** Bundle with **J3** (same surface). Pair the access-guidance portion with
**I1**.

**Acceptance criteria.**
- Neutral guide to **saved-search alerts** on **Zillow, Redfin, Realtor.com** (list
  several, **endorse none**) and watching **coming-soon/new-on-market**.
- States plainly **what a buyer may miss** (true MLS-only/office-exclusive/"pocket"
  listings; portal lag vs MLS; new listings appear on MLS hours-to-days before portals);
  describes **NAR Clear Cooperation** at the *concept* level (some inventory isn't
  syndicated) without overstating evolving policy — **dated "as of 2026"**. Reuses
  `isRentCastListingsActive()` to honestly state our own coverage (no licensed photos).
- **No implied affiliation/affiliate framing** with any portal (UDAP). Saved-search
  guidance stays on **objective attributes** (price, beds, type, commute time) — no
  demographic/"good schools as value" proxies. External links open clearly labeled with
  `rel="noopener"`. Ties to **J3**.

**Test plan.**
- **Content/unit** (~4): guide sections present; portal links; honesty note about
  MLS-only/pocket listings.
- **Component** (RTL, ~3): sections + dual-agency/access cross-link render.
- **E2E** (1): page renders + "not a full search" honesty note.
- **Compliance:** neutral, no steering; no implied portal affiliation.

**Implementation notes.** Static typed content (ADR-003) — a section on `/listings` or a
small route `app/tools/listing-alerts/page.tsx`; optional small checklist via
`useStageTool("listing-alerts")`. **No data layer, no ADR.** Marketing owns the guide copy
(copy is DoD).

**Compliance.** 🟦 FHA: portal-neutral, no steering by area demographics. 🟡 UPL: n/a.

**Roles consulted.** Advisor, Researcher, BA, Marketing, UX, Architect, Engineer, QA.

---

#### I1 — Showing access reality + scripts + dual-agency caution
**Pri:** P1 · **Est:** M

> **As an unrepresented buyer, I want** ready scripts to get a showing, a heads-up about
> dual agency, and a tour checklist **so that** I can tour homes solo without accidentally
> signing away my independence.

**Value / KPI.** Removes a real activation/conversion blocker (you can't offer on a home
you can't tour) and adds a trust signal (dual-agency caution). *KPI:* script copy/send
rate; tours logged per active buyer.

**Dependencies.** None (reads the state engine). Feeds the existing Tour Scorecard.

**Acceptance criteria.**
- **Scripts/fallbacks** by scenario (agent won't show / requesting a showing service vs.
  the listing agent / "I'm representing myself and have my own attorney; I'm not seeking
  representation") — neutral, **copyable**, screened. Keep the buyer's **unrepresented
  status explicit** (procuring-cause / accidental-representation guard); explain the
  difference between a buyer-agency vs non-agency disclosure so the buyer doesn't sign away
  independence unknowingly (but **don't advise whether to sign** — UPL).
- **State-aware dual-agency caution** reading the state engine's `dualAgency` —
  explains the conflict and that it's **banned in some states** (lists vary — drive off the
  state engine, not a hardcoded list) and elsewhere requires informed written consent;
  cites the state + source. "Pick your state to see local rules" when none selected.
- A short **in-person tour checklist** (systems, signs of water/foundation, photos to take)
  that **feeds the Tour Scorecard** — kept to property condition, never who lives there.
  Include a **video/virtual-showing fallback** for remote buyers (persona Riya).

**Test plan.**
- **Content/unit** (~6): scripts non-empty; **dual-agency caution keyed off the state flag**
  (appears only where applicable — boundary on the flag); tour-checklist items present.
- **Component** (RTL, ~4): script picker; "I have my own attorney" fallback; **feeds Tour
  Scorecard rubric** (assert handoff).
- **E2E** (1): showings page surfaces scripts.
- **Compliance (must):** any editable script field → `screenText` (no love-letter/
  protected-class; `FORBIDDEN_PLACEHOLDER_WORDS` test passes); UPL — scripts are wording,
  not legal advice.

**Implementation notes.** `lib/tools/showing-scripts.ts` (script data + pure
`dualAgencyCaution(profile)` reading `StateProfile.dualAgency`/`dualAgencyNote`); tour
checklist seeds the existing `lib/tools/tour-scorecard.ts` (shared type). Extend the
`/showings` area (reuse `message-composer.tsx` + `templates.ts` screening,
`agency-explainer`, `StateAwareCallout`). **No ADR.**

**Compliance.** 🟦 FHA: screened scripts, neutral; tour checklist on the building only.
🟡 UPL: caution explains the conflict, doesn't advise the representation choice.

**Roles consulted.** Advisor, Researcher, BA, Marketing, UX, Architect, Engineer, QA.

---

#### A7 — Needs-assessment / criteria worksheet
**Pri:** P2 (pull to P1 if activation is soft) · **Est:** S–M

> **As an unrepresented buyer, I want** to record my must-haves, nice-to-haves, and
> deal-breakers **so that** my search stays disciplined and my tours are scored against my
> own criteria.

**Value / KPI.** Early-funnel activation; seeds the Tour Scorecard. *KPI:* worksheet
completion → tour-scorecard usage conversion.

**Dependencies.** Best **before/with** Tour Scorecard usage (shared rubric type).
**Legal/Design sign-off** on the criteria field list for FHA neutrality.

**Acceptance criteria.**
- Worksheet capturing **must-haves / nice-to-haves / deal-breakers** (beds/baths, location/
  commute, budget ceiling, condition tolerance, property type, timeline); output **seeds the
  Tour Scorecard rubric**; budget ceiling cross-links to the existing affordability calc;
  editable as priorities evolve.
- **FHA (the big risk here):** criteria limited to **objective, non-protected attributes**;
  the tool **records the buyer's own objective filters** and must **never generate or
  recommend** protected-proxy criteria ("family-friendliness", safety, school *ratings as a
  steer*, demographics). "Deal-breaker" inputs must not become discriminatory screens.
  Budget ceiling stays *the buyer's* number, not a recommended price.

**Test plan.**
- **Unit** (~6): must/nice/deal-breaker categorization; **seeds Tour Scorecard rubric**
  (assert mapping); empty worksheet → valid empty rubric.
- **Component** (RTL, ~4): three buckets render + persist (`useStageTool`).
- **E2E** (1).
- **Compliance (must — highest FHA-leak risk in P2):** free-text criteria → `screenText`
  ("good schools"/neighborhood/demographic phrasing neutralized) — assert.

**Implementation notes.** Pure `lib/tools/criteria.ts` (typed buckets) +
`toScorecardRubric(criteria)` sharing a type with `tour-scorecard.ts`; component + route
via `useStageTool("criteria")`, registered under **get-ready/search**. Read
`tour-scorecard.ts` first to confirm the rubric shape. **No ADR.**

**Compliance.** 🟦 FHA: objective/property/logistics facts only — no protected-class
proxies; screen free text. 🟡 UPL: n/a.

**Roles consulted.** Advisor, Researcher, BA, UX, Architect, Engineer, QA.

---

### EPIC E7 — Negotiation

#### I2 — Negotiation playbook depth
**Pri:** P1 (high — ranks above A4/A9 within P1) · **Est:** M

> **As an unrepresented buyer, I want** a playbook for reading a counter, trading non-price
> levers, using inspection leverage, and walking away **so that** I hold onto the savings an
> agent would help me negotiate.

**Value / KPI.** After the offer, this is how buyers *hold* the savings (concessions,
repairs, walk-away discipline) → outcome/north-star (a credit won *is* realized savings).
*KPI:* % of counter-offer sessions recording a concession ask; avg estimated concession
value captured.

**Dependencies.** Builds on the existing Counter-offer Tracker + Inspection Findings.
Complements A3.

**Acceptance criteria.**
- Educational **playbook**: how to read a counter, **anchoring/concession** concepts, the
  **menu of non-price levers** (rent-back, closing/possession date, as-is, EM size,
  contingency timelines) each with its trade-off.
- **Repair-negotiation** section linking the Inspection Findings summary → Repair-Request
  Builder, explaining **repair vs closing-credit vs price-reduction** mechanics (credits hit
  lender caps — ties to J2; price cut lowers basis and needs appraisal support — don't
  conflate).
- **Walk-away discipline** tied to the **private walk-away max** the Counter-offer Tracker
  already stores — surfaced as a quiet reminder, **never exposed to outputs/templates / the
  seller side**.
- Flags **"time is of the essence" / counter expiration**, that a **counter is a rejection**
  of the prior offer (the original isn't revivable — stated generally, not as one state's
  rule), and that **"as-is" doesn't necessarily waive the right to inspect/withdraw**.

**Test plan.**
- **Content/unit** (~6): playbook entries (anchoring, non-price concessions, repair leverage,
  walk-away) non-empty; **walk-away ties to the private walk-away max** — assert it reads
  that value and **never exposes it** to outputs/templates.
- **Component** (RTL, ~4): guidance renders; repair-leverage pulls the inspection summary
  (mock).
- **E2E** (1): playbook visible on the counter-offer tracker.
- **Compliance:** educational "how to read a counter", no "counter at $X"; counter-offer
  reducer unchanged (regression).

**Implementation notes.** Education content `lib/tools/negotiation-playbook.ts` surfaced in
the counter-offer tool (`counter-offer-tracker.tsx`) and `/tools/offer-help`; optional pure
`repairLeverageNote(summary)` / `summarizeRepairLeverage` from `summarizeFindings`
(`inspection.ts`). **No ADR.** `TrustCallout`.

**Compliance.** 🟡 UPL: teach moves and trade-offs, never "counter at $X" or "ask for the
roof instead of a credit." 🟦 FHA: no personal-appeal/love-letter tactics.

**Roles consulted.** Advisor, Researcher, BA, Marketing, UX, Architect, Engineer, QA.

---

## 5. Sprint plan

Five sprints, honoring the **A1 → A2 critical path**, the quick wins, and the
cross-cutting prerequisites. Numbers in parentheses are estimates.

### Sprint 1 — "Trust & framing + safety net"
**J2** (S) · **J1** (M) · **J3** (S) · **A8** (S).
Small, high trust/retention, no data dependencies. **J2 is a compliance must-do** and the
marketed-number de-risk; **A8** protects deal outcomes; **J1/J3** harvest quick wins. Stand
up nothing infra-heavy. *Gate:* J1/J2 must clear (or schedule) the deferred external legal
sign-off before any public-claims surface launches.

### Sprint 2 — "The money spine" (north-star core)
**Prerequisite spike (do at sprint start):** **ADR-013 + the RentCast `/v1/markets`
field-name spike** (verify field names against a live key). **A1 ships manual-entry first**
regardless of the spike outcome.
Then **A1** (M, market read incl. J4 surfacing) → **A2** (S–M, suggested price band, bundling
**I3** fields). **Cross-cutting, in this sprint:** stand up the **north-star event** (offer
built with a concession ask + estimated captured savings) and the **funnel events**
(savings-calc completion → market-read view → offer-builder start → unlock) — the success
metrics in the stories depend on it. Pull **A3** in here if capacity allows.

### Sprint 3 — "Win & negotiate" (premium offer value)
**A3** (M, escalation/gap/multiple-offer) · **I2** (M, negotiation playbook). Both directly
realize/hold savings and justify the Guided tier; build right after the offer spine exists.
If the A1 auto-pull spike succeeded, land the RentCast `/markets` connector (second M) here
or in S2.

### Sprint 4 — "Coordinate & review" (retention + Guided depth)
**A4** (S–M, contacts) · **A5** (M, disclosure review) · **I1** (M, showing access/scripts)
· **A9** (S, listing-alert guide; bundle with J3 already shipped). Coordination +
document-review = the Guided-tier story and drop-off reduction. A5/I1 amortize the shared
state-engine read pattern.

### Sprint 5+ — "Round out"
**A7** (S–M; pull earlier if activation is soft) · **A6** (S–M; clone of A5) · **I4** (S–M;
after A2 proves out, same comps file). Last because they refine/extend surfaces the earlier
sprints establish.

**Critical path:** A1 → A2 (and A1 → J4, merged). Everything else parallelizes.
**Reuse multipliers to schedule together:** A5 → A6 (checklist scaffold); A4 reuses the
inspection-findings CRUD; A5/A6/I1/J1 share the `StateProfile` read; A8 builds on
`computeMilestones`; A7/I1 both feed the Tour Scorecard.

---

## 6. Spikes & open questions

**Spikes (resolve before committing dependent work):**
1. **RentCast `/v1/markets` field names** (blocks A1 *auto-pull* only). Confirm against a
   live key: which list price the ratio uses, whether DOM is cumulative, and exact field
   names (docs page 403s to automated fetch). **Until resolved, A1/J4 ship manual-entry**,
   which carries no infra risk. *Known from the Researcher brief:* the endpoint supplies
   **DOM, inventory, new-listing counts, list-price trend**, but **not list-to-sale ratio**
   and **not a months-of-supply sold-rate denominator** — those stay manual.
2. **A2 cross-tool state** — confirm whether to read the other tool's localStorage or
   co-locate the market read inline. **Lean co-locate** (simpler, avoids coupling).
3. **A8 all-day vs timed `.ics`** — all-day `VALUE=DATE` is simplest and matches the
   calendar-day model in `deadlines.ts`. Tiny.
4. **A7 / I1** — confirm the Tour Scorecard rubric shape before mapping into it.
5. **I3** — does RentCast expose **price history**? Not mapped today; if needed it's a small
   mapper extension, otherwise buyer-entered.

**Legal sign-off (deferred external, must clear before the relevant surface launches):**
**J1, J2** (factual + UDAP), **A2** (most directive-prone), **A3** (waiver/escalation
modeling), **A5/A6** (disclosure-interpretation boundary), **A7** (FHA criteria neutrality).
Both the FHA and UPL gates carry the deferred external sign-off; **public-claims surfaces
(esp. J2) do not launch ahead of it.**

**Researcher hot-list (most load-bearing facts to keep sourced & dated):** NAR settlement
terms/date (J1); buyer-compensation-negotiable (J1/J2); seller-credit caps by loan type/LTV
(J2); states restricting escalation clauses — TX/NC named (A3); caveat-emptor/minimal-
disclosure states + federal lead-paint + flood (A5); dual-agency prohibition states (I1);
HOA review/cancellation-period states & warrantability (A6); non-disclosure states (I3);
appraiser net/gross adjustment caps (I4); months-of-supply bands (A1); NAR Clear Cooperation
status (A9).

---

## 7. Cross-cutting work

1. **North-star + funnel instrumentation** (BA standing recommendation; gates every success
   metric). Stand up alongside **A2** in Sprint 2: the north-star event (offer built with a
   concession ask + estimated captured savings) and the funnel events (savings-calc
   completion → market-read view → offer-builder start → unlock). Without these we can't
   measure whether any item worked.
2. **ADR-013: Market-data provider seam** (the **only** ADR warranted by this backlog). A1
   introduces a new env-gated source (`MARKET_DATA_SOURCE`) + the RentCast `/v1/markets`
   endpoint and the classify-as-pure-function pattern; **A2, J4 consume it.** All other items
   fit existing ADRs (011 seam reuse, 003 typed content, 004/`useStageTool` localStorage, 008
   state engine, 010 deadlines).
3. **Single market read** — A1 computes `classifyMarket` once; A2, I3, I4, J4 consume the same
   `MarketRead`. Hard rule: do not compute the read twice.
4. **Data-flow seams are where the agent value lands** — Comps Worksheet → Offer Builder (A2),
   Inspection → Repair/Negotiation (I2), Needs worksheet → Tour Scorecard (A7), Disclosure/HOA
   → Contacts/questions (A4/A5/A6).
5. **Pure-function discipline + gate** (QA): all banding/tally/modeling/ICS logic lives in
   `src/lib/**` with Vitest; components get one RTL smoke test; only genuinely new *routes* get
   a Playwright flow. Every PR is green on typecheck + lint + Vitest + build + Playwright, with
   the UPL/FHA/accuracy assertions and the mandatory boundary + empty/off-state cases.
