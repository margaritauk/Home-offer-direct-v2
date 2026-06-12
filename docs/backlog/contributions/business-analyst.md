# Backlog Grooming — Business Analyst (value & prioritization lens)

_Contributor: Business Analyst · Backlog grooming · 2026-06-12_

**Lens.** Each item is scored on the value it creates and the funnel stage / KPI
it moves, against our north-star (**realized buyer savings** = commission
captured via a concession ask), the funnel (acquisition → activation → tool
engagement → conversion → outcome → retention), and the monetization model
(**free top-of-funnel → one-time flat unlock of the offer→closing workflow**,
tiered DIY vs. Guided). Effort is a coarse build guess (S ≤ ~3d, M ~1–2wk,
L > 2wk) from a BA vantage, to be confirmed by Eng. Priority column **validates
or challenges** the advisor's existing P0/P1/P2.

> Reading the column abbreviations: **V** = value (High/Med/Low), **E** = effort
> (S/M/L), **Pri** = my recommended priority (vs. advisor's in parentheses where
> I differ). WSJF table in §3 sequences sprints.

---

## 1. The four monetization buckets (so each item lands in the right place)

- **FREE — top-of-funnel / SEO / trust.** Educational, evergreen, drives
  acquisition and activation. Cost is content, not data. (J1, J2, A9, J3, J4,
  A7 framing.)
- **FREE — activation hook.** Light tooling that proves value and pulls users
  toward the offer builder (the savings story, market read). (A1, A7.)
- **PAID — offer-builder unlock (the north-star surface).** The operative
  workflow buyers pay to access; this is where realized savings happen. (A2, A3,
  A8, plus the offer-time portions of A5/I2/I3.)
- **PAID — Guided tier upsell.** Handoffs, coordination, collaboration that
  justify the premium tier over DIY. (A4, the pro-handoff edges of A5/A6/I1.)

The paywall must sit on the **highest-value operative artifact** (the offer
packet + concession ask + export), per the pricing analysis. Items that are pure
education stay free to feed the funnel; items that *realize savings* or
*coordinate the deal* sit behind or just above the unlock.

---

## 2. Item-by-item assessment

### P0 candidates

**A1 — Market-conditions read.**
- *Value / stage:* The context that makes every offer decision credible — turns a
  generic tool into one with local judgment. Moves **activation** (a compelling
  free hook) and feeds the **north-star** (right-sized offers). De-risks
  over/under-bidding → trust.
- *Score:* **V High · E M** (RentCast seam exists; logic + plain-English bands).
- *Priority:* **P0 — validate.** Confirmed. It's also the prerequisite for A2.
- *Success metric:* % of offer-builder sessions where the market read was viewed
  before price entry; lift in offer-completion rate among viewers vs. non-viewers.
- *Monetization:* **FREE activation hook** (a band on comps/offer pages). The
  *live-data* pull can sit behind the unlock if API cost demands it; the manual/
  educational read stays free.

**A2 — Comps + market → suggested price range.**
- *Value / stage:* The single biggest **north-star** lever — it converts "what's
  it worth?" into "what should I offer," which is the act that captures savings.
  Connects two screens users already reach. Strong **conversion** driver (it's the
  payoff of the paid workflow).
- *Score:* **V High · E M** (both inputs exist; this is a bridge + rationale UI,
  UPL-safe as a range).
- *Priority:* **P0 — validate (top of P0).** This is the money item; sequence it
  first among build work once A1 lands.
- *Success metric:* % of built offers whose price falls inside the suggested band;
  offer-builder completion rate; ultimately **estimated savings captured per
  completed offer**.
- *Monetization:* **PAID — core offer-builder unlock.** This is the artifact the
  paywall should sit on.

**J1 — When-to-go-solo + post-NAR framing.**
- *Value / stage:* Pure **trust + conversion**. Honest "here's when to hire help"
  raises credibility, reduces liability anxiety, and (counter-intuitively) lifts
  conversion by removing the "is this a scam?" objection. Also evergreen **SEO**.
