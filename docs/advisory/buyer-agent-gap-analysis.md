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

> 📘 **New in this version:** every point now has an indented **"In plain English"**
> note so you don't need to be a real-estate pro to follow it, plus a jargon key
> right below.

> **Scope guardrails.** Nothing here asks the product to give legal advice or to
> tell a buyer *which* contingency to waive or *what* to offer as a directive
> (UPL gate). Recommendations stay educational: surface the same **facts, market
> context, and trade-offs** a good agent would walk a buyer through, and let the
> buyer (with their attorney) decide. All copy stays inside the FHA gate (no
> protected-class signals, no "love-letter" appeals).

---

## 0. Plain-English key to the jargon

A quick decoder for the terms used below and in the table.

- **Buyer's agent** — a real-estate agent who works for the *buyer* (the home
  shopper). This whole product exists for people choosing **not** to hire one.
- **Listing agent / seller's agent** — the agent who works for the *seller*.
- **Comps (comparables)** — recently sold, similar nearby homes used to judge
  what a house is really worth.
- **CMA (comparative market analysis)** — an agent's mini-report that uses comps
  to estimate a fair price. The site's "Comps Worksheet" is a DIY version.
- **Contingency** — an escape hatch written into the offer ("I can back out and
  keep my deposit if X happens") — e.g., the inspection, appraisal, or loan
  falls through. **Contingency removal** = giving up that escape hatch by a
  deadline.
- **Earnest money (EM)** — a good-faith deposit (often 1–3% of price) that shows
  you're serious; it's held by a neutral party and applied at closing.
- **Appraisal** — the bank's independent valuation of the home. **Appraisal gap**
  = when the bank values it for *less* than you agreed to pay, so you'd need extra
  cash to cover the difference.
- **Escalation clause** — a line in an offer that says "I'll automatically beat
  competing offers by $X, up to a maximum of $Y."
- **Days on market (DOM)** — how long a home's been for sale. **List-to-sale
  ratio** = sale price ÷ asking price (over 100% means homes sell for *above*
  ask — a hot market).
- **Dual agency** — one agent representing *both* buyer and seller; a conflict of
  interest, and banned in some states.
- **Owner's title insurance** — protects you if someone later claims they own (or
  have a lien on) the home you bought.
- **HOA** — a homeowners/condo association with rules and dues; it hands over a
  packet of finances and rules to review before you buy.
- **NAR settlement (2024)** — a legal change to how buyer's agents get paid; the
  reason capturing the commission is no longer automatic.
- **UPL / Fair Housing** — see §6 (the legal lines we must not cross).

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

> _In plain English:_ The site is great at **walking you through the steps and
> the paperwork** (especially making the offer, the inspection, and the closing).
> Where it falls short is the stuff a good agent does from **experience and local
> knowledge** — telling you if it's a good time to buy here, what to actually
> offer, how to win against other buyers, keeping all the people organized, and
> reading the documents the seller gives you.

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
> _In plain English:_ Tell the buyer whether homes around here are **flying off
> the shelf or sitting unsold** — so they know whether to bid high and fast, or
> take their time and negotiate. Right now the site says nothing about this.

### A2 — "What should I offer?" bridge (comps + market → price range) **[P0]**
Today the **Comps Worksheet** produces a fair-value range and the **Offer
Builder** has an offer-strength indicator, but they're disconnected. Add a step
that carries the comps fair-value range **and** the market read (A1) into the
offer as a **suggested price band with rationale** ("comps say $380–410k; hot
market → top of range"). Keep it educational (a range + the reasoning, not a
directive number), preserving the UPL line.
> _In plain English:_ The site already estimates what a home is worth and rates
> how strong your offer is — but those two screens don't talk to each other.
> Connect them so the buyer sees a **suggested price range and the reason why**
> (e.g., "similar homes sold for $380–410k, and it's a hot market, so aim near
> the top").

### A3 — Competitive-offer tactics: escalation clause, appraisal-gap, multiple-offer **[P1]**
In hot markets an agent's edge is structuring a winning offer. Add:
- an **escalation-clause modeler** ("beat competing offers by $X up to a $Y cap")
  with a plain explanation of the risk and that some sellers/states disallow them;
- an **appraisal-gap coverage** helper *at offer time* (distinct from the
  post-appraisal Clear-to-Close calc) — how much gap to cover and the cash impact;
- a short **multiple-offer / bidding-war playbook** (EM sizing, terms beyond
  price, deadlines, "highest & best").
> _In plain English:_ When several people want the same house, *how* you write
> the offer matters as much as the price. Give buyers the common winning moves:
> automatically out-bidding rivals up to a set limit, offering to cover the gap if
> the bank's valuation comes in low, and a short guide for bidding wars.

### A4 — Transaction contacts / "who's who" hub **[P1]**
A buyer's agent is the switchboard. Buyers going solo lose track of who to call.
Add a per-deal **Contacts** card (on `/dashboard` and the tracker): loan officer,
escrow/title officer, closing attorney, inspector, listing agent, insurance
agent — name, role, phone, email — with the wire-fraud reminder attached to the
escrow contact. Pure organization; no advice.
> _In plain English:_ An agent keeps everyone's phone numbers and chases people
> down. Without one, the buyer is juggling a lender, a title company, an
> inspector, an attorney… Give them **one place to store who's who** for this
> deal.

### A5 — Seller-disclosure review worksheet **[P1]**
Agents read disclosures for red flags. Stage 3b explains them; turn it into a
**checklist tool** that, given the state's disclosure regime (already in the
state engine), prompts the buyer through the common red-flag categories (water/
roof/foundation, prior repairs, deaths-where-required, HOA, environmental) and
logs questions to ask — facts only, "have your attorney/inspector confirm."
> _In plain English:_ Sellers must hand over a form listing problems they know
> about. Agents read it carefully for warning signs. Turn that into a **checklist**
> so buyers know what to look for and what questions to ask.

