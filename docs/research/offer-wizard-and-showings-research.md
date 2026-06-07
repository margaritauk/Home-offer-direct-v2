# Research Brief: Offer Creation Wizard & Contacting Listing Agents / Showings

**Audience:** HomeOffer Direct scrum pod (backlog grounding)
**Prepared by:** Researcher
**Date:** 2026-06-07
**Scope:** Two new feature areas for an unrepresented US home buyer — (1) an Offer Creation Wizard and (2) Contacting Listing Agents & Scheduling Showings. Includes critical UPL and Fair Housing guardrails.

> **Existing product assumptions:** 14-stage guided journey (incl. "make-an-offer"), 50-state legal engine (attorney-vs-escrow, disclosures), pros directory (attorneys/inspectors/title), deadline tracker, mock listings search. Post-2024-NAR-settlement: buyer-agent commission is negotiable; a written buyer-agency agreement is required before an MLS agent tours a home with a buyer.

---

## Area 1 — Offer Creation Wizard (for an unrepresented buyer)

### 1.1 Anatomy of a residential purchase offer

A residential purchase offer/agreement is a binding contract once signed by both parties. Core fields the wizard must cover (educationally — see UPL section before generating):

- **Purchase price** and **earnest money deposit (EMD)** — good-faith deposit signaling seriousness, typically **1–3% of price**, often due within ~3 business days of acceptance and held in escrow; applied to down payment/closing costs at closing or refunded if a contingency is properly invoked.
- **Financing / loan terms** — loan type (conventional, FHA, VA), down-payment amount, and a **financing contingency** that protects the deposit if the buyer can't secure a mortgage.
- **Contingencies** (conditions that must be met or the buyer can exit and recover EMD):
  - **Inspection** — renegotiate or walk away if material defects found.
  - **Appraisal** — protects buyer if the home appraises below contract price (lender finances to appraised value, not the higher offer).
  - **Financing/mortgage** — protects deposit if loan falls through.
  - **Sale-of-home** — buyer's purchase conditioned on selling their current home (weakens an offer competitively).
  - **Title** — ensures clear, marketable title.
- **Contingency deadlines** — each contingency has a date/period; **missed deadlines are a top failure mode** and can forfeit rights or EMD. (Ties directly into our existing deadline tracker.)
- **Closing date**, **possession date** (often closing, but can differ — see rent-backs).
- **Included / excluded fixtures & personal property** — appliances, fixtures, window treatments, etc.
- **Who pays what** — closing costs, transfer/recording taxes, title insurance, escrow fees (allocation varies by state custom and is negotiable).
- **Post-settlement commission/concession ask** — post-NAR, an unrepresented buyer may ask the seller for a **seller concession** (closing-cost credit) in lieu of what would have been a buyer-agent commission; this is now an explicit negotiable line.