- *Score:* **V High · E S** (content + a light decision aid; no data).
- *Priority:* **P0 — validate.** High value, tiny effort → best ROI in the whole
  backlog. Could ship in the first sprint as a quick win.
- *Success metric:* Bounce rate on the decision-aid page; activation rate
  (Journey start) among readers; qualitative trust signal / NPS comment coding.
- *Monetization:* **FREE top-of-funnel.** Do not gate.

**J2 — Conditional savings framing.**
- *Value / stage:* Protects the **north-star's integrity** and reduces FHA/UDAP
  over-promise risk. Honest "up to ~2.5%, if you ask and the deal allows" framing
  is **trust** and **compliance**, and keeps the savings calculator (our acquisition
  flywheel) defensible.
- *Score:* **V High (risk-weighted) · E S** (copy tightening on an existing tool).
- *Priority:* **P0 — validate, but treat as a compliance must-do.** I'd actually
  pull this *forward* — it's a copy change that de-risks the headline number we
  market on. Ship sprint 1 alongside J1.
- *Success metric:* Negative — absence of over-promise complaints/chargebacks;
  maintained savings-calc completion rate after re-framing (confirm no conversion
  drop).
- *Monetization:* **FREE top-of-funnel** (it lives on the savings calculator).

### P1 candidates

**A3 — Escalation / appraisal-gap / multiple-offer tactics.**
- *Value / stage:* In hot markets this is what *wins the house* → directly enables
  the **north-star** (no closed deal, no realized savings) and is a premium-feeling
  capability. **Conversion + outcome.**
- *Score:* **V High · E M** (escalation modeler + appraisal-gap calc + playbook copy).
- *Priority:* **Challenge → P0/P1 boundary.** Value is High and it pairs naturally
  with A2 inside the unlock. I'd flag it as **"first P1, pull into the P0 sprint if
  capacity allows"** — it's the competitive edge buyers in hot markets pay for.
- *Success metric:* % of offers in hot-market segments using an escalation/gap
  module; win-rate proxy (offers that reach mutual acceptance) where instrumentable.
- *Monetization:* **PAID — offer-builder unlock**, strong Guided-tier signal.

**A4 — Contacts / who's-who hub.**
- *Value / stage:* Pure organization; reduces mid-transaction drop-off → **retention
  / outcome**. Modest activation value; not a savings driver itself.
- *Score:* **V Med · E S** (CRUD card on dashboard/tracker; wire-fraud reminder reuse).
- *Priority:* **P1 — validate.** Good stickiness for low effort; belongs in the
  Guided tier as part of the coordination story.
- *Success metric:* % of active deals with ≥3 contacts saved; correlation between
  contacts-saved and reaching closing checklist (drop-off reduction).
- *Monetization:* **PAID — Guided tier** (coordination = premium); a stub can be free.

**A5 — Disclosure review worksheet.**
- *Value / stage:* Replaces real agent judgment; **trust + outcome** (catches
  red flags). Leans on existing state engine. Educational, defensible.
- *Score:* **V Med-High · E M** (checklist driven by state disclosure regime).
- *Priority:* **P1 — validate.** Solid. Offer-time portion can live in the unlock;
  the educational checklist can be free top-of-funnel SEO.
- *Success metric:* Worksheet completion rate; # of logged "questions for seller/
  attorney" per deal; handoff click-through to a pro.
- *Monetization:* **Split** — educational checklist FREE (SEO); the deal-bound,
  logged version inside the **paid** binder.

**A8 — .ics calendar export / deadline reminders.**
- *Value / stage:* High-value **safety net** that compensates for the no-account
  limitation — missing a contingency date costs the buyer money or the house.
  **Retention / outcome.** Notably **low effort**.
- *Score:* **V High · E S** (`.ics` generation from existing tracker dates).
- *Priority:* **Challenge → pull up within P1 (near-P0 on ROI).** Best value/effort
  ratio in P1; I'd sequence it early. It directly protects the closed-deal outcome
  the north-star depends on.
