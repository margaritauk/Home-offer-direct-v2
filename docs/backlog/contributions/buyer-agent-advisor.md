# Backlog Grooming — Buyer's Agent Advisor Contribution

_Contributor: Buyer's Agent Advisor · Backlog grooming · 2026-06-12_

This is the **domain-correctness lens** on each backlog item from
`docs/advisory/buyer-agent-gap-analysis.md`. For every item I specify what the
feature must do to faithfully reflect real buyer-agent practice. Each item gives:

1. **Real-world workflow / standard** it must mirror.
2. **Practitioner "definition of done"** — what a competent buyer's agent would
   consider complete and correct.
3. **Domain edge cases & gotchas.**
4. **Verify (→ Researcher)** — factual claims that must be sourced/dated.

Two guardrails bind every item (restated once, assumed throughout):

- **UPL gate** — educate, model, and show trade-offs; never a directive
  ("offer $X", "waive the inspection contingency"). Anything contractual carries
  "have your attorney review."
- **FHA gate** — market/neighborhood/school data presented neutrally; no
  steering toward/away from protected classes; no demographic targeting; no
  buyer "love letters."

---

## P0 items

### A1 — Market-conditions read ("buyer's vs seller's market") [P0]

**1. Real-world workflow.** Before advising aggressiveness, an agent reads
*market temperature* from four core signals: **days on market (DOM / median
CDOM)**, **list-to-sale-price ratio** (sale ÷ original list; >100% = above ask),
**months of supply / inventory** (the absorption-rate convention: roughly **<3
months = seller's market, 3–6 = balanced, >6 = buyer's market**), and the
**recent price trend** (3–6 month direction). The read is always *geographically
scoped* — ZIP / submarket / price-tier / property-type, not metro-wide averages.

**2. Definition of done.**
- Buyer can enter **or pull (RentCast seam)** the four signals scoped to a
  specific area/segment.
- Output is a plain-English classification (seller's / balanced / buyer's) **with
  the underlying numbers shown**, not just a label.
