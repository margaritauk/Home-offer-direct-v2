# Buyer's-Agent Gap Analysis — HomeOffer Direct

_Owner: Buyer's Agent Advisor · Status: v1 · Last updated: 2026-06-12_

**Who I am.** A licensed buyer's-agent perspective added to the scrum pod as a
domain advisor. My job: walk the product as if I were the buyer's agent the user
*doesn't* have, and outline what a buyer's agent typically does for a buyer — then
what HomeOffer Direct should **add, improve, or adjust** to stand in for that work.

**How I reviewed it.** I went through the 14-stage Journey end-to-end, all ~20
tools (`/tools/*`), the offer builder, the showings tracker, the comps worksheet,
the 50-state legal engine, the pro directory, the dashboard/binder, and the
glossary/trust/legal content. Findings below are mapped to those real surfaces.

> **Scope guardrails.** Nothing here asks the product to give legal advice or to
> tell a buyer *which* contingency to waive or *what* to offer as a directive
> (UPL gate). Recommendations stay educational: surface the same **facts, market
> context, and trade-offs** a good agent would walk a buyer through, and let the
> buyer (with their attorney) decide. All copy stays inside the FHA gate (no
> protected-class signals, no "love-letter" appeals).

---

## 1. What a buyer's agent actually does — and where the site already stands

A buyer's agent's job spans ~25 recurring tasks across four phases. The site is
genuinely strong on **process guidance, the offer worksheet, deadlines, and
state law**. Here's the honest map.

**Legend:** ✅ well covered · 🟡 partial · ❌ missing

| Buyer's-agent task | On HomeOffer Direct today | Status |
|--------------------|---------------------------|:---:|
| Explain the process & set expectations | The 14-stage Journey + glossary | ✅ |
| Buyer consultation / needs assessment | Stage 3 "define criteria" (prose only — no worksheet) | 🟡 |
| Get the buyer pre-approved; compare lenders | Budget calc, Lender Compare, pre-approval prep | ✅ |
| Set up MLS search + new-listing/off-market alerts | `/listings` is a stub; defers to Zillow/Redfin | 🟡 |
| Neighborhood & **market-temperature** read (buyer's vs seller's market, days-on-market, list-to-sale, inventory, school/area data) | Not surfaced anywhere | ❌ |
| Schedule & accompany showings; get access | Showings tracker, message composer, agency explainer | 🟡 |
| Run a **CMA** to price the offer | Comps Worksheet (manual + optional RentCast) | 🟡 |
| Advise offer **strategy** (price, EM, terms, contingencies) | Offer Builder (8-step) + Offer Help/Tactics | ✅ |
| Competitive tactics: escalation clause, appraisal-gap, multiple-offer | Offer Help mentions appraisal-gap; no escalation/multiple-offer modeling | 🟡 |
| Write & **present/submit** the offer to the listing side | Offer Builder term sheet; outreach templates | 🟡 |
| Negotiate counters (price, repairs, credits) | Counter-offer Tracker, Offer Status, tactics | 🟡 |
| Coordinate inspection; recommend inspectors | Inspection Findings, pro directory | ✅ |
| Negotiate inspection repairs/credits | Repair-Request Builder | ✅ |
| Manage appraisal & low-appraisal scenarios | Clear-to-Close & low-appraisal calc | ✅ |
| **Quarterback** all parties (lender, title, escrow, attorney, inspector) | Dashboard + tracker, but no contacts/parties hub | 🟡 |
| Title/escrow review; choose owner's title insurance | Stage 10 + state engine | ✅ |
| Review **HOA/condo** documents | Mentioned in a task; no checklist/tool | ❌ |
| Review the **seller's disclosures** for red flags | Stage 3b guidance + state engine; no review worksheet | 🟡 |
| Track deadlines / contingency removal proactively | Deadline & Document Tracker (static; no reminders) | 🟡 |
| Closing Disclosure review | CD Check tool | ✅ |
| Final walkthrough | Final Walkthrough checklist | ✅ |
| Closing / settlement | Closing Day checklist; wire-fraud guard | ✅ |
| Post-close (utilities, homestead, warranty, records) | Move-In checklist | ✅ |
| Vendor referrals | Pro directory (attorneys, inspectors, title/escrow) | ✅ |
| Fair-housing & wire-fraud protection | FHA gate + two wire-fraud callouts | ✅ |
| Advise **when to hire** a pro / the limits of going solo | Attorney review urged; no decision aid; post-NAR buyer-agreement reality not explained | 🟡 |