- *Success metric:* % of tracked deals exporting ≥1 deadline; (proxy) reduction in
  deadline-related support questions.
- *Monetization:* **PAID — part of the unlocked tracker** (it's a deal artifact).

**A9 — Listing-alert & access guide.**
- *Value / stage:* Honesty about the MLS gap → **trust + activation**; evergreen
  **SEO**. Doesn't move north-star directly (it's upstream of the offer).
- *Score:* **V Med · E S** (guide content + links).
- *Priority:* **P1 — validate (lean toward P2).** Useful and cheap, but it's
  educational top-of-funnel, not a savings lever — fine to slot late in P1 / early
  P2. Bundle with J3.
- *Success metric:* Page engagement; click-through to portal saved-search setup;
  downstream activation of readers.
- *Monetization:* **FREE top-of-funnel.**

**I1 — Showing access reality + scripts.**
- *Value / stage:* Removes a real-world blocker (agents who won't show / push dual
  agency) → **activation / conversion** (can't offer on a home you can't tour) and
  **trust** (dual-agency caution). Reuses state engine.
- *Score:* **V Med-High · E M** (scripts + caution + tour checklist feeding scorecard).
- *Priority:* **P1 — validate.** Confirmed; scripts free, the tour checklist can
  feed the (paid) scorecard.
- *Success metric:* Script/template copy-or-send rate; tours logged per active buyer.
- *Monetization:* **FREE** scripts (top-of-funnel); checklist feeds paid scorecard.

**I2 — Negotiation playbook depth.**
- *Value / stage:* After the offer, this is how buyers hold the savings (concessions,
  repairs, walk-away discipline) → **outcome / north-star** (a credit won *is*
  realized savings). Builds on the counter-offer tracker.
- *Score:* **V High · E M** (educational playbook + leverage from inspection summary).
- *Priority:* **Challenge → strong P1, arguably P0-adjacent.** It's tightly coupled
  to realizing savings; I'd rank it above A4/A9 within P1.
- *Success metric:* % of counter-offer sessions that record a concession ask; avg
  estimated concession value captured (feeds north-star directly).
- *Monetization:* **PAID — offer/negotiation workflow.**

### P2 candidates

**A6 — HOA / condo document review.**
- *Value / stage:* Segment-specific **trust / outcome** (condo buyers); narrower
  audience than disclosures.
- *Score:* **V Med · E M.**
- *Priority:* **P2 — validate.** Correctly later; reuse A5's checklist pattern when built.
- *Success metric:* Completion rate among condo/HOA-flagged deals.
- *Monetization:* **PAID** (Guided/binder), checklist teaser free.

**A7 — Needs-assessment / criteria worksheet.**
- *Value / stage:* Early-funnel **activation**; seeds the tour scorecard. Nice
  discipline, but far from the savings event.
- *Score:* **V Med · E S.**
- *Priority:* **Challenge → consider P1 for activation.** It's cheap and it's an
  *activation* hook that feeds later paid surfaces; if activation metrics are soft,
  pull it up. Otherwise P2 is fine.
- *Success metric:* Worksheet completion → tour-scorecard usage conversion.
- *Monetization:* **FREE activation hook.**

**I3 — Pre-offer due diligence.**
- *Value / stage:* Informs the offer (price history, DOM, motivation) → bargaining
  power → **north-star** support. Overlaps A1/A2 context.
- *Score:* **V Med · E S** (light fields/checklist on listing + offer builder).
- *Priority:* **P2 — validate (could ride along with A2).** Low effort; bundle into
  the A2 sprint as a cheap add-on rather than a standalone later item.
- *Success metric:* % of offers with diligence fields completed.
- *Monetization:* **PAID — part of offer builder.**

**I4 — Guided comp adjustments.**
- *Value / stage:* Improves comp accuracy → better suggested range (A2) → **north-star
  quality**. Refinement, not net-new capability.
- *Score:* **V Med · E M.**
- *Priority:* **P2 — validate.** Correct; an enhancement to A2's input, do after A2.
- *Success metric:* Adjustment-prompt usage; tighter variance between user range and comps.
- *Monetization:* **PAID — comps/offer workflow.**