Sources: [Chase – Contingent offer](https://www.chase.com/personal/mortgage/education/buying-a-home/contingent-offer), [Chase – Earnest money](https://www.chase.com/personal/mortgage/education/financing-a-home/understanding-earnest-money), [National Residential Authority – Contingencies](https://nationalresidentialauthority.com/contingencies-in-home-purchase), [LegalShield – Home purchase agreement](https://www.legalshield.com/blog/home-purchase-agreement), [LegalClarity – CA Residential Purchase Agreement](https://legalclarity.org/the-california-residential-purchase-agreement-explained/).

### 1.2 Standard state purchase-agreement FORMS

- Most residential offers are written on **standardized forms published by the state/local REALTOR association or MLS** (e.g., the C.A.R. Residential Purchase Agreement in California). Some states' forms come from individual MLS associations rather than a state agency (e.g., Nevada).
- **Access for unrepresented buyers is limited:** the canonical association/MLS forms are generally **gated behind MLS/association membership**. An unrepresented buyer typically cannot pull the official current form.
- **Risk of off-channel forms:** offers written on outdated or non-compliant forms found online "are much more likely to be put aside by the seller," and may omit state-required terms.
- **Role of a real estate attorney:** In attorney-state transactions (our legal engine already classifies attorney-vs-escrow states), an attorney drafts/reviews the contract. A widely used safe-harbor practice is including an **attorney-review condition** — "subject to approval by each party's attorney" — which is exactly the kind of term our product can surface.

Sources: [NC REALTORS – Written buyer agreements & MLS policy](https://www.ncrealtors.org/question/written-buyer-agreements-and-new-mls-policy/), [CRES – Dangers of unrepresented buyers](https://www.cresinsurance.com/cres-risk-management-webinar-the-dangers-of-unrepresented-buyers/), [Illinois REALTORS – Avoiding UPL](https://www.illinoisrealtors.org/blog/hot-on-the-hotline-avoiding-the-unauthorized-practice-of-law/).

### 1.3 Advanced offer tactics & their risks

- **Escalation clause** — auto-raises the offer above competing bids up to a cap. *Helps* in multiple-offer situations; *backfires* by revealing the buyer's price ceiling and can trigger an appraisal gap. Drafting one is frequently cited as the **practice of law** (should come from the buyer's attorney).
- **Appraisal-gap coverage** — buyer commits to pay a set amount above appraised value if it comes in low (commonly **$5k–$25k or 2–5% of price**). *Helps* signal strength; *backfires* by requiring extra cash at closing. ~8–12% of appraisals came in below contract in 2025.
- **Contingency waivers** (appraisal/inspection/financing) — *helps* competitiveness (≈18% of buyers waived appraisal as of Dec 2024); *backfires* badly — waiving appraisal risks 100% of any gap; waiving inspection risks undiscovered defects.
- **Rent-back / post-settlement occupancy** — seller stays after closing. *Helps* win against sellers needing time; *backfires*: owner-occupancy loans (conventional/VA/FHA) generally require buyer possession **within 60 days** — longer rent-backs can be deemed loan fraud; insurance gaps (neither party's policy may cover a loss); damage/maintenance disputes; eviction risk if seller overstays. Needs a written possession agreement with term, rent, security/escrow, and maintenance terms.
- **"As-is" offers** — buyer accepts current condition; *helps* sellers feel protected; *backfires* if the buyer waives inspection alongside it (note: "as-is" does not by itself remove an inspection contingency unless waived).

Sources: [Homes.com – Escalation clause FAQ](https://www.homes.com/learn/escalation-clause-faq/), [Nestfully – Escalation clauses & offer tactics](https://www.nestfully.com/blog/escalation-clauses-offer-tactics), [Max Real Estate Exposure – Appraisal gap](https://www.maxrealestateexposure.com/appraisal-gap/), [HomeLight – Waiving appraisal contingency](https://www.homelight.com/blog/buyer-appraisal-contingency/), [US News – Waiving appraisal](https://realestate.usnews.com/real-estate/articles/can-you-waive-an-appraisal-contingency), [Rocket Mortgage – Rent-back](https://www.rocketmortgage.com/learn/rent-back-agreement), [Wasserlaw – Post-closing possession](https://wasserlaw.net/wasserblawg/pros-and-cons-of-post-closing-possession-1).

### 1.4 Common mistakes unrepresented buyers make

- Using the **wrong / outdated form**; missing required terms; not understanding what they're agreeing to.
- **Missed deadlines** and unclear/expired contingencies (inspection, financing, appraisal).
- Not having **pre-approval / proof of funds** ready — reads as unserious.
- **Misreading representation** — assuming the listing agent will advise/advocate for them.
- **Buyer "love letters"** — overrated, and a Fair Housing liability (protected-class signals).
- Underestimating that a **clean, well-structured offer** can beat a higher messy one because it signals an easy close.

Sources: [Redfin – Unrepresented buyer guide](https://www.redfin.com/blog/how-to-buy-a-home-unrepresented/), [Clever – Make an offer without an agent](https://listwithclever.com/real-estate-blog/make-offer-on-house-without-realtor/), [CRES – Dangers of unrepresented buyers](https://www.cresinsurance.com/cres-risk-management-webinar-the-dangers-of-unrepresented-buyers/).

### 1.5 E-signature & delivery

- Offers are predominantly **signed and transmitted electronically** via DocuSign or Dotloop (DocuSign is NAR's official e-signature provider). E-signatures are legally binding (ESIGN/UETA); time-stamping and tracking are standard.
- The offer flows **buyer → listing agent → seller**; the listing agent presents it to the seller.
- Offers carry an **expiration/response clause, typically 24–72 hours**, after which the offer is void unless extended.

Sources: [Redfin – Who delivers your offer](https://www.redfin.com/blog/who-delivers-your-offer-to-the-seller/), [DocuSign – Real estate](https://www.docusign.com/en-ca/industries/real-estate), [NAR – DocuSign benefit](https://www.nar.realtor/realtor-benefits-program/technology/docusign).

### 1.6 CRITICAL GUARDRAIL — Unauthorized Practice of Law (UPL)

**The core legal risk for this feature.** Generating or filling a binding real-estate contract, *as advice*, can constitute UPL when done by a non-attorney/non-licensed party.

What the law treats as the practice of law vs. not:
- **Crosses into UPL:** drafting custom contract language/addendums, **making substantive contract changes**, selecting/modifying terms for the user's specific situation, and **drafting clauses such as escalation clauses** — repeatedly cited as the practice of law that "should only be done by the client's attorney." Even licensed brokers are limited to filling **business/factual blanks** on a commonly-used community form.
- **Software safe harbor (precedent):** Following years of LegalZoom litigation (a "whack-a-mole" of state suits; mixed outcomes incl. a Missouri ruling that doc prep *could* be UPL), the **NC 2016 statute (H436)** established that "the practice of law does not include software that generates a legal document based on a user's response to legal questions" — **but only with conditions**: annual registration, **a licensed in-state attorney must review each blank template**, attorney name/address kept on file and disclosed on request, a conspicuous **consumer satisfaction process**, and UPL complaints referred to the state bar. Other states vary; there is no national rule.

**What a software product can safely do (educational, non-advice):**
- Educational worksheets and **term explainers** ("what is an appraisal contingency").
- A neutral **offer summary / term sheet** the buyer hands to their own attorney or licensed party.
- Links to **official state/association forms** and direction to obtain the canonical form.
- Surfacing the **attorney-review condition** and routing to our pros directory (attorneys) — especially in attorney-states per our legal engine.
- Generic, non-personalized **information** about tactics and their risks.

**What likely crosses the line / needs an attorney or licensed party:**
- Auto-generating a **completed, ready-to-sign purchase contract** tailored to the user's deal.
- Recommending **which** contingencies to waive or **what** escalation cap to use ("apply specific law to facts").
- Drafting custom clauses/addendums.

Sources: [Georgetown – UPL claims against LegalZoom (PDF)](https://www.law.georgetown.edu/legal-ethics-journal/wp-content/uploads/sites/24/2019/11/GT-GJLE190045.pdf), [Bloomberg Law – NC law regulates interactive legal doc providers](https://news.bloomberglaw.com/legal-ethics/nc-law-regulates-interactive-legal-doc-providers), [UNC SOG – H436 bill summary](https://lrs.sog.unc.edu/lrs-subscr-view/bills_summaries/155096/H436), [Illinois REALTORS – Avoiding UPL](https://www.illinoisrealtors.org/blog/hot-on-the-hotline-avoiding-the-unauthorized-practice-of-law/), [NY DOS – Brokers & UPL memo](https://dos.ny.gov/legal-memorandum-li04-real-estate-brokers-and-salespersons-and-unauthorized-practice-law).

---

## Area 2 — Contacting Listing Agents & Scheduling Showings (unrepresented buyer)

### 2.1 Post-NAR-settlement dynamics & agency

- Post-settlement, **more unrepresented buyers contact listing agents directly** and attend open houses (since touring with an MLS agent now requires a signed buyer-agency agreement first).
- **Dual agency** = one agent (or one person) represents both sides. **Designated agency** = same brokerage, but a different designated agent for each party. **Transaction brokerage** = a non-fiduciary facilitator.
- **States banning dual agency** (per industry roundups): **Alaska, Colorado, Florida, Kansas, Maryland, Texas, Vermont, Wyoming**; **Oklahoma** banned it (2000) and has no designated representation (transaction broker or single agency only). *Florida uses transaction brokerage instead of dual/designated agency.* (Treat exact lists as needing legal-engine verification per state.)
- **Listing agent's duties to an unrepresented buyer:** loyalty/fiduciary duty stays with the **seller**. To the buyer (a "customer," not a client), the agent owes **honesty, fair dealing, and disclosure of material facts**, and may perform **ministerial acts** (answer factual questions about price/availability, host open houses, hand over disclosures) without creating an agency relationship. Agents are advised to give written notice that they do **not** represent the buyer and cannot advise them; many use a buyer non-agency acknowledgment.

Sources: [NAR – Settlement FAQs](https://www.nar.realtor/the-facts/nar-settlement-faqs), [NVAR – Dual/designated agency & unrepresented buyers](https://www.nvar.com/news/2024-08-16/walking-the-ethical-tightrope/), [HomeLight – Dual agency illegal in some states](https://www.homelight.com/blog/dual-agency-is-illegal-in-some-states/), [Quicken Loans – Dual agency illegal](https://www.quickenloans.com/learn/dual-agency-is-illegal-in-some-states), [LegalClarity – Duties to unrepresented buyer](https://legalclarity.org/what-duties-does-a-sellers-agent-owe-an-unrepresented-buyer/), [Tyler Law – Unrepresented buyers post-settlement](https://www.tylerlawllp.com/blog-posts/unrepresented-buyers-in-real-estate-what-agents-need-to-know-in-a-post-settlement-world).

### 2.2 How showings actually get requested today

- **ShowingTime** is the dominant MLS-integrated scheduling tool — but it **restricts requests to licensed agents**; each request is logged/verified. An unrepresented buyer generally **cannot self-serve through ShowingTime.**
- Practical channels for an unrepresented buyer: **calling/emailing the listing agent directly, attending open houses**, and (for flat-fee/FSBO listings) contacting the seller.
- **Lockbox norms:** lockboxes (with CBS codes for extra control) gate access to **authorized agents with confirmed appointments** — another reason direct buyer access is limited.
- **Info buyers should provide up front:** **mortgage pre-approval letter** (or **proof of funds** for cash). Agents/sellers increasingly require this before scheduling to screen out non-serious visitors and protect privacy.

Sources: [ShowingTime – Lockbox terms](https://www.showingtime.com/blog/lockbox-terms-you-should-know/), [SmartMLS – CBS code](https://showings.smartmls.com/hc/en-us/articles/13119900268315-CBS-code), [ListNow – ShowingTime for flat-fee MLS](https://listnowrealty.com/blog/showingtime-flat-fee-mls-florida-listing/).

### 2.3 Etiquette / strategy — what to disclose vs. withhold

Because the listing agent works for the **seller** and must relay material info to them:

- **Withhold:** maximum budget / true price ceiling, urgency or motivation/timeline, financial strength ("just got an inheritance," high income), and negotiation strategy — all can be used against the buyer.
- **Safe to share / provide:** pre-approval or proof of funds (signals seriousness without revealing the ceiling), factual questions about the property, requested disclosures.
- **Strategic questions to ask the listing agent:** seller's motivation for moving, days on market, number/strength of competing offers, recent repairs/upgrades, known issues, utility costs.

Sources: [CRES – Dangers of unrepresented buyers](https://www.cresinsurance.com/cres-risk-management-webinar-the-dangers-of-unrepresented-buyers/), [Robbie English – Pitfalls of unrepresented buyer](https://www.robbieenglish.com/blog/what-are-the-pitfalls-of-being-an-unrepresented-buyer/), [HomeLight – What to ask at an open house](https://www.homelight.com/blog/buyer-what-to-ask-during-an-open-house/), [Homebuyer.com – Questions to ask at an open house](https://homebuyer.com/learn/questions-to-ask-at-an-open-house).

### 2.4 Communication templates/scripts

Buyers commonly use short, factual scripts to (a) request a showing and (b) ask property questions. A safe template our product can ship (factual, no protected-class info, no negotiation tells):

> "Hi [Agent], I'm an unrepresented buyer interested in [address, MLS #]. I'm pre-approved (letter attached) / have proof of funds. Could we schedule a showing on [date/time options]? I'd also like a copy of the seller's disclosures. Thank you."

Question prompts to surface: days on market, competing offers, recent repairs/upgrades, known issues, what conveys (fixtures), utility costs, seller's preferred timeline.

Sources: [Homebuyer.com – Open house questions](https://homebuyer.com/learn/questions-to-ask-at-an-open-house), [Max Real Estate Exposure – Questions to ask the listing agent](https://www.maxrealestateexposure.com/questions-ask-listing-agent-at-open-house/).

### 2.5 Fair Housing Act considerations for messaging features

- The FHA prohibits **steering** and bias based on protected classes (race, color, religion, sex, national origin, familial status, disability).
- **Buyer "love letters"** are a documented FHA liability because they leak protected-class signals (photos, family/children, religion). **Oregon banned them in 2021** (sellers/agents may not accept/consider non-customary buyer communications).
- For our messaging features: templates and any AI-assisted drafting must **avoid soliciting or volunteering protected-class info**; school-quality discussion is a known proxy risk (stick to facts). Free-text fields should be nudged/filtered away from personal/family narrative.

Sources: [Fair Housing Institute – Steering](https://fairhousinginstitute.com/fair-housing-steering/), [UBalt Law Review – Love letters & FHA](https://ubaltlawreview.com/2022/03/19/better-left-unsent-real-estate-love-letters-and-fair-housing-violations/), [St. Louis REALTORS – Love letters & Fair Housing](https://www.stlrealtors.com/news/2021/06/30/industry-updates/buyer-love-letters-and-fair-housing/), [eCFR – 24 CFR Part 100](https://www.ecfr.gov/current/title-24/subtitle-B/chapter-I/part-100).

### 2.6 Product angles — buildable now vs. needs real data pipeline

- **Buildable now with mock data:** message-template library + safe scripts; an FHA-safe "question builder"; a per-listing and per-area **showing-request tracker** (status, dates, notes); a calendar/scheduling UI; checklists for what to bring (pre-approval/proof of funds); educational explainers on agency types keyed to state via our legal engine.
- **Needs the real data pipeline:** actual listing-agent contact info; live availability / real ShowingTime-style scheduling; sending real messages/offers; lockbox access. With mock listings we have **no real agent contact info**, so anything that *transmits* to a real agent is gated on the data/integration pipeline.

---

## Implications & guardrails for our product

**UPL (Offer Wizard) — do / don't:**
- DO: educational worksheets, term explainers, a neutral **offer summary/term sheet** to hand to an attorney, **links to official state/association forms**, and routing to our attorney pros directory.
- DO: surface the **"subject to attorney review"** condition, especially in attorney-states (use the existing legal engine to branch).
- DON'T: auto-generate a completed, ready-to-sign purchase contract tailored to the user.
- DON'T: recommend *which* contingencies to waive, *what* escalation cap to set, or draft custom clauses — that's applying law to facts.
- IF we ever generate document text: follow the **NC-style safe harbor** (clear "not legal advice" disclaimers, licensed-attorney template review, registration where required, consumer-complaint routing). Get counsel before shipping anything generative.

**Fair Housing (Showings/Messaging) — do / don't:**
- DO: templates that are factual and transaction-relevant only; nudge users toward pre-approval/proof-of-funds and property questions.
- DON'T: solicit or auto-populate protected-class info; discourage "love letters"; treat them as a liability (and note Oregon's ban).
- DON'T: let AI drafting or prompts introduce family/religion/race/school-quality narrative.

**Agency & disclosure (Showings):**
- Educate that the **listing agent represents the seller**; the buyer is a "customer" owed honesty/fairness/material-fact disclosure only.
- Warn users **not to disclose** budget ceiling, urgency, or financial strength to the listing agent.
- Branch on **state agency rules** (dual-agency bans, transaction brokerage) via the legal engine; verify the per-state list against an authoritative source before relying on it.

**Mock-data reality:**
- Buildable now: templates, FHA-safe question builder, showing-request tracker (per-listing/per-area), calendar UI, checklists, agency explainers, offer term-sheet export.
- Gated on real pipeline: agent contact info, live scheduling/ShowingTime, sending real offers/messages, lockbox access.

**Offer mechanics to wire into existing features:**
- Map all contingency deadlines + the 24–72h **offer-expiration** clock into the **deadline tracker**.
- Surface e-sign/delivery education (DocuSign-style, buyer→listing agent→seller, 24–72h response window) without us acting as the transmitting party until the data pipeline exists.