The pattern: the **transactional spine (offer → inspection → closing) is well
served**. The biggest missing pieces are the parts of an agent's job that are
**market judgment and coordination** — pricing in context, reading the market,
competitive-offer tactics, herding the parties, and reviewing the documents a
seller hands over.

---

## 2. Gaps to ADD (net-new capability)

Ordered by how much buyer-agent value they replace.

### A1 — Market-conditions read ("is this a buyer's or seller's market?") **[P0]**
The single most valuable thing an agent does that the site doesn't: calibrate
*how aggressive to be*. Add a **Market Conditions** module (a `/tools/market`
worksheet or a band on the comps/offer pages) that lets the buyer enter or pull
(via the existing RentCast seam) **days-on-market, list-to-sale-price ratio,
inventory/months-of-supply, and price-trend** for the area, and translates them
into a plain-English read: *"Homes here sell in 9 days at 102% of list — a hot
seller's market; expect to offer at/above ask with few contingencies."* This
feeds offer strategy (A2) and is the context every other recommendation needs.

### A2 — "What should I offer?" bridge (comps + market → price range) **[P0]**
Today the **Comps Worksheet** produces a fair-value range and the **Offer
Builder** has an offer-strength indicator, but they're disconnected. Add a step
that carries the comps fair-value range **and** the market read (A1) into the
offer as a **suggested price band with rationale** ("comps say $380–410k; hot
market → top of range"). Keep it educational (a range + the reasoning, not a
directive number), preserving the UPL line.

### A3 — Competitive-offer tactics: escalation clause, appraisal-gap, multiple-offer **[P1]**
In hot markets an agent's edge is structuring a winning offer. Add:
- an **escalation-clause modeler** ("beat competing offers by $X up to a $Y cap")
  with a plain explanation of the risk and that some sellers/states disallow them;
- an **appraisal-gap coverage** helper *at offer time* (distinct from the
  post-appraisal Clear-to-Close calc) — how much gap to cover and the cash impact;
- a short **multiple-offer / bidding-war playbook** (EM sizing, terms beyond
  price, deadlines, "highest & best").

### A4 — Transaction contacts / "who's who" hub **[P1]**
A buyer's agent is the switchboard. Buyers going solo lose track of who to call.
Add a per-deal **Contacts** card (on `/dashboard` and the tracker): loan officer,
escrow/title officer, closing attorney, inspector, listing agent, insurance
agent — name, role, phone, email — with the wire-fraud reminder attached to the
escrow contact. Pure organization; no advice.

### A5 — Seller-disclosure review worksheet **[P1]**
Agents read disclosures for red flags. Stage 3b explains them; turn it into a
**checklist tool** that, given the state's disclosure regime (already in the
state engine), prompts the buyer through the common red-flag categories (water/
roof/foundation, prior repairs, deaths-where-required, HOA, environmental) and
logs questions to ask — facts only, "have your attorney/inspector confirm."

### A6 — HOA / condo document review checklist **[P2]**
Flagged as a task but unsupported. Add a checklist for the HOA/condo packet
(budget & reserves, special assessments, rules/CC&Rs, litigation, rental caps,
insurance) so condo/HOA buyers don't miss what an agent would flag.

### A7 — Needs-assessment / criteria worksheet **[P2]**
Make Stage 3 concrete: a **must-haves vs. nice-to-haves vs. deal-breakers**
worksheet (beds/baths, commute, budget ceiling, condition tolerance) that seeds
the Tour Scorecard rubric and keeps the search disciplined.

### A8 — Deadline reminders / calendar export **[P1]**
The tracker is excellent but **static** — with no account/email there's nothing
to *remind* the buyer (the thing agents do constantly). Add **`.ics` calendar
export** (and per-deadline "add to calendar") so contingency dates land in the
buyer's own calendar with alerts. Low-effort, high-value safety net.

### A9 — Listing-alert & access guide **[P1]**
Acknowledge the MLS gap honestly: a short guide to setting **saved-search
alerts** on the major portals, watching **coming-soon/off-market**, and the
reality that buyers can't see true MLS-only or pocket listings. Pair with showing
**access** guidance (A-improve below).

---

## 3. Gaps to IMPROVE (capability exists but is thin)

### I1 — Showings: access reality + scripts when agents won't show **[P1]**
The showings tooling assumes a listing agent will schedule with an unrepresented
buyer. In practice some won't, or will try to convert the buyer to dual agency.
Add: scripts/fallbacks (open houses, requesting the listing agent vs. a showing
service, "I have my own attorney"), a **dual-agency caution** (the state engine
already knows where it's allowed), and a quick **in-person tour checklist** (what
to look at, photos to take) that feeds the Tour Scorecard.