**J3 — Listings labeling.**
- *Value / stage:* **Trust / accuracy** — sets honest expectations on the stub.
  Compliance-flavored, near-zero effort.
- *Score:* **V Low-Med · E S.**
- *Priority:* **Challenge → pull up as a quick win.** It's a tiny honesty fix that
  reduces a misleading-coverage risk; bundle with A9/J1 in an early "trust & framing"
  sprint rather than waiting for P2.
- *Success metric:* Reduced bounce/confusion on `/listings`; fewer "no results" complaints.
- *Monetization:* **FREE.**

**J4 — Buyer-side market data surfacing.**
- *Value / stage:* Presentation layer for A1 — surfaces the market read prominently.
  Largely subsumed by A1 if A1 is built buyer-facing from the start.
- *Score:* **V Med · E S.**
- *Priority:* **Challenge → merge into A1.** Recommend folding J4 into A1's
  acceptance criteria ("surface buyer-facing, not buried in comps") rather than
  tracking it separately. Avoids a redundant ticket.
- *Success metric:* Same as A1 (market-read view rate).
- *Monetization:* **FREE activation hook.**

---

## 3. Ranked sequencing table (WSJF-style)

WSJF ≈ (Business/Outcome value + Risk-reduction/Trust + Time-criticality) ÷ Effort.
I score each driver 1–5 (5 = highest), sum, divide by an effort cost (S=1, M=2,
L=3). Higher WSJF = sequence sooner.

| Rank | Item | V | E | Outcome/$ | Trust/Risk | Time-crit | WSJF | My Pri | Advisor Pri | Monetization |
|:--:|------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|------|
| 1 | **J2** conditional savings framing | High | S | 3 | 5 | 4 | **12.0** | P0 | P0 | Free (calc) |
| 2 | **J1** when-to-go-solo / post-NAR | High | S | 4 | 5 | 3 | **12.0** | P0 | P0 | Free TOFU |
| 3 | **A8** .ics export / reminders | High | S | 4 | 4 | 3 | **11.0** | P1→pull up | P1 | Paid (tracker) |
| 4 | **A2** comps+market → price range | High | M | 5 | 3 | 4 | **6.0** | P0 | P0 | Paid (unlock) |
| 5 | **A1** market-conditions read | High | M | 4 | 3 | 4 | **5.5** | P0 | P0 | Free hook |
| 6 | **J3** listings labeling | Low-Med | S | 1 | 4 | 2 | **7.0** | P2→pull up | P2 | Free |
| 7 | **I2** negotiation playbook | High | M | 5 | 3 | 2 | **5.0** | P1 (high) | P1 | Paid |
| 8 | **A3** escalation/gap/multi-offer | High | M | 5 | 2 | 3 | **5.0** | P0/P1 edge | P1 | Paid (Guided) |
| 9 | **A7** needs-assessment | Med | S | 2 | 2 | 2 | **6.0** | P1/P2 | P2 | Free hook |
| 10 | **I3** pre-offer diligence | Med | S | 3 | 2 | 2 | **7.0**\* | P2 (w/ A2) | P2 | Paid |
| 11 | **A4** contacts hub | Med | S | 2 | 3 | 2 | **7.0** | P1 | P1 | Paid (Guided) |
| 12 | **A5** disclosure review | Med-High | M | 3 | 4 | 2 | **4.5** | P1 | P1 | Split |
| 13 | **I1** showing access + scripts | Med-High | M | 3 | 3 | 3 | **4.5** | P1 | P1 | Free + paid |
| 14 | **A9** listing-alert/access | Med | S | 2 | 3 | 2 | **7.0** | P1→P2 | P1 | Free TOFU |
| 15 | **A6** HOA/condo review | Med | M | 2 | 3 | 1 | **3.0** | P2 | P2 | Paid |
| 16 | **I4** guided comp adjustments | Med | M | 3 | 1 | 1 | **2.5** | P2 (after A2) | P2 | Paid |
| 17 | **J4** buyer-side market data | Med | S | 2 | 2 | 1 | — | **merge → A1** | P2 | Free hook |

