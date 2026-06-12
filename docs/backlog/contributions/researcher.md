# Backlog grounding — evidence for the buyer's-agent gap items

_Contributor: Researcher · Backlog grounding · 2026-06-12_

Evidence base for the items in `docs/advisory/buyer-agent-gap-analysis.md`. Each
item below carries the **sourced facts it needs to be buildable and accurate**,
the **data source we can wire to** (vs. what needs manual entry), and a
**confidence** flag. Sources are listed at the end and linked inline.

> **Confidence legend:** 🟢 high (well-established, multiply-sourced, stable) ·
> 🟡 medium (sourced but varies by state/market or changes over time — re-verify
> before shipping copy) · 🔴 low / volatile (cite a date, expect drift).

> **Re-use note.** The post-NAR facts, savings mechanics, and disclosure/state
> regimes were already grounded in `docs/research/market-research.md` (§2, §4)
> and `docs/research/ai-offer-process-research.md` (Area 1). This brief does
> **not** repeat them in full — it pulls the load-bearing facts per item, adds
> the **market-stat metric definitions + thresholds** and the **RentCast wiring
> reality**, which were not previously written down.

---

## A1 — Market-conditions read (buyer's vs seller's market) **[P0]**

The item asserts four metrics translate into a buyer's/seller's-market read.
Here is each metric, its definition, a credible threshold band, and whether our
data seam can supply it.

### The four metrics, defined with thresholds

| Metric | Definition | Seller's market | Balanced | Buyer's market | Confidence |
|---|---|---|---|---|---|
| **Months of supply (MOS) / months of inventory** | Active listings ÷ homes-sold-per-month. "If no new homes listed, how long would current inventory last at the current sales pace." | **< ~4 mo** (tight; <3 mo very hot) | **~4–6 mo** | **> ~6 mo** | 🟢 |
| **Days on market (DOM)** | Days a listing is active before going under contract (median is more robust than mean). No fixed national cutoff — read **relative to local trend / typical**. Single-digit DOM = very hot; rising/long DOM = cooling/buyer leverage. | Low & falling (e.g. <2 wks) | Near local norm | High & rising | 🟡 (relative, not absolute) |
| **List-to-sale price ratio (sale ÷ list)** | Sale price ÷ final list price. **>100%** = homes selling **above** ask (competitive/hot); **~98–100%** = balanced; **<~97%** = buyers negotiating under ask. | >~100% | ~98–100% | <~97% | 🟡 |
| **Price trend** | Direction/velocity of median price (MoM / YoY). Rising = demand>supply (seller-leaning); flat/declining + rising inventory = buyer-leaning. Read **with** MOS, not alone. | Rising | Flat | Falling | 🟡 |

