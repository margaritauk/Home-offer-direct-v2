_Contributor: Marketing Analyst · Backlog grooming · 2026-06-12_

# Marketing lens on the buyer-agent gap backlog

Scope: GTM/messaging read on the items that move acquisition or conversion. For each I give (1) the funnel angle unlocked, (2) required copy/positioning + new SEO/content surfaces, (3) FHA/UDAP/UPL constraints as **acceptance criteria**, and (4) whether marketing copy is part of the item's Definition of Done (DoD).

Grounding: builds on `docs/marketing/marketing-analysis.md` (positioning "keep your commission," behavior-based ICP, SEO + 51-state-page flywheel) and the two gates — `docs/legal/fha-messaging-gate.md`, `docs/legal/upl-compliance-gate.md`. Live surfaces referenced: `src/app/states/[code]`, `src/app/tools/savings-calculator`, `src/components/savings-calculator.tsx`, `src/app/listings`.

---

## Biggest funnel impact (flagged)

- **A1 (market-conditions read)** — net-new top-of-funnel SEO engine. Highest acquisition leverage.
- **A2 ("what should I offer")** — strongest activation→conversion proof; the reason a buyer reaches the offer builder (our north-star surface).
- **J2 (conditional savings)** — touches the headline claim on every landing page and the hero tool. Highest blast radius; UDAP-critical.
- **J1 (when-to-go-solo)** — trust/credibility unlock that *raises* conversion by removing the "is this a scam / am I being reckless?" objection.

These four are the marketing-critical set. The rest are supporting content surfaces or have copy implications but smaller funnel impact.

---

## P0 items

### A1 — Market-conditions read  ·  **highest acquisition impact · copy is part of DoD**
1. **Angle.** Unlocks the single most-searched buyer question and a programmatic content surface: *"is it a buyer's or seller's market in <city/state>?"* Pairs perfectly with the existing 51-state-page flywheel — extends it from legal/process pages into high-volume market-intent queries. Strong link-bait and a credibility proof ("HomeOffer Direct tells me what an agent would about my market").
2. **Copy / surfaces.**
   - New SEO surface: per-area market read — ideally `/market/<state>` and, where data allows, `/market/<state>/<city>`, interlinked from the state pages and the comps/offer tools. Templated title/meta: "Buyer's or seller's market in {City}? DOM, list-to-sale & inventory (2026)."
   - Plain-English output band reused inside comps + offer builder (the in-app version of the same module).
   - Cornerstone explainer: "How to tell if it's a buyer's or seller's market (and what to do about it)" routing to the tool → savings calculator.
3. **Compliance (acceptance criteria).**
   - **FHA:** market/neighborhood data must be presented **neutrally and non-steering** — DOM, list-to-sale, inventory, price trend only. **No** school-quality scoring, crime, demographic, "good/bad area," "family-friendly," or any signal that proxies a protected class. Banner: market stats describe price dynamics, not desirability of who lives there.
   - **Accuracy/UDAP:** every stat **cites source + as-of date** (matches state-engine/research-doc convention). No invented data when the RentCast seam is empty — show "not available for this area," never a guess.
   - **UPL:** translate to context, not a directive ("hot market → expect to offer at/above ask"), never "offer $X."
4. **DoD:** Yes — ships with the per-area page copy, meta/structured-data, and the neutral-data disclaimer, or it can't go live as a public surface.

### A2 — Comps + market → suggested price range  ·  **strongest conversion proof · copy is part of DoD**
1. **Angle.** This is the "money moment" demo — the answer to *"what should I offer?"* It's the highest-converting content hook (screenshots/video of comps+market → a reasoned range) and the bridge that pulls calculator/comps users into the **offer builder**, our north-star conversion surface. Best single piece of conversion proof we have.
2. **Copy / surfaces.**
   - In-tool: suggested **price band with rationale** ("comps say $380–410k; hot market → top of range"). Copy must read as a worksheet output, not advice.
   - Content: "What should I offer on a house? A comps + market walkthrough" + short-form/YouTube ("watch the tool suggest a range") — ties to the existing video pillar.