\* Several S-effort items share a similar raw WSJF; I break ties by north-star
proximity (savings impact) and by bundling opportunities (see notes).

> Note: raw WSJF favors cheap items, so A2/A1 score lower numerically despite being
> the strategic core. **Don't read the table as "do J3 before A2."** Use the
> sprint plan below, which protects the north-star spine while harvesting quick wins.

---

## 4. Recommended sprint sequencing (for the Product Owner)

**Sprint 1 — "Trust & framing + safety net" (mostly S, ships fast, de-risks).**
J2 (compliance copy) · J1 (decision aid) · J3 (listings label) · A8 (.ics export).
*Rationale:* all small, high trust/retention value, no data dependencies. J2 is a
compliance must-do; A8 protects deal outcomes. Quick credibility win.

**Sprint 2 — "The money spine" (the north-star core).**
A1 (market read, free hook) → A2 (suggested price band, paid unlock) → I3 fields
ride along with A2. *Rationale:* A1 unblocks A2; A2 is the realized-savings engine
and the paywall artifact. Fold **J4 into A1** here.

**Sprint 3 — "Win & negotiate" (premium offer value).**
A3 (escalation/gap/multi-offer) · I2 (negotiation playbook). *Rationale:* both
directly realize/hold savings and justify the Guided tier; build right after the
offer spine exists. Consider pulling A3 into Sprint 2 if capacity allows.

**Sprint 4 — "Coordinate & review" (retention + Guided depth).**
A4 (contacts) · A5 (disclosure review) · I1 (showing access/scripts) · A9.
*Rationale:* coordination + document-review = the Guided-tier story and drop-off
reduction.

**Sprint 5+ — "Round out."**
A7 (consider earlier if activation is soft) · A6 · I4 (after A2 proves out).

---

## 5. Headline recommendations & challenges to the existing priorities

1. **Validate all four P0s** — A1, A2, J1, J2 are correctly the core. Within P0,
   sequence the cheap framing items (J1/J2) first as quick wins, then the A1→A2 spine.
2. **Pull A8 (.ics) forward** out of mid-P1 — it's the best value/effort item in
   P1 and protects the closed-deal outcome the north-star depends on. Near-P0 on ROI.
3. **Pull J3 (listings label) forward** into the early trust sprint — it's a tiny
   honesty/compliance fix, no reason to wait for P2.
4. **Merge J4 into A1** — it's a presentation requirement of A1, not a separate
   ticket; tracking it twice invites redundant work.
5. **Bundle I3 into the A2 sprint** — cheap diligence fields belong with the offer
   builder, not stranded in P2.
6. **Watch A3 and I2** — both are High-value and tightly coupled to realized
   savings; if there's Sprint-2 capacity, A3 earns a pull-up.
7. **A9 leans P2** in practice — useful and cheap but it's educational top-of-funnel,
   not a savings lever; fine to slot late.
8. **Consider A7 for P1** if activation metrics are weak — it's a cheap activation
   hook that seeds paid surfaces.

**Instrumentation prerequisite (cross-cutting).** Before/while building A2, stand
up the **north-star event** (offer built with a concession ask + estimated captured
savings) and the funnel events (savings-calc completion → market-read view →
offer-builder start → unlock). Without these, we can't measure whether any of the
above worked. This is the BA's standing recommendation #2 from the business
analysis, and it gates the success metrics in §2.

**Monetization summary.** Free top-of-funnel: J1, J2, J3, A9, A1 (+J4), A7, and the
educational halves of A5/I1. Paid offer-builder unlock (north-star surface): A2, A3,
A8, I2, I3, I4, plus deal-bound A5. Guided-tier upsell (premium): A4 and the
handoff/coordination edges of A5/A6/I1. The paywall sits on A2's suggested-offer
artifact + the offer packet/export — the highest-value operative output.