- Each metric has a one-line "what this means for you" framed as **trade-offs**
  ("homes selling above ask → competition is high; the negotiating room a buyer
  usually has shrinks"), never a directive ("offer above ask").
- Every figure is **dated and source-attributed** (matches state-engine /
  research-doc convention).
- A "this is a snapshot, conditions move" caveat is visible.

**3. Edge cases & gotchas.**
- **Thin data:** rural / luxury / new-construction segments often have too few
  sales for a reliable ratio or DOM. Must degrade gracefully ("insufficient
  comparable sales — treat as low confidence") rather than print a false signal.
- **DOM is gameable:** relisting resets DOM; use **cumulative DOM** where
  available and warn that a low DOM may be a fresh relist.
- **List-to-sale denominator ambiguity:** ratio off *original* list vs *current*
  (post-reduction) list tells very different stories — state which is used.
- **Seasonality:** spring vs winter inventory swings; don't read a seasonal dip
  as a market shift.
- **Segment mismatch:** condos vs SFH, and price tiers, can be opposite markets
  in the same ZIP. Don't blend.
- **FHA:** keep strictly to transactional market metrics. **No** "desirability,"
  "good/up-and-coming area," safety, or school-quality-as-value framing — those
  are steering vectors. School/demographic data, if shown at all, is neutral
  reference only and never tied to a buy/price recommendation.

**4. Verify (→ Researcher).**
- The months-of-supply thresholds (<3 / 3–6 / >6) — confirm these are the
  conventional NAR/industry bands and cite.
- RentCast (or chosen source) actually returns DOM / list-to-sale / inventory at
  usable geographic granularity, and the field definitions (which list price the
  ratio uses, whether DOM is cumulative).

---

### A2 — "What should I offer?" bridge (comps + market → price range) [P0]

**1. Real-world workflow.** An agent fuses the **CMA fair-value range** (from
adjusted comps) with the **market read (A1)** to recommend *where in the range*
to come in: hot market → top of / above range; soft market → low/mid with room
to negotiate. They also factor **seller motivation** (DOM, price cuts — see I3)
and the buyer's **financing strength**.

**2. Definition of done.**
- The comps fair-value **range** carries forward into the offer flow (data
  actually flows from Comps Worksheet → Offer Builder — today they're
  disconnected).
- Output is a **suggested price band with explicit rationale** that names its two
  inputs ("comps support $380–410k; market read = hot → competitive offers here
  cluster near/above the top of comp ranges").
- It presents a **range and the reasoning**, never a single directive number;
  the buyer chooses the figure. The offer-strength indicator updates from the
  chosen number.
- Shows what *moves* the band (more cash, fewer contingencies, escalation) as
  trade-offs, not instructions.

**3. Edge cases & gotchas.**
- **List price ≠ value:** a home can be over- or under-listed; the band must be
  anchored to *comps*, not to asking price, or it just rubber-stamps the listing.
- **Appraisal ceiling:** for financed buyers, offering above comp-supported value
  invites an **appraisal gap** — must cross-link to A3 and the existing
  low-appraisal calc so "go high" isn't shown without its cash consequence.
- **Stale / dissimilar comps:** if the comp set is weak (few, old, far,
  unadjusted), confidence in the band must drop and say so.
- **Non-price levers:** in multiple-offer situations price is only one axis (EM,
  contingencies, close date, rent-back); the bridge must not imply price alone
  wins — hand off to A3/I2.
- **UPL:** the single most directive-prone feature in the product. The line is
  "competitive offers in conditions like these *tend to* land near X" (market
  fact) vs "you should offer X" (advice). Stay on the former.

**4. Verify (→ Researcher).** None new — this is composition logic over A1 + the
existing comps tool. Confirm the offer-strength indicator's current inputs so the
band can drive it.

---

### J1 — Post-NAR buyer-agreement reality + "should I go solo?" decision aid [P0-framing]

**1. Real-world workflow.** Since the **NAR settlement (effective ~Aug 2024)**, a
buyer who *works with* an agent must sign a **written buyer-broker agreement
before touring** a home the agent shows, and that agreement must state agent
compensation as a specific/objective amount (not open-ended, not "whatever the
seller offers"). Buyer-side compensation is **negotiable and no longer assumed
seller-paid**. A competent agent also tells a buyer **when going solo is
reasonable vs when the stakes warrant a pro** — that honesty is itself the
practitioner standard.

**2. Definition of done.**
- A plain, **dated, sourced** explanation of the post-Aug-2024 written-agreement
  requirement and that buyer compensation is negotiable / not guaranteed
  seller-paid.
- A **balanced decision aid**: scenarios where self-representation is reasonable
  (straightforward resale, cooperative listing side, buyer has time and an
  attorney) **vs** where stakes rise (complex/clouded title, unusual financing,
  hot multiple-offer markets, **new construction** with builder contracts,
  **probate / short-sale / REO / auction**, **inherited or trust-held** property,
  major-rehab/as-is). Present as a **two-column trade-off**, not a verdict.
- Names the **menu of help**: full buyer's agent, **flat-fee / hourly buyer
  agent**, and **flat-fee / hourly real-estate attorney** (esp. in attorney-close
  states) — so "get help" isn't binary.
- Frames the agreement requirement as applying when you **use** an agent — the
  unrepresented path this product champions does **not** trigger it; say so
  clearly to avoid confusing the hero user.

**3. Edge cases & gotchas.**
- The written-agreement rule binds **REALTOR®/MLS-participant** agents; precise
  scope, required-before-*touring* timing, and state add-on rules vary — don't
  overstate it as a blanket law.
- "Buyer pays the commission" is **financeable/structurable** in several ways
  (seller concession, buyer-paid, credit) — present neutrally; don't imply the
  buyer always pays out of pocket.
- Attorney-vs-escrow-state distinction already lives in the state engine — reuse
  it so the "hire an attorney" suggestion is state-appropriate.
- **UPL:** "here are situations others find complex and the kinds of pros who
  help" — never "you need a lawyer for your situation."

**4. Verify (→ Researcher).** HIGH PRIORITY.
- Exact effective date and precise terms of the NAR settlement practice changes
  (written agreement **before touring**; compensation must be specific/objective;
  no decoupling claims that aren't accurate).
- Whether the written-agreement requirement reaches **non-MLS / non-REALTOR**
  agents in any states, and any state laws that pre-dated or extend it.
- Current, citable source for "buyer compensation is negotiable and not
  guaranteed seller-paid."

---

### J2 — Conditional savings framing [P0-framing]

**1. Real-world workflow.** The "~2.5% savings" only materializes if the buyer
**negotiates the unrepresented-buyer commission into a price reduction or closing
credit**, AND the seller is willing, AND it fits **lender seller-credit caps**.
Post-NAR, buyer-side compensation is **not** guaranteed offered, so it can't be
framed as automatically "yours to capture."

**2. Definition of done.**
- Savings copy reads as conditional: **"up to ~2.5%, if you negotiate it and the
  deal allows"** — never an assumed/guaranteed figure.
- The calculator surfaces the **three preconditions** (seller willing; structured
  as price cut or credit; within lender concession caps).
- Buyer-paid-out-of-pocket vs seller-credit vs price-reduction are shown as
  distinct mechanics with different cash/loan effects.
- Aligns with PRD language ("real but NOT automatic").

**3. Edge cases & gotchas.**
- **Seller-credit caps are loan-type/LTV dependent** (conventional tiers,
  FHA/VA/USDA differ; caps interact with down payment). A blanket "you can credit
  X%" is wrong — caps must be presented as "varies by loan type / down payment;
  confirm with your lender."
- A **price reduction** (lowers loan basis, appraisal must still support) behaves
  differently from a **closing credit** (cash-to-close relief, capped); don't
  conflate.
- **UDAP / over-promising risk:** the *marketing* number and the *tool* number
  must agree — flag to Marketing Analyst so the landing teaser matches.
- The amount is a function of **price** (2.5% of $400k ≠ of $800k) and of what the
  listing side was offering — don't print a flat dollar promise.

**4. Verify (→ Researcher).**
- Current seller-paid-closing-cost (interested-party contribution) **caps by loan
  type and LTV** — these change; need dated citation.
- Confirm the "~2.5%" buyer-side rate is still a defensible national midpoint
  post-NAR (commissions are now more variable).

---

## P1 items

### A3 — Competitive-offer tactics: escalation clause, appraisal-gap, multiple-offer [P1]

**1. Real-world workflow.** Three distinct tools agents use in hot markets:
- **Escalation clause** — "beat the highest *bona fide* competing offer by $X up
  to a cap of $Y," requiring **proof of the competing offer**.
- **Appraisal-gap coverage AT OFFER TIME** — buyer commits to bring up to $Z cash
  if appraisal < price (distinct from the *post*-appraisal renegotiation the
  existing Clear-to-Close/low-appraisal calc handles).
- **Multiple-offer / "highest & best" playbook** — EM sizing, contingency and
  close-date levers, deadlines, and how "highest and best" requests work.

**2. Definition of done.**
- **Escalation modeler:** inputs (starting price, increment, cap); shows the
  resulting price under sample competing bids; **explains the risks** (caps reveal
  your ceiling; requires proof-of-offer; some listing agents/sellers **won't
  accept** escalations and some markets/states disfavor or restrict them; can
  trigger an appraisal gap).
- **Appraisal-gap helper (offer-time):** given price and a hypothetical appraised
  value, shows **cash needed to cover the gap** and that lenders lend on the
  **lower of price or appraisal**; clearly separated from the post-appraisal calc.
- **Multiple-offer playbook:** educational checklist of levers beyond price, what
  "highest & best" means, EM-as-signal, and the trade-off each lever carries
  (e.g., waiving a contingency = giving up an exit — explained as a trade-off,
  **never recommended**).

**3. Edge cases & gotchas.**
- **Escalation clauses are disfavored/restricted in some markets** and some
  brokerages/sellers refuse them outright — must state this, not present them as
  universally usable. (Flag: a few jurisdictions / forms treat them as
  problematic.)
- Escalation **interacts with appraisal**: escalating above comp-supported value
  manufactures a gap — the two tools must cross-reference.
- Appraisal-gap **cash is in addition to** down payment + closing costs and is
  generally **not financeable** — make the total cash picture explicit.
- **Highest & best ≠ auction:** no obligation to disclose other offer amounts;
  buyer can't verify competition — caution against bidding blind past their max.
- **EM is at risk** if contingencies are waived and the buyer defaults — frame EM
  sizing with that downside.
- **UPL:** model the mechanics and math; never say "use an escalation clause" or
  "waive your appraisal contingency."

**4. Verify (→ Researcher).**
- Which states / standard forms **restrict or disfavor escalation clauses**
  (named list with citation).
- Confirm lender "lower of price or appraisal" rule and that gap cash is
  generally non-financeable, with a current source.

---

### A4 — Transaction contacts / "who's who" hub [P1]

**1. Real-world workflow.** The agent is the switchboard. The standard cast on a
financed purchase: **loan officer/lender, escrow or title officer, closing
attorney (attorney-states), inspector(s), listing agent, insurance agent**, and
often surveyor, HOA management, home-warranty, transaction coordinator.

**2. Definition of done.**
- Per-deal **Contacts card** (on `/dashboard` + tracker): name, **role**, phone,
  email per party; freeform for additional parties.
- **Wire-fraud reminder pinned to the escrow/title and closing-attorney contacts**
  ("we will never change wire instructions by email — call a known number to
  verify") — reuses the existing wire-fraud callout component.
- Pure organization; **no advice, no referrals embedded** (referrals stay in the
  pro directory to avoid RESPA entanglement).

**3. Edge cases & gotchas.**
- **Attorney vs escrow states** change *which* roles exist — prefill the relevant
  cast from the state engine (no closing attorney in escrow states; title vs
  attorney closing).
- **RESPA:** this is a contact list, not a referral engine — do not auto-suggest
  specific vendors here or tie any party to revenue.
- **Privacy/GLBA (v2 collaboration):** these are third-party PII; if a deal is
  shared, contact visibility needs the per-deal scoping the PRD already calls for.
- Don't imply the listing agent represents the buyer — label roles by *whose side*
  they're on.

**4. Verify (→ Researcher).** None — organizational. Confirm state-engine exposes
attorney-vs-escrow flag for role prefill.

---

### A5 — Seller-disclosure review worksheet [P1]

**1. Real-world workflow.** Agents read the seller's disclosure form for red
flags and turn them into questions/inspection focus. Common categories: **water
intrusion / drainage, roof, foundation/structural, electrical/plumbing/HVAC,
prior repairs & insurance claims, environmental (lead, radon, asbestos, mold,
flood zone), pests/termite, boundary/easement, HOA, and where required, deaths or
"stigma."**

**2. Definition of done.**
- A **state-aware checklist** (driven by the state engine's disclosure regime)
  walking the buyer through each red-flag category with "what to look for" and
  "questions to ask the seller / flag for inspector or attorney."
- Logs the buyer's findings/questions and links them to inspection (existing
  Inspection Findings) and repair-request tools.
- **Facts only**; every contractual/legal item carries "confirm with your
  attorney/inspector." Does **not** interpret legal sufficiency of a disclosure.

**3. Edge cases & gotchas.**
- **Disclosure regimes vary sharply by state:** some are robust statutory forms,
  some minimal, and a handful are effectively **caveat emptor / "buyer beware"**
  (e.g., AL, VA-style limited) — the worksheet must reflect that a *light or
  absent* disclosure is itself a signal, not assume a rich form exists.
- **"As-is" sales** (including REO/probate) often **waive disclosures** or use
  exemptions — handle the "little/no disclosure provided" path.
- **Death/stigma disclosure is state-specific** (some require, some prohibit
  asking, some silent) — gate that category by state; never volunteer it where
  prohibited.
- **Federal overlay:** **lead-based-paint disclosure (pre-1978 homes)** is a
  federal requirement on top of state rules — always include for pre-1978.
- **Flood:** newer state flood-disclosure laws are expanding — keep current.
- **FHA:** disclosure review is about the *property's condition*, not the
  neighborhood's people; keep it there.

**4. Verify (→ Researcher).**
- Which states are caveat-emptor / minimal-disclosure (named, dated).
- Federal lead-paint pre-1978 rule citation; current state flood-disclosure
  landscape.
- That the state engine already encodes a disclosure-regime field to drive this.

---

### A8 — Deadline reminders / .ics calendar export [P1]

**1. Real-world workflow.** Proactive deadline-chasing is core agent value:
**inspection/option period, contingency-removal dates, appraisal, loan
commitment, EM deposit due, title review, CD delivery (3-day rule), final
walkthrough, closing.** Missing one can cost the EM or the deal.

**2. Definition of done.**
- **`.ics` export** (per-deadline "add to calendar" + export-all) so dates land in
  the buyer's own calendar with their own alerts — no account/email needed (fits
  the no-auth MVP).
- Each event includes **title, the date, and a short neutral description** ("loan
  contingency removal — confirm with lender/attorney; missing this may affect your
  EM").
- Derives dates from the deadlines already in the tracker; **business-day vs
  calendar-day** handling is explicit per deadline type.

**3. Edge cases & gotchas.**
- **Business days vs calendar days** differ by clause and by state form; an .ics
  that silently assumes calendar days can mislead — label the basis and let the
  buyer confirm against their contract.
- **Time zones / all-day events:** contingency deadlines are usually end-of-day
  *local*; use all-day or explicit-TZ events to avoid a date slipping a day.
- **CD 3-day rule** is a specific federal business-day count (and resets on
  certain changes) — don't hand-roll it; reuse the product's existing CD logic.
- This is a **convenience export, not a legal deadline of record** — the contract
  governs; say so. (UPL.)
- Don't auto-set reminder *times* presumptuously; let the calendar app handle
  alerting.

**4. Verify (→ Researcher).** Confirm the CD 3-business-day rule wording/triggers
match the product's existing trust callout. No new external facts.

---

### A9 — Listing-alert & access guide [P1]

**1. Real-world workflow.** Agents get **MLS** access and instant new-listing
alerts, including **coming-soon** and (within rules) **office-exclusive / pocket**
listings. Unrepresented buyers can't fully match this but can get close with
portal saved-searches.

**2. Definition of done.**
- Honest, **neutral** guide to setting **saved-search alerts** on major portals
  (Zillow, Redfin, Realtor.com — list several, don't endorse one) and watching
  **coming-soon / new-on-market**.
- States plainly **what a buyer may miss** (true MLS-only/office-exclusive/pocket
  listings; portal lag vs MLS; some new listings appear on the MLS hours-to-days
  before portals).
- Ties to J3 (listings stub is a demo, not a search engine).

**3. Edge cases & gotchas.**
- **Portal data lags and de-dupes imperfectly** — don't imply portal alerts equal
  MLS speed.
- **NAR "Clear Cooperation" policy** governs office-exclusive/pocket listings and
  is itself in flux — describe the *concept* (some listings aren't publicly
  syndicated) without overstating current policy specifics.
- **FHA:** saved-search guidance must steer clear of suggesting filters that proxy
  protected classes (e.g., framing certain areas by demographics/"good schools as
  value"). Keep filters to objective attributes (price, beds, type, commute time).
- **No endorsement / no affiliate framing** of any one portal (neutrality + avoid
  steering).

**4. Verify (→ Researcher).** Current state of **NAR Clear Cooperation / office-
exclusive** policy (it has been under active revision) — date-stamp it.

---

### I1 — Showings: access reality + scripts (dual-agency caution) [P1]

**1. Real-world workflow.** A listing agent may decline to show to an
unrepresented buyer, or steer them toward **dual agency** (representing both
sides). An agent normally arranges showings; solo buyers use **open houses**,
request the **listing agent** or a **showing service**, and must guard against
unintended agency conversion.

**2. Definition of done.**
- **Scripts/fallbacks**: requesting a showing from the listing agent, using open
  houses / showing services, and a neutral line preserving independence ("I'm
  representing myself and have my own attorney; I'm not seeking representation").
- A **dual-agency caution** explaining the conflict and that it's **banned in some
  states** and elsewhere requires informed written consent (state engine knows
  where).
- A short **in-person tour checklist** (systems, signs of water/foundation, what
  photos to take) that **feeds the Tour Scorecard** — kept to property condition.

**3. Edge cases & gotchas.**
- **"Procuring cause" / accidental representation:** letting the listing agent
  "help" can later be framed as them representing the buyer — scripts must keep the
  buyer's unrepresented status explicit.
- **Dual agency is outright banned in some states** (and "designated/dual" rules
  differ) — never present it as routinely fine; surface the state rule.
- Some agents condition access on signing a **buyer-agency or non-agency
  disclosure** — explain the difference so the buyer doesn't sign away
  independence unknowingly (but **don't advise** whether to sign — UPL).
- **Safety / FHA:** tour checklist stays on the building, never on who lives there
  or neighborhood demographics.
- Remote buyers (persona Riya): include **video-tour / virtual-showing** fallback.

**4. Verify (→ Researcher).** States where **dual agency is prohibited** vs
permitted-with-consent (named list, dated); confirm state engine encodes it.

---

### I2 — Negotiation playbook depth [P1]

**1. Real-world workflow.** After a counter, an agent reads it (price vs terms),
advises **anchoring and concession** strategy, trades **non-price levers**
(closing date, rent-back, as-is, EM size, contingency timelines), uses the
**inspection summary as repair-negotiation leverage** (repair vs credit vs price
cut), and enforces **walk-away discipline** against a pre-set max.

**2. Definition of done.**
- Educational **playbook**: how to read a counter, anchoring/concession concepts,
  the **menu of non-price levers** with the trade-off each carries.
- **Repair-negotiation** section linking the Inspection Findings summary →
  Repair-Request Builder, explaining **repair vs closing-credit vs price-reduction**
  mechanics (and that credits hit lender caps — ties to J2).
- **Walk-away discipline** tied to the private walk-away max the Counter-offer
  Tracker already stores (kept private, never shown to seller).

**3. Edge cases & gotchas.**
- **Repair credit vs price reduction** behave differently (credit capped by lender
  & needs appraisal support; price cut lowers basis) — don't conflate.
- **"Time is of the essence"** clauses and counter **expiration** windows — a
  counter can lapse; flag the clock.
- A **counter-offer is a rejection** of the prior offer in many forms — the
  original isn't revivable once countered; note this so buyers don't assume they
  can "go back."
- **As-is** doesn't necessarily waive the *right to inspect/withdraw* (state/form
  dependent) — don't conflate "as-is" with "no inspection."
- **UPL:** teach the moves and trade-offs; never "counter at $X" or "ask them to
  fix the roof instead of a credit."
- **FHA:** no "appeal to the seller personally" / love-letter tactics.

**4. Verify (→ Researcher).** None external-critical; confirm common-form behavior
("counter = rejection of prior offer") is stated generally, not as one state's
rule.

---

## P2 items

### A6 — HOA / condo document review checklist [P2]

**1. Real-world workflow.** Agents review the HOA/condo resale packet: **operating
budget & reserve study (reserve funding %), special assessments (pending or
recent), CC&Rs/rules, litigation, rental caps / owner-occupancy ratio, insurance
(master policy + what owner must insure), dues & dues history, and meeting
minutes.**

**2. Definition of done.**
- Checklist covering the categories above, each with "what to look for" and "why
  it matters" as **trade-offs** (e.g., "low reserves can mean future special
  assessments").
- Logs questions to ask the HOA/management; ties into the disclosure worksheet
  (A5) and contacts hub (A4, HOA management).
- "Have your attorney review governing documents" on anything contractual.

**3. Edge cases & gotchas.**
- **Review/rescission windows:** many states give a statutory period to review HOA
  docs and **cancel** — surface that a window may exist (state-dependent; confirm
  with attorney) so buyers don't miss it.
- **Condo vs HOA vs co-op** differ materially (co-op = shares + board approval, not
  fee-simple) — don't blend; flag co-op approval/financing differences.
- **Warrantable vs non-warrantable condo** affects financing (high investor ratio,
  litigation, low owner-occupancy can block conventional/FHA loans) — flag as a
  **financing** gotcha to confirm with lender.
- **FHA/VA condo approval lists** exist for those loan types — note for relevant
  buyers.
- **Rental caps** matter to buyers intending to rent — present neutrally, not as
  investment advice.

**4. Verify (→ Researcher).**
- States with statutory **HOA-document review/cancellation periods** (dated).
- Current FHA/VA condo-approval and non-warrantable criteria (citation).

---

### A7 — Needs-assessment / criteria worksheet [P2]

**1. Real-world workflow.** A buyer consultation separates **must-haves vs
nice-to-haves vs deal-breakers** (beds/baths, location/commute, budget ceiling,
condition tolerance, property type, timeline) to keep search disciplined and seed
showing evaluation.

**2. Definition of done.**
- Worksheet capturing the three tiers; output **seeds the Tour Scorecard rubric**
  so tours are scored against the buyer's own criteria.
- Budget ceiling cross-links to the existing budget/affordability calc.
- Editable as priorities evolve.

**3. Edge cases & gotchas.**
- **FHA is the big one:** "location/neighborhood" criteria must be limited to
  **objective, non-protected attributes** (commute time, price, school *district
  boundaries as a factual filter only if the buyer chooses* — but **never** the
  tool suggesting areas by demographics, "family-friendliness," safety, or school
  *ratings as a steer*). The product must not *generate* or *recommend*
  protected-proxy criteria; it only records the buyer's own objective filters.
- Don't let "deal-breaker" inputs become discriminatory screens.
- Keep budget ceiling as *the buyer's* number, not a recommended price.

**4. Verify (→ Researcher).** None external; this is a UX/compliance design item.
Recommend Design + Legal sign-off on the criteria field list for FHA neutrality.

---

### I3 — Pre-offer due diligence on the property [P2]

**1. Real-world workflow.** Before offering, agents pull **price/listing history
(prior listings, relists), price changes, DOM/CDOM, last-sold price & date, tax
assessment, and seller motivation** ("why selling," if known) to inform the offer
and bargaining position.

**2. Definition of done.**
- Light pre-offer checklist/fields: last sold (price/date), price-change history,
  DOM/CDOM, prior expired/withdrawn listings, tax assessment, known seller
  motivation.
- Surfaced on listing detail + offer builder; **feeds A2** (motivation/DOM nudges
  where in the band).
- Distinguishes **fact** (recorded sale, assessment) from **inference**
  (motivation) — label inferences as unverified.

**3. Edge cases & gotchas.**
- **Relisting hides DOM** (see A1) — show cumulative where possible.
- **Tax assessment ≠ market value** — explicitly; assessments lag and use
  different methodology.
- **Seller motivation is often hearsay** — never present a rumor as fact; "if
  known / unverified."
- **FHA:** "why selling" must never drift into protected-class territory
  (divorce/death/relocation are fine as transactional facts only if volunteered;
  never infer or probe protected characteristics).
- Public-record availability varies (non-disclosure states don't publish sale
  prices) — handle missing data gracefully.

**4. Verify (→ Researcher).** **Non-disclosure states** (where sale prices aren't
public — e.g., several mountain/southern states) so the tool sets expectations;
dated list. Whether RentCast/source returns price & listing history.

---

### I4 — Guided comp adjustments [P2]

**1. Real-world workflow.** A CMA adjusts each comp toward the subject for
**differences**: GLA/square footage, condition/updates, **bed/bath count,
garage/parking, lot size, age, location/site, and time (market conditions since
sale / recency)**. Adjustments are made to the *comp* to reflect "what it would
have sold for if it were like the subject."

**2. Definition of done.**
- **Suggested adjustment prompts** for the standard categories (condition, GLA,
  garage, lot, recency, bed/bath) with the **methodology explained** (adjust the
  comp toward the subject; net the adjustments; weight closer/recent comps more).
- A worked example so a first-timer understands direction (superior comp → adjust
  **down**) — a common beginner error.
- Stays a **DIY estimate**, explicitly **not an appraisal**.

**3. Edge cases & gotchas.**
- **Sign-direction confusion** is the classic mistake — make direction explicit
  per field.
- **Don't over-adjust:** appraiser conventions cap net/gross adjustment %; warn
  that large total adjustments mean the comp is weak (pick better comps instead).
- **$/sqft is a sanity check, not an adjustment method** — caution against naive
  $/sqft scaling for big size gaps (price-per-sqft falls as size rises).
- **Recency/market adjustment** must reconcile with A1's price-trend read (don't
  double-count).
- **Not an appraisal / not value-of-record** — UPL/accuracy disclaimer; lender's
  appraisal governs.
- **FHA:** "location adjustment" must be on **objective site factors** (busy road,
  lot, view) — never neighborhood-desirability-by-demographics.

**4. Verify (→ Researcher).** Typical appraiser **net/gross adjustment guideline
percentages** (e.g., the conventional single-adjustment and net/gross caps) for an
accurate "your adjustments look high" warning — cite source.

---

### J3 — Listings-stub labeling [P2]

**1. Real-world workflow.** Honesty about coverage — an agent wouldn't pass off a
handful of demo homes as a full search.

**2. Definition of done.**
- `/listings` clearly **labeled as a shortlist/demo**, not a search engine, with
  coverage limits stated.
- Routes serious search to portals (ties to A9).

**3. Edge cases & gotchas.**
- Must not imply MLS-completeness or real-time accuracy.
- **No portal endorsement/affiliate framing** (neutrality, FHA).
- If demo homes are real addresses, ensure no stale price/status misleads.

**4. Verify (→ Researcher).** None — labeling/copy. Coordinate with Product on the
non-goal ("real MLS integration" is explicitly out of MVP per PRD).

---

### J4 — Buyer-side market data surfacing [P2]

**1. Real-world workflow.** Market context is the lens for *every* offer decision,
so an agent leads with it — it shouldn't be buried in a comps connector.

**2. Definition of done.**
- When market stats exist (RentCast or other), surface the **A1 buyer-facing read
  prominently** (dashboard / offer flow), not only inside the comps tool.
- Reuses A1's classification, caveats, and source/date stamping (single source of
  truth — don't compute the read twice).

**3. Edge cases & gotchas.**
- **Don't double-implement** A1's logic — J4 is placement/surfacing of the same
  read; keep one computation.
- Same **FHA** neutrality and **freshness/source-date** rules as A1.
- Graceful empty-state when no market data is available for the segment.

**4. Verify (→ Researcher).** Same as A1 (no new facts).

---

## Cross-cutting notes for the pod

- **Single source of truth for the market read:** A1 computes it; A2, I3, I4, J4
  consume it. Avoid divergent classifications.
- **Data flow is the recurring engineering ask:** Comps Worksheet → Offer Builder
  (A2), Inspection → Repair/Negotiation (I2), Needs worksheet → Tour Scorecard
  (A7), Disclosure/HOA → Contacts/questions (A4/A5/A6). These seams are where the
  "agent value" actually lands.
- **Researcher hot list (most load-bearing facts to source & date):** NAR
  settlement terms/date (J1); buyer-compensation-negotiable claim (J1/J2);
  seller-credit caps by loan type/LTV (J2); states restricting escalation clauses
  (A3); caveat-emptor / minimal-disclosure states + federal lead-paint + flood
  (A5); dual-agency prohibition states (I1); HOA review/cancellation-period states
  & warrantability (A6); non-disclosure states (I3); appraiser net/gross adjustment
  caps (I4); months-of-supply market bands (A1); NAR Clear Cooperation status (A9).
- **Legal sign-off recommended** specifically on: A2 (most directive-prone), A3
  (waiver/escalation modeling), A5/A6 (disclosure interpretation boundary), J1/J2
  (factual + UDAP), A7 (FHA criteria neutrality).