3. **Compliance (acceptance criteria).**
   - **UPL (hard):** present a **range + reasoning**, never a single directive number; retain "worksheet — adapt with your attorney" framing already enforced in `src/lib/offer/term-sheet.ts`. Verb choice: "comps suggest," "buyers in hot markets often," never "you should offer."
   - **Accuracy:** range provenance shown (which comps, which market read, as-of date).
4. **DoD:** Yes — the rationale microcopy and the UPL framing ARE the feature; sign off as DoD, not a follow-up.

### J1 — When-to-go-solo + post-NAR framing  ·  **trust → conversion · copy IS the item**
1. **Angle.** Counter-intuitively a conversion lever: honestly saying *when to hire help* defuses the top objection to a DIY product ("am I being reckless?") and builds the "honest and on your side" pillar. Also strong SEO for post-NAR queries ("do I need a buyer's agent after the NAR settlement?", "buyer agency agreement 2024").
2. **Copy / surfaces.**
   - New evergreen: "Do you still need a buyer's agent? (post-NAR, 2024+)" + a balanced decision aid (where solo is reasonable vs. complex title / unusual financing / hot multiple-offer / new construction / probate-short-sale → bring an attorney or flat-fee agent). Routes to pro directory + savings calculator.
   - Positioning tweak across site: keep "keep your commission," but pair with "...and know when to bring in a pro" so the brand reads confident, not cavalier.
3. **Compliance (acceptance criteria).**
   - **Accuracy/UDAP:** state the post-NAR facts (written buyer-agency agreement before touring; buyer-side comp negotiable, not guaranteed seller-paid) with **source + date**. No "agents are unnecessary" overclaim.
   - **FHA/UPL:** neutral; "consult an attorney" for the stakes-are-high branches.
4. **DoD:** Yes — this item is essentially marketing/education copy; marketing owns the draft.

### J2 — Conditional savings framing  ·  **highest blast radius · UDAP-critical · copy IS the item**
1. **Angle.** Governs the headline claim ("keep your commission / ~$10k / 30× ROI") on every landing page, the hero savings calculator, and the offer builder's concession ask. Getting it credible *protects* conversion (over-promising erodes trust and invites UDAP exposure); honest conditional framing actually converts better with our finance-savvy ICP.
2. **Copy / positioning changes.**
   - Reframe the claim from assumed to conditional: **"keep up to ~2.5% — if you ask and the deal allows."** The calculator already supports this (capture-rate slider in `src/components/savings-calculator.tsx`, hint "0% = the seller keeps it"); extend the same hedge to **all** marketing headlines/meta/ads, not just the tool.
   - Surface the dependency chain in result copy: (a) seller may not offer buyer-side comp, (b) it's captured only as a price reduction/credit you negotiate, (c) lender **seller-credit caps** apply.
   - Keep a concrete number for SEO/hook power, but always bound it ("up to," "potential," "if negotiated").
3. **Compliance (acceptance criteria).**
   - **UDAP (FTC/state):** no unqualified/guaranteed-savings claim anywhere; the conditional qualifier must travel **with** the number (same line/screen, not a distant footnote). "Estimates only — not financial advice" already present (`savings-calculator.tsx`) — replicate on landing pages and ads.
   - **FHA:** unaffected, but the negotiation framing must not imply leverage tactics that touch protected-class appeals.
4. **DoD:** Yes — this is a copy/claims change; its DoD *is* the revised, qualified wording shipped across landing page + calculator result + any paid-ad copy.

---

## P1 items (copy implications)