### A6 — HOA / condo document review checklist **[P2]**
Flagged as a task but unsupported. Add a checklist for the HOA/condo packet
(budget & reserves, special assessments, rules/CC&Rs, litigation, rental caps,
insurance) so condo/HOA buyers don't miss what an agent would flag.
> _In plain English:_ If the home is a condo or in a homeowners association,
> there's a packet of rules and finances to read — *Are big repair bills coming?
> Can I rent it out? Are there lawsuits?* Give buyers a checklist so they don't
> miss anything.

### A7 — Needs-assessment / criteria worksheet **[P2]**
Make Stage 3 concrete: a **must-haves vs. nice-to-haves vs. deal-breakers**
worksheet (beds/baths, commute, budget ceiling, condition tolerance) that seeds
the Tour Scorecard rubric and keeps the search disciplined.
> _In plain English:_ Before searching, write down what you **truly need vs. just
> want vs. absolutely won't accept** — so you don't fall for the wrong house. A
> simple worksheet keeps the hunt focused.

### A8 — Deadline reminders / calendar export **[P1]**
The tracker is excellent but **static** — with no account/email there's nothing
to *remind* the buyer (the thing agents do constantly). Add **`.ics` calendar
export** (and per-deadline "add to calendar") so contingency dates land in the
buyer's own calendar with alerts. Low-effort, high-value safety net.
> _In plain English:_ Once you're under contract there are hard deadlines, and
> missing one can cost you money or the house. The site **lists** them but can't
> **remind** you. Let buyers push those dates into their **phone calendar** so they
> get alerts.

### A9 — Listing-alert & access guide **[P1]**
Acknowledge the MLS gap honestly: a short guide to setting **saved-search
alerts** on the major portals, watching **coming-soon/off-market**, and the
reality that buyers can't see true MLS-only or pocket listings. Pair with showing
**access** guidance (A-improve below).
> _In plain English:_ Agents get early access to listings and instant alerts.
> Buyers can't fully match that, but we can **show them how to set up alerts** on
> Zillow/Redfin and be honest about what they might miss.

---

## 3. Gaps to IMPROVE (capability exists but is thin)

### I1 — Showings: access reality + scripts when agents won't show **[P1]**
The showings tooling assumes a listing agent will schedule with an unrepresented
buyer. In practice some won't, or will try to convert the buyer to dual agency.
Add: scripts/fallbacks (open houses, requesting the listing agent vs. a showing
service, "I have my own attorney"), a **dual-agency caution** (the state engine
already knows where it's allowed), and a quick **in-person tour checklist** (what
to look at, photos to take) that feeds the Tour Scorecard.
> _In plain English:_ Some seller's agents won't show a home to a buyer who has
> no agent — or will try to represent **both** sides (a conflict of interest).
> Give buyers ready-made wording to get in the door, a heads-up about that
> conflict, and a checklist of what to look at on a tour.

### I2 — Negotiation playbook depth **[P1]**
Counter-offer Tracker records rounds but offers little *strategy*. Add an
educational **playbook**: how to read a counter, anchoring, concessions beyond
price (rent-back, closing date, as-is, EM), repair-negotiation leverage from the
inspection summary, and **walk-away discipline** (tie to the private walk-away
max the Counter-offer Tracker already stores).
> _In plain English:_ Once the seller responds to your offer, what do you do?
> Give plain guidance on **how to counter**, what to ask for besides price (like a
> later move-out date or repairs), and **when to walk away**.