### I2 — Negotiation playbook depth **[P1]**
Counter-offer Tracker records rounds but offers little *strategy*. Add an
educational **playbook**: how to read a counter, anchoring, concessions beyond
price (rent-back, closing date, as-is, EM), repair-negotiation leverage from the
inspection summary, and **walk-away discipline** (tie to the private walk-away
max the Counter-offer Tracker already stores).

### I3 — Pre-offer due diligence on the property **[P2]**
Before an agent lets a buyer offer, they pull **price history, days on market,
prior listings, and "why are they selling."** Add a light pre-offer checklist /
fields (last sold, price changes, DOM, seller motivation if known) so the buyer
walks in informed — surfaced on the listing detail and offer builder.

### I4 — Make comps adjustments more guided **[P2]**
The Comps Worksheet supports adjustments; add **suggested adjustment prompts**
(condition, sqft, garage, lot, recency) so a first-timer adjusts like an agent
would, with the methodology explained.

---

## 4. Things to ADJUST (framing/accuracy)

### J1 — Post-NAR buyer-agreement reality + a "should I go solo?" decision aid **[P0-framing]**
Since Aug 2024, a buyer who *uses* an agent must sign a **written buyer-agency
agreement** before touring — and buyer-side compensation is negotiable and not
guaranteed to be seller-paid. The site rightly champions going unrepresented, but
an honest agent also says **when to bring in help**. Add a short, balanced
**decision aid**: where self-representation is reasonable vs. where the stakes
(complex title, unusual financing, hot multiple-offer markets, new construction,
probate/short-sale) warrant an agent or a flat-fee/hourly attorney. This builds
trust and is good for conversion.

### J2 — Make the savings story conditional, not assumed **[P0-framing]**
The Savings Calculator frames ~2.5% as capturable. In reality the seller may
**not** be offering buyer-side compensation, or it varies — the buyer captures it
only by negotiating it as a price reduction/credit, *and* the lender's
seller-credit caps apply. The tool already nods to this; tighten the copy so the
savings read as **"up to ~2.5%, if you ask and the deal allows,"** to avoid
over-promising (also reduces FHA/UDAP risk).

### J3 — Set expectations on the listings browser **[P2]**
`/listings` is a starter stub, not a search engine. Label it plainly as a
shortlist/demo and route serious search to the portals (ties to A9) so buyers
aren't misled about coverage.

### J4 — Surface market data buyer-side, not just for comps **[P2]**
If/when RentCast (or another source) provides market stats, surface the
**buyer-facing** read (A1) prominently, not buried in a comps connector — it's
the context for every offer decision.

---

## 5. Prioritized roadmap

**P0 (do first — the core agent value missing):**
- A1 Market-conditions read · A2 "What should I offer?" bridge · J1 when-to-go-solo
  decision aid · J2 conditional-savings framing.

**P1 (high value, scoped):**
- A3 competitive-offer tactics · A4 contacts hub · A5 disclosure review · A8
  calendar export/reminders · A9 listing-alert/access guide · I1 showing access
  & scripts · I2 negotiation playbook.

**P2 (rounding out):**
- A6 HOA/condo review · A7 needs-assessment · I3 pre-offer due diligence · I4
  guided comp adjustments · J3 listings-stub labeling · J4 buyer-side market data.

---

## 6. Compliance notes (must hold for every item above)

- **UPL:** surface facts, ranges, market context, and trade-offs — never a
  directive ("offer $X", "waive the inspection"). Keep "have your attorney
  review" on anything contractual. The escalation/appraisal-gap/disclosure tools
  must *explain and model*, not *advise*.
- **Fair Housing:** market, school, and neighborhood data must be presented
  neutrally and never used to steer toward/away from protected classes; no
  demographic targeting; no buyer "love letters."
- **Accuracy:** the post-NAR buyer-agreement and compensation facts (J1/J2) and
  any market stats should cite their source and date, consistent with how the
  state engine and research docs already work.

---

### One-line summary for the founders

> The transaction spine is solid. To truly stand in for a buyer's agent, the
> product most needs **market judgment** (is it a buyer's/seller's market, and
> what should I offer in it?), **competitive-offer tactics**, a **coordination
> hub** for the parties and deadlines, and **document-review** help (disclosures,
> HOA) — all delivered as education and trade-offs, never as advice.