### A9 — Listing-alert & access guide  ·  **content/SEO surface · copy is part of DoD**
- **Angle:** evergreen "how to set up home-search alerts on Zillow/Redfin/Realtor.com" captures high-intent search and honestly addresses the MLS gap (turns a weakness into helpful content).
- **Copy/compliance:** be explicit we don't provide MLS access; **no implied affiliation** with the portals (UDAP). Honest coverage statement.
- **DoD:** Yes — the item is guide copy.

### I1 — Showing access + scripts  ·  copy is part of DoD
- **Angle:** "how to tour a home without a buyer's agent" + dual-agency caution is a credibility/long-tail content play and reduces a real activation blocker.
- **Compliance (acceptance criteria):** scripts stay **facts-only** per FHA gate (no love-letter / protected-class appeals; the gate's `screenOutput`/template rules apply to any provided wording); dual-agency caution is education, **not legal advice** (UPL).
- **DoD:** Yes — the scripts are copy and must pass the FHA template rules before ship.

### I2 — Negotiation playbook  ·  copy is part of DoD
- **Angle:** "how to counter a seller / negotiation tactics" content hub; supports the conversion narrative.
- **Compliance:** educational trade-offs only, **no directive** ("ask for X," not "you should demand X") — UPL.
- **DoD:** Yes — playbook is educational copy; mark it DoD.

### A3 — Escalation / appraisal-gap / multiple-offer
- **Angle:** strong "win a bidding war without an agent" content, but secondary to A1/A2.
- **Compliance (acceptance criteria):** **model and explain, never recommend** which terms to use (UPL gate item #2 explicitly bars an escalation recommender); note some sellers/states disallow escalation. Modeler output framed as worksheet.
- **DoD:** Ship with explainer copy + the "not advice" framing; the tool itself is engineering.

### A4 contacts hub · A5 disclosure review · A8 .ics export
- Low direct funnel impact (utility/retention, not acquisition). Minor copy only.
- **A5 acceptance criteria:** "facts only — have your attorney/inspector confirm" (UPL); FHA-neutral red-flag categories. **A4/A8:** attach the existing wire-fraud reminder to the escrow contact / no protected-class fields (FHA gate item #1). **No** marketing copy needed in DoD.

---

## P2 items (brief)

- **J3 (listings labeling)** — *copy is the item.* Label `/listings` plainly as a shortlist/demo and route serious search to portals (ties to A9). UDAP: don't imply full-market coverage. Marketing owns the label copy.
- **J4 (buyer-side market data)** — surface A1's read prominently buyer-side; same FHA neutrality + source/date criteria as A1. Reinforces the A1 SEO surface.
- **A6 HOA/condo · A7 needs-assessment · I3 pre-offer diligence · I4 guided comp adjustments** — useful content fodder later (e.g., "HOA documents checklist," "comps adjustment guide"), but low immediate funnel impact. Educational/facts-only framing applies; no marketing copy in DoD.

---

## Cross-cutting acceptance criteria (apply to every public/market-data item)

1. **Neutral data only (FHA):** no school/crime/demographic/"desirability" signals on any market or neighborhood surface; price-dynamics facts only.
2. **Qualified claims (UDAP):** any savings/outcome number ships with its conditional qualifier on the same surface, plus "estimates only — not advice."
3. **Source + as-of date (accuracy):** every market stat and post-NAR fact is cited and dated.
4. **Education, not advice (UPL):** ranges/trade-offs, never directive numbers or "you should"; retain attorney-review framing.
5. **Gate pass before ship:** new copy runs through the FHA + UPL gates (launch DoD step in the marketing brief). Note both gates carry a **deferred external legal sign-off** — public claims surfaces (esp. J2) should not launch ahead of it.

## DoD ownership summary

Marketing copy is part of DoD for: **A1, A2, J1, J2** (P0), **A9, I1, I2** (P1), **J3** (P2). For A3 marketing supplies the explainer; A4/A5/A8/A6/A7/I3/I4/J4 need only compliance-framing review, not net-new marketing copy.