### I3 — Pre-offer due diligence on the property **[P2]**
Before an agent lets a buyer offer, they pull **price history, days on market,
prior listings, and "why are they selling."** Add a light pre-offer checklist /
fields (last sold, price changes, DOM, seller motivation if known) so the buyer
walks in informed — surfaced on the listing detail and offer builder.
> _In plain English:_ Before offering, agents check **how long it's been listed,
> whether the price has dropped, and why the owner is selling**. Add a quick
> checklist so buyers go in with that context (and more bargaining power).

### I4 — Make comps adjustments more guided **[P2]**
The Comps Worksheet supports adjustments; add **suggested adjustment prompts**
(condition, sqft, garage, lot, recency) so a first-timer adjusts like an agent
would, with the methodology explained.
> _In plain English:_ Comparing homes isn't apples-to-apples — one has a garage,
> one's bigger, one sold a year ago. Agents adjust for those differences. Add
> **prompts that walk a first-timer through** making those adjustments.

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
> _In plain English:_ A 2024 legal change means if you **do** use an agent, you
> now sign a contract with them first, and the seller won't always pay them. The
> site cheers going **without** an agent — but should also honestly say **when
> it's smart to hire one** (tricky title, unusual loans, intense bidding wars).

### J2 — Make the savings story conditional, not assumed **[P0-framing]**
The Savings Calculator frames ~2.5% as capturable. In reality the seller may
**not** be offering buyer-side compensation, or it varies — the buyer captures it
only by negotiating it as a price reduction/credit, *and* the lender's
seller-credit caps apply. The tool already nods to this; tighten the copy so the
savings read as **"up to ~2.5%, if you ask and the deal allows,"** to avoid
over-promising (also reduces FHA/UDAP risk).
> _In plain English:_ The "save ~2.5%" message assumes the seller is offering to
> pay a buyer's agent — which isn't always true. Soften it to **"up to ~2.5%, if
> you ask and the deal allows"** so we don't over-promise.

### J3 — Set expectations on the listings browser **[P2]**
`/listings` is a starter stub, not a search engine. Label it plainly as a
shortlist/demo and route serious search to the portals (ties to A9) so buyers
aren't misled about coverage.
> _In plain English:_ The site's home-search page is just a **small demo**, not a
> full search engine. Say so plainly and point buyers to the big sites (Zillow,
> Redfin, Realtor.com) for real searching.

### J4 — Surface market data buyer-side, not just for comps **[P2]**
If/when RentCast (or another source) provides market stats, surface the
**buyer-facing** read (A1) prominently, not buried in a comps connector — it's
the context for every offer decision.
> _In plain English:_ If we have market statistics, show them **front-and-center**
> to the buyer instead of hiding them inside a tool — because that context shapes
> every offer decision.

---

## 5. Prioritized roadmap

> _In plain English:_ **P0** = do first (the most important missing pieces).
> **P1** = high value, do next. **P2** = nice polish for later.

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

- **UPL (unauthorized practice of law):** surface facts, ranges, market context,
  and trade-offs — never a directive ("offer $X", "waive the inspection"). Keep
  "have your attorney review" on anything contractual. The escalation/appraisal-gap/
  disclosure tools must *explain and model*, not *advise*.
  > _In plain English:_ We can **teach and organize**, but we can't act like your
  > lawyer telling you what to do. Show options and trade-offs; let the buyer and
  > their attorney decide.
- **Fair Housing:** market, school, and neighborhood data must be presented
  neutrally and never used to steer toward/away from protected classes; no
  demographic targeting; no buyer "love letters."
  > _In plain English:_ Anti-discrimination law. Our content must stay neutral and
  > never nudge people by race, religion, family status, etc. — and we don't help
  > write personal "please pick me" letters to sellers (they invite bias).
- **Accuracy:** the post-NAR buyer-agreement and compensation facts (J1/J2) and
  any market stats should cite their source and date, consistent with how the
  state engine and research docs already work.
  > _In plain English:_ When we state a fact or a number, **say where it came from
  > and when** — so it stays trustworthy and up to date.

---

### One-line summary for the founders

> The transaction spine is solid. To truly stand in for a buyer's agent, the
> product most needs **market judgment** (is it a buyer's/seller's market, and
> what should I offer in it?), **competitive-offer tactics**, a **coordination
> hub** for the parties and deadlines, and **document-review** help (disclosures,
> HOA) — all delivered as education and trade-offs, never as advice.
>
> _In plain English:_ The site handles the **paperwork and steps** well. What it
> still needs is the **judgment and hand-holding** a good agent gives: *is now a
> good time to buy here, what should I offer, how do I win, who do I call, and
> what do these documents mean?*