- **MOS is the primary, most-citable signal.** The 6-month buyer's-market /
  ~4-month seller's-market threshold is the long-standing NAR-derived convention
  echoed across brokerage sources ([Redfin — months of supply](https://www.redfin.com/definition/monthsof-supply),
  [Opendoor](https://www.opendoor.com/articles/buyers-vs-sellers-market-how-to-use-the-current-market-to-your-advantage),
  [HomeLight — seller's market](https://www.homelight.com/blog/what-is-a-sellers-market/)). 🟢
- DOM and list-to-sale are **relative** signals — best presented against the
  area's own typical/historical values, not a hard national number. The example
  copy in the item ("9 days at 102% of list — a hot seller's market") is
  directionally correct and FHA/UPL-safe as a *read*, not a directive. 🟡

### What RentCast can supply vs. what needs manual entry — the key finding

RentCast **does** have a market-statistics endpoint we have **not** wired yet
(the codebase only wires AVM/comps `…/v1/avm/value` and listings `…/v1/listings/sale`;
there is **no `/markets` call anywhere in `src/`**). Its `GET /v1/markets`
(a.k.a. "Market Statistics") returns **zip-code-level** aggregates, updated daily,
with **monthly historical snapshots** ([RentCast — Market Data reference](https://developers.rentcast.io/reference/market-data),
[RentCast — Sale Market Statistics release, Sep 2024](https://www.rentcast.io/blog/api-sale-market-statistics-new-data-points-queries)). It provides:

| Our A1 metric | RentCast `/markets` supplies it? | How |
|---|---|---|
| **Days on market** | ✅ **Directly** | avg/median/min/max DOM, incl. by property type and by bedroom count |
| **Inventory / listing counts** | ✅ **Directly** | total sale listings per month + **new** listings per month |
| **Price trend** | ✅ **Derivable** | avg/median **list** price + $/sqft, with monthly history → compute MoM/YoY |
| **Months of supply** | ⚠️ **Not direct — must derive** | Have inventory (numerator); **need a sold/closed-sales-per-month rate** (denominator) RentCast's market endpoint does not publish |
| **List-to-sale price ratio** | ❌ **Not available** | The endpoint reports **list-side** stats; it does **not** publish **sold/closing prices**, so sale÷list cannot be computed from it |

**Implication for the build:** RentCast market stats give us **DOM, inventory
volume, new-listing counts, and a list-price trend** out of the box (one new
connector behind the existing seam, reusing `RENTCAST_API_KEY`). **List-to-sale
ratio** and a true **months-of-supply** denominator are **not** in that feed —
treat them as **manual-entry fields** (buyer pulls from a Redfin/Realtor.com
market page) or as a later ATTOM/MLS upgrade that carries sold data. So A1 ships
as: pulled DOM + inventory + price-trend, **plus** optional manual list-to-sale /
MOS, with thresholds above. Confidence on the RentCast field availability: 🟢
(documented); on exact field names: 🟡 (verify against a live key — docs page
itself 403s to automated fetch).

---

## A2 — Comps + market → suggested price range **[P0]**

- **Comps fair-value range:** already produced by the Comps Worksheet (RentCast
  AVM `comparables`, mapped in `src/lib/tools/comps-source-rentcast.ts`). No new
  data needed — A2 is a **wiring/UX bridge**, not a new source.
- **The market modifier** comes from A1 (above). The defensible logic an agent
  uses, sourced: in a **hot/seller's market**, well-priced homes draw multiple
  offers within days and commonly sell **2–10% over ask**; in a **buyer's /
  long-DOM market**, longer time-on-market gives negotiating leverage and homes
  sell at/below ask ([offer-wizard research §1.1 inputs](../../research/ai-offer-process-research.md),
  [Slocum — 2025 bidding-war strategies](https://www.slocumhometeam.com/blog/how-to-win-a-bidding-war-homebuyer-strategies-2025)). 🟡 (market-dependent)
- **UPL line (must hold):** present a **range + the reasoning** ("comps say
  $380–410k; hot market → top of range"), never a single directive number. This
  is the exact line the CA DRE 2026 AI advisory and the offer-process brief draw
  between *educational decision-support* (safe) and *applying judgment to this
  deal* (brokerage/UPL) ([CA DRE AI advisory 2026](https://www.dre.ca.gov/Licensees/Advisories/Advisory_2026_03_17_AI_in_California_Real_Estate.html)). 🟢

---

## J1 — Post-NAR buyer-agency rules + when-to-go-solo **[P0]**

All facts below are accurate **as of the NAR settlement effective date,
Aug 17, 2024**, re-verified June 2026. Confidence 🟢 unless noted.

- **Written buyer-agency agreement required *before touring*.** Since Aug 17,
  2024, any buyer **working with an agent** (MLS-participant) must sign a written
  buyer-representation agreement **before** the agent tours a home with them.
  This is a rule about *using* an agent — it does **not** require a buyer to have
  an agent at all ([NAR settlement FAQs](https://www.nar.realtor/the-facts/nar-settlement-faqs),
  [NAR — Summary of 2024 MLS changes](https://www.nar.realtor/about-nar/policies/summary-of-2024-mls-changes)).
- **Compensation is negotiable, not fixed.** Buyer-agent compensation is
  negotiated **deal by deal**; "sellers always pay" is **no longer the default**
  ([NAR FAQs](https://www.nar.realtor/the-facts/nar-settlement-faqs)).
- **Seller-paid is not guaranteed; no MLS advertising of buyer-agent comp.**
  Offers of buyer-side compensation **can no longer be advertised on the MLS**;
  whether a seller offers a concession is per-deal ([NAR — 2024 MLS changes](https://www.nar.realtor/about-nar/policies/summary-of-2024-mls-changes)).
- **Reality check (accuracy guard for any copy that implies commissions fell):**
  one year on, buyer-agent commissions did **not** collapse — they averaged
  **~2.4–2.67%** in Q1–Q2 2025, near pre-settlement levels ([Redfin — Commissions Q2 2025](https://www.redfin.com/news/commissions-q2-2025/),
  [HousingWire](https://www.housingwire.com/articles/redfin-agent-commissions-q2-2025-post-nar-settlement/),
  [realestatenews.com](https://www.realestatenews.com/2025/08/16/after-a-year-of-nars-new-rules-commissions-are-up)). 🟡 (a moving number — cite the quarter)
- **Buying unrepresented is legal in all 50 states.** None require a buyer's
  agent; some require an **attorney at closing** (see J1 decision-aid + state
  list under A5/§4 of the market-research brief) ([Redfin — unrepresented buyer](https://www.redfin.com/blog/how-to-buy-a-home-unrepresented/)). 🟢
- **When-to-go-solo decision aid — evidence for the "bring in help" triggers**
  the item lists (complex title, unusual financing, hot multiple-offer markets,
  new construction, probate/short-sale): an **attorney review (~$500–$1,500
  flat)** neutralizes most of the agent-free legal risk, and **flat-fee /
  attorney-broker** hybrids (rebating most commission) are the documented middle
  ground; commission rebates are legal in ~40 states ([market-research §2](../../research/market-research.md),
  [FastExpert — risks of going without a realtor](https://www.fastexpert.com/blog/risks-of-buying-a-house-without-a-realtor/),
  [NPR — flat-fee brokers](https://www.npr.org/2025/05/21/nx-s1-5388943/real-estate-broker-fee-change)). 🟡 (rebate legality varies by state — branch on the state engine)

---

## J2 — Conditional commission-savings framing **[P0]**

- **The savings are real but NOT automatic.** Buyer-side commission ≈ **2.5% of
  price** (~$7.5k on $300k; ~$9.8k on a ~$368k median home). It only lands for an
  unrepresented buyer who **negotiates the unpaid buyer-side commission into a
  price reduction or seller credit** — otherwise the **seller keeps it**
  ([market-research §2 & §6](../../research/market-research.md),
  [Better — buying without a realtor](https://better.com/content/buying-house-without-realtor)). 🟢
- **Lender seller-credit caps apply** (the item asserts this — confirmed): seller
  concessions/credits are capped by loan type (conventional **3–9%** by
  down-payment, FHA **6%**, VA **4%**, USDA **6%**), and credits generally can't
  exceed actual closing costs. So "credit the whole 2.5%" may exceed the cap on a
  low-cost closing. 🟡 (cap percentages are stable but loan-type-specific — state
  them per loan type, not as one number). Sources:
  [Rocket Mortgage — seller concessions limits](https://www.rocketmortgage.com/learn/seller-concessions),
  [Bankrate — seller concessions](https://www.bankrate.com/mortgages/seller-concessions/).
- **Framing the item wants — "up to ~2.5%, if you ask and the deal allows"** is
  the accurate, over-promise-safe phrasing (avoids FHA/UDAP/UPL exposure). The
  conditionality has three gates: (1) seller actually offers/agrees, (2) it's
  structured as a price cut or credit to the buyer, (3) within lender credit
  caps. 🟢

---

## A3 — Escalation clause / appraisal-gap / multiple-offer **[P1]**

### Escalation clauses — legality & acceptance variance (the item's assertion, confirmed)

- **Legal in most states as ordinary contract law** (e.g. TX, CA, IL, MA), but
  **not uniformly endorsed**, and **a seller can simply reject** an offer that
  contains one (some prefer clean fixed-price offers) ([UpCounsel — escalation clause](https://www.upcounsel.com/escalation-clause),
  [Redfin — escalation clause](https://www.redfin.com/blog/what-is-an-escalation-clause/)). 🟢
- **State-specific cautions to surface (branch on the state engine):**
  - **Texas:** TREC restricts use — escalation clauses should be **attorney-drafted**
    (the standard TREC form has no escalation provision) ([Texas REALTORS — can you use escalation clauses](https://www.texasrealestate.com/members/posts/can-you-use-escalation-clauses/),
    [Spyglass — escalation clauses in TX](https://www.spyglassrealty.com/blog/escalation-clauses.html)). 🟡
  - **North Carolina:** the Real Estate Commission **discourages** them and warns
    of pitfalls ([NCREC — pitfalls of escalation clauses](https://bulletins.ncrec.gov/the-pitfalls-of-using-escalation-clauses-2/)). 🟡
- **UPL flag:** *drafting* the clause is practice of law (per the offer-process
  brief §1.2) — the tool may **model the math and explain the tradeoff** (it
  reveals your ceiling; can trigger an appraisal gap), but must **not draft the
  clause** or tell the buyer to use one. 🟢

### Appraisal-gap norms (numbers the modeler needs)

- An **appraisal-gap clause** = buyer commits to pay a set amount above appraised
  value if it comes in low. Competitive norms: **3–5%** to stay competitive in
  hot markets; **5–10%** often needed to win a bidding war ([offer-process research §1.1](../../research/ai-offer-process-research.md),
  [CUSO Home Lending — appraisal gaps 2025](https://cusohl.com/appraisal-gaps-in-2025-what-they-are-how-to-bridge-them/),
  [US News — appraisal gaps](https://realestate.usnews.com/real-estate/articles/everything-you-need-to-know-about-appraisal-gaps)). 🟡 (market-dependent)
- This is **distinct** from the post-appraisal Clear-to-Close low-appraisal calc
  the site already has — A3 models it **at offer time** (how much gap to commit,
  the cash impact). 🟢

### Multiple-offer / bidding-war playbook (sourced moves)

EM sizing (typ. **1–3%**, larger/partly-non-refundable signals commitment),
terms beyond price (flexible/quick close, seller-chosen possession, rent-back,
as-is), pre-approval > pre-qualification, and "highest & best" deadlines
([offer-process research §1.1](../../research/ai-offer-process-research.md),
[Slocum — win a bidding war 2025](https://www.slocumhometeam.com/blog/how-to-win-a-bidding-war-homebuyer-strategies-2025),
[Abrams — multiple offers 2025](https://www.abramshomes.com/blog/multiple-offers-in-2025-how-buyers-win-bidding-wars/)). 🟡

---

## A4 — Transaction contacts / who's-who hub **[P1]**

Pure organization, no facts to ground beyond the **role roster** an agent
quarterbacks (the item lists them; confirmed standard parties): **loan officer/
lender, escrow/title officer, closing attorney** (mandatory in attorney states —
see A5/§4), **home inspector, listing agent, insurance agent**, plus optionally
**appraiser** (lender-ordered) and **surveyor**. Attach the **wire-fraud
reminder** to the escrow/title contact — wire fraud on EM/closing funds is the
documented place self-serve buyers get burned ([market-research risk table](../../research/market-research.md)). 🟢

---

## A5 — Seller-disclosure review **[P1]**

The item wants the checklist to branch on **the state's disclosure regime**.
Sourced facts:

- **Regimes vary sharply — two poles:**
  - **Stringent / mandatory-form states** — e.g. **California's** Transfer
    Disclosure Statement (Civ. Code §1102 et seq.) is among the most demanding
    ([market-research §4](../../research/market-research.md)). 🟢
  - **Caveat emptor ("buyer beware") states** — sellers have **little/no
    affirmative duty** to disclose physical defects. The most-cited remaining
    caveat-emptor states are **Alabama, Arkansas, Virginia** (some lists add
    **Georgia, North Dakota, Wyoming**). Even there, exceptions apply: duty to
    disclose **health/safety** defects, where a **fiduciary** relationship
    exists, or on the buyer's **specific inquiry** ([HomeLight — mandated disclosures by state](https://www.homelight.com/blog/mandated-disclosures-real-estate/),
    [Nolo — Alabama disclosure obligations](https://www.nolo.com/legal-encyclopedia/alabama-home-sellers-your-disclosure-obligations.html),
    [GK Middleton — caveat emptor in Alabama](https://www.gkmiddletonlaw.com/blogs/to-disclose-or-not-to-disclose-caveat-emptor-in-alabama)). 🟡 (lists differ by source — present as "depends on your state," drive off the state engine; the **product takeaway** is the checklist must warn caveat-emptor-state buyers that *silence ≠ no defects, so inspect harder*.)
- **Common red-flag categories for the checklist** (item lists these; standard
  across disclosure forms): **water intrusion / roof / foundation/structural,
  prior repairs & permits, pest/termite, lead paint (federal — pre-1978 homes),
  environmental/flood, HOA, and deaths-on-property where the state requires it.**
  The **federal lead-based-paint disclosure** (pre-1978 housing) applies in
  **all** states regardless of regime ([HomeLight — mandated disclosures](https://www.homelight.com/blog/mandated-disclosures-real-estate/)). 🟢
- **UPL line:** facts/questions only — "have your attorney/inspector confirm."

---

## A8 — `.ics` deadline export **[P1]**

No legal facts to ground — purely a **technical standard**. The export format is
**iCalendar (RFC 5545)**, MIME type `text/calendar`, `.ics` extension; a `VEVENT`
with `DTSTART`/`DTEND` + `VALARM` for reminders is honored by Apple Calendar,
Google Calendar, and Outlook. A static client-side blob generator (no account,
no server) satisfies the item — confirming the "low-effort, high-value" claim.
Confidence 🟢. (Standard: [RFC 5545 — iCalendar](https://datatracker.ietf.org/doc/html/rfc5545).)

---

## A9 — Listing-alert / access guide + J3 listings labeling **[P1 / P2]**

- **The honest MLS gap (item's core claim, confirmed):** buyers **cannot** match
  agent access — true **MLS-only**, **office-exclusive/"pocket"**, and some
  **coming-soon** listings aren't fully visible on consumer portals. Post-NAR,
  NAR's **Clear Cooperation Policy** still governs off-MLS marketing (with a
  newer "delayed marketing exempt listings" option), so some inventory is
  genuinely gated. 🟡 (policy is evolving — cite as "as of 2026").
- **What we can honestly point buyers to:** saved-search **email/app alerts** on
  **Zillow, Redfin, Realtor.com**, and watching **coming-soon** sections. This
  is also the J3 fix: label `/listings` plainly as a **demo/shortlist** and route
  serious search to the portals ([market-research §5 competitor landscape](../../research/market-research.md)). 🟢
- **Our own `/listings` data:** the RentCast for-sale connector
  (`src/lib/listings/source-rentcast.ts`) is **wired but off by default** pending
  `RENTCAST_API_KEY` on deploy, and **RentCast does not license listing photos**
  (cards show SVG placeholders) — so it is genuinely a shortlist, not a
  portal replacement ([external-dependencies — live home feed](../../external-dependencies.md)). 🟢

---

## I1 — Showing access + dual agency **[P1]**

- **Dual agency** = one agent representing **both** buyer and seller; a conflict
  of interest, and **banned in several states** (commonly cited: **Colorado,
  Florida, Kansas, Oklahoma, Texas, Vermont, Wyoming, Alaska, Maryland** — lists
  vary; some permit a workaround like *designated/transaction* agency). Drive the
  caution off the **state engine** rather than a hardcoded list. 🟡 (state lists
  differ by source — verify per state before asserting "banned here"). Sources:
  general dual-agency overview via [Redfin — unrepresented buyer guide](https://www.redfin.com/blog/how-to-buy-a-home-unrepresented/)
  and the agency framing in the gap analysis §0.
- **Access reality (item's claim, confirmed):** some listing agents won't show to
  an unrepresented buyer or will try to convert them to dual agency. Documented
  fallbacks: **open houses**, requesting a **showing service** vs. the listing
  agent, and "I have my own attorney." This ties to the showings tooling and the
  flat-fee/limited-service option from J1 ([market-research risk table — access/showings](../../research/market-research.md)). 🟢

---

## I2 — Negotiation playbook **[P1]**

Educational, sourced from the offer-strength factor set: **anchoring/countering,
concessions beyond price** (rent-back, closing/possession date, as-is, EM size),
**repair-negotiation leverage** from the inspection summary, and **walk-away
discipline**. Longer-DOM / buyer's-market homes carry more buyer leverage (ties
to A1) ([offer-process research §1.1](../../research/ai-offer-process-research.md),
[market-research §1 step 6](../../research/market-research.md)). UPL line: explain
tactics + tradeoffs, never "counter at $X." 🟡 (market-dependent)

---

## A6 — HOA / condo document review **[P2]**

The item wants a checklist for the **HOA/condo packet ("resale package /
resale certificate")**. Confirmed standard contents — two parts:

1. **Resale certificate (property + association status):** any past-due dues,
   **pending/unpaid violations**, **unpaid special assessments**, fees due at
   closing, **pending litigation**, **reserve-fund balance**, and **planned
   capital expenditures**.
2. **Governing documents:** **CC&Rs / declaration, bylaws, articles of
   incorporation, rules/regulations**, plus commonly the **budget & financial
   statements, reserve study, recent board-meeting minutes, insurance (incl.
   D&O), and rental caps/leasing rules**.

The item's checklist categories (budget & reserves, special assessments,
rules/CC&Rs, litigation, rental caps, insurance) map **1:1** to these — all
confirmed present in a standard packet. **Contents and statutory delivery
requirements vary by state** (e.g. Washington/Virginia have specific
condo-resale-certificate statutes) — branch on the state engine where relevant.
Sources: [FirstService — HOA resale package](https://www.fsresidential.com/pennsylvania/news-events/articles/hoa-resale-package/),
[ClarkSimsonMiller — what an HOA resale package includes](https://clarksimsonmiller.com/hoa-resale-package/),
[Rexera — HOA resale package](https://rexera.com/blog/hoa-resale-package/). 🟢

---

## A7 — Needs-assessment / criteria worksheet **[P2]**

No external facts to ground — it's a **must-haves / nice-to-haves / deal-breakers**
worksheet (beds/baths, commute, budget ceiling, condition tolerance) that seeds
the existing Tour Scorecard. **FHA guard:** keep criteria **property/financial**,
never protected-class or "neighborhood fit / good schools" proxies that can
**steer** (HUD's 2024 FHA-and-AI guidance applies to how options are framed)
([offer-process research §1.3 — steering/FHA](../../research/ai-offer-process-research.md),
[HUD PR 24-098, May 2024](https://archives.hud.gov/news/2024/pr24-098.cfm)). 🟢

---

## I3 — Pre-offer due diligence **[P2]**

Fields an agent pulls before offering (item lists them, all standard): **last
sold price/date, price-change history, days on market, prior listings,
relisting, and seller motivation if known.** **DOM and listing/price history are
available from RentCast** (`daysOnMarket` is already mapped in both connectors;
price history would come from the listings endpoint or a market-stats pull) —
**seller motivation is not in any feed** (manual field). Longer DOM / price cuts
= documented buyer leverage ([market-research §1](../../research/market-research.md),
`src/lib/listings/source-rentcast.ts`). 🟢 / 🟡 (motivation = manual)

---

## I4 — Guided comp adjustments **[P2]**

The item wants **suggested adjustment prompts** (condition, sqft, garage, lot,
recency). This is **methodology, not new data** — it makes explicit the standard
appraisal **sales-comparison adjustment** approach (adjust each comp toward the
subject for differences; net the adjustments). Use a **$/sqft** basis for size
and qualitative bands for condition/features; **recency** matters because stale
sales need time-adjusting in a moving market (ties to A1 price-trend). Keep it
**educational** ("agents adjust like this"), not a directive valuation. The comps
themselves come from the existing RentCast AVM connector. 🟡 (no single
authoritative national table — present as method, with ranges, not fixed dollar
adjustments). Sources: general sales-comparison-approach framing,
[Nolo glossary](https://www.nolo.com/legal-encyclopedia/home-buying-lingo-36137.html);
methodology cross-referenced in [market-research §1](../../research/market-research.md).

---

## J4 — Surface market data buyer-side **[P2]**

No new facts — it's a **placement** decision: surface the A1 read **buyer-facing
and prominent**, not buried in a comps connector. Depends entirely on A1's data
(the new RentCast `/markets` connector above). 🟢

---

## Data-source wiring summary (for the engineers)

| Need | Source we can wire | Status / gap |
|---|---|---|
| DOM, inventory count, new listings, list-price trend (A1, I3, J4) | RentCast **`GET /v1/markets`** (zip-level, daily, monthly history) | **Not yet wired** — new connector behind the ADR-011 seam, reuses `RENTCAST_API_KEY`. Field names verify against a live key. |
| **List-to-sale ratio** (A1) | — | **No RentCast field** (list-side only). Manual entry or ATTOM/MLS upgrade. |
| **Months of supply** (A1) | RentCast inventory ✅ + **sold-rate denominator** ❌ | Numerator only. Denominator needs sold/closed-sales data (not in market endpoint). Manual or upgrade. |
| Comps fair-value range (A2, I4) | RentCast **AVM `/v1/avm/value`** `comparables` | **Wired** (`comps-source-rentcast.ts`). |
| For-sale listings, DOM, price (A9, I3) | RentCast **`/v1/listings/sale`** | **Wired but off** pending key; **no photos licensed**. |
| Seller motivation (I3) | — | **Manual field** — not in any feed. |
| State disclosure regime, dual-agency rules, attorney-state closing (A5, I1, J1) | **Existing 50-state legal engine** | In product — branch off it; don't hardcode lists. |
| Lender seller-credit caps (J2) | Static reference table (by loan type) | Build as content; cite per loan type. |

---

## Sources

**Market metrics / thresholds**
- [Redfin — Months of Supply (definition)](https://www.redfin.com/definition/monthsof-supply)
- [Opendoor — Buyer's vs Seller's Market](https://www.opendoor.com/articles/buyers-vs-sellers-market-how-to-use-the-current-market-to-your-advantage)
- [HomeLight — What is a Seller's Market](https://www.homelight.com/blog/what-is-a-sellers-market/)

**RentCast data**
- [RentCast — Market Data reference](https://developers.rentcast.io/reference/market-data)
- [RentCast — Market Statistics endpoint](https://developers.rentcast.io/reference/market-statistics)
- [RentCast — Sale Market Statistics release (Sep 2024)](https://www.rentcast.io/blog/api-sale-market-statistics-new-data-points-queries)
- Codebase: `src/lib/tools/comps-source-rentcast.ts`, `src/lib/listings/source-rentcast.ts`, `docs/external-dependencies.md`

**Post-NAR buyer agency / savings**
- [NAR — Settlement FAQs](https://www.nar.realtor/the-facts/nar-settlement-faqs)
- [NAR — Summary of 2024 MLS Changes](https://www.nar.realtor/about-nar/policies/summary-of-2024-mls-changes)
- [Redfin — Commissions Q2 2025](https://www.redfin.com/news/commissions-q2-2025/)
- [HousingWire — Agent Commissions Q2 2025](https://www.housingwire.com/articles/redfin-agent-commissions-q2-2025-post-nar-settlement/)
- [realestatenews.com — After a year, commissions are up](https://www.realestatenews.com/2025/08/16/after-a-year-of-nars-new-rules-commissions-are-up)
- [Redfin — Unrepresented Buyer Guide](https://www.redfin.com/blog/how-to-buy-a-home-unrepresented/)
- [Better — Buying a House Without a Realtor](https://better.com/content/buying-house-without-realtor)
- [FastExpert — Risks of Buying Without a Realtor](https://www.fastexpert.com/blog/risks-of-buying-a-house-without-a-realtor/)
- [NPR — Flat-fee brokers](https://www.npr.org/2025/05/21/nx-s1-5388943/real-estate-broker-fee-change)
- [Rocket Mortgage — Seller Concessions limits](https://www.rocketmortgage.com/learn/seller-concessions)
- [Bankrate — Seller Concessions](https://www.bankrate.com/mortgages/seller-concessions/)

**Escalation / appraisal-gap / multiple-offer**
- [UpCounsel — Escalation Clause](https://www.upcounsel.com/escalation-clause)
- [Redfin — What Is an Escalation Clause](https://www.redfin.com/blog/what-is-an-escalation-clause/)
- [Texas REALTORS — Can You Use Escalation Clauses](https://www.texasrealestate.com/members/posts/can-you-use-escalation-clauses/)
- [Spyglass — Escalation Clauses in Texas](https://www.spyglassrealty.com/blog/escalation-clauses.html)
- [NCREC — The Pitfalls of Using Escalation Clauses](https://bulletins.ncrec.gov/the-pitfalls-of-using-escalation-clauses-2/)
- [CUSO Home Lending — Appraisal Gaps 2025](https://cusohl.com/appraisal-gaps-in-2025-what-they-are-how-to-bridge-them/)
- [US News — Appraisal Gaps](https://realestate.usnews.com/real-estate/articles/everything-you-need-to-know-about-appraisal-gaps)
- [Slocum — Win a Bidding War 2025](https://www.slocumhometeam.com/blog/how-to-win-a-bidding-war-homebuyer-strategies-2025)
- [Abrams — Multiple Offers 2025](https://www.abramshomes.com/blog/multiple-offers-in-2025-how-buyers-win-bidding-wars/)

**Disclosures / HOA / state regimes**
- [HomeLight — Mandated Disclosures by State](https://www.homelight.com/blog/mandated-disclosures-real-estate/)
- [Nolo — Alabama Seller Disclosure Obligations](https://www.nolo.com/legal-encyclopedia/alabama-home-sellers-your-disclosure-obligations.html)
- [GK Middleton — Caveat Emptor in Alabama](https://www.gkmiddletonlaw.com/blogs/to-disclose-or-not-to-disclose-caveat-emptor-in-alabama)
- [FirstService — HOA Resale Package](https://www.fsresidential.com/pennsylvania/news-events/articles/hoa-resale-package/)
- [ClarkSimsonMiller — HOA Resale Package Contents](https://clarksimsonmiller.com/hoa-resale-package/)
- [Rexera — HOA Resale Package](https://rexera.com/blog/hoa-resale-package/)

**UPL / Fair Housing / standards**
- [CA DRE — AI in California Real Estate advisory (2026)](https://www.dre.ca.gov/Licensees/Advisories/Advisory_2026_03_17_AI_in_California_Real_Estate.html)
- [HUD — FHA guidance on AI (PR 24-098, May 2024)](https://archives.hud.gov/news/2024/pr24-098.cfm)
- [RFC 5545 — iCalendar](https://datatracker.ietf.org/doc/html/rfc5545)
- [Nolo — Home Buying Glossary](https://www.nolo.com/legal-encyclopedia/home-buying-lingo-36137.html)

**Internal briefs cross-referenced**
- `docs/research/market-research.md`
- `docs/research/ai-offer-process-research.md`
