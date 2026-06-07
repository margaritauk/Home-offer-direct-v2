# Research Brief: AI-Supported, Monetizable Offer Process

**Audience:** HomeOffer Direct scrum pod (backlog grounding for epic #10, Offer Creation Wizard expansion)
**Prepared by:** Researcher
**Date:** 2026-06-07
**Scope:** Expanding the Offer Creation Wizard into (1) AI offer recommendations, (2) state-specific contract auto-fill + e-signature + PDF export, (3) freemium monetization, and (4) a per-home progress dashboard — with crisp legal/compliance guardrails, because this pushes into risky territory.

> **Builds on** `docs/research/offer-wizard-and-showings-research.md` (the UPL safe-harbor, NC H436 model, Fair Housing / love-letter analysis, offer mechanics, e-sign basics). That brief is the foundation; this one does **not** repeat it — it deepens the AI, auto-fill/e-sign tooling, monetization, and dashboard layers, and extends the guardrails to AI-specific and charging-for-legal-docs risks.

> **Existing product context (given):** a guided journey, a 50-state legal engine, a pros directory, a deadline + document tracker, mock listings, an offer term-sheet wizard, and accounts/cloud sync.

---

## Area 1 — AI Offer Recommendations ("what makes an offer more/less likely to be accepted")

### 1.1 The real, evidence-based acceptance factors

Across lender and brokerage sources, the factors sellers actually weigh fall into a consistent, citable set. These are the inputs an AI "offer strength" feature would reason over:

- **Offer price vs. list price.** Well-priced homes draw multiple offers within days; in hot 2025 markets offers commonly came in **2–10% over asking**. Price matters but is repeatedly described as *not* sufficient alone — sellers weigh certainty and terms too.
- **Earnest money deposit (EMD).** Typically **1–3% of price**; a larger EMD (and making a portion non-refundable) signals commitment and strengthens an offer.
- **Contingency waivers.** Waiving inspection, appraisal, or financing contingencies makes an offer more attractive but carries large buyer risk; sources stress discussing the risk "at length" first. (Risk detail lives in the prior brief, §1.3.)
- **Cash vs. financed.** Cash is described as the strongest position (no lender, fast close). For financed buyers, the closest substitutes are a strong local lender (close in ~15 days), appraisal-gap coverage, and waived contingencies.
- **Pre-approval vs. pre-qualification / proof of funds.** A **pre-approval** (underwriter reviewed income/assets) materially beats a **pre-qualification** (no verification). Cash buyers should attach proof of funds.
- **Closing timeline & flexibility.** A quick close, or letting the seller choose the closing/move-out date, is repeatedly cited as a deciding factor when price is close.
- **Escalation clauses.** Auto-raise the bid above competing offers up to a cap; signals serious intent but reveals the ceiling and can trigger appraisal gaps. (Drafting one is flagged as practice-of-law — see §1.2 and prior brief.)
- **Appraisal-gap coverage.** Commit to pay a set amount above appraised value if it comes in low. **3–5%** to stay competitive in hot markets, **5–10%** often needed to win.
- **Seller concessions / rent-backs.** Flexible possession (rent-back) and concession structures can win against price. (Rent-back loan-fraud / insurance risks are in the prior brief, §1.3.)
- **Clean terms.** A clean, well-structured offer can beat a higher messy one because it signals an easy, certain close.
- **Market conditions / days on market (DOM).** Buyer-vs-seller market and DOM change the whole calculus; longer-DOM homes give negotiating leverage and need fewer aggressive terms.

Sources: [Legacy Mortgage – Waiving contingencies](https://www.legacymortgage.com/waiving-real-estate-contingencies), [Homes.com – Escalation clause FAQ](https://www.homes.com/learn/escalation-clause-faq/), [Sammamish Mortgage – Should you waive contingencies](https://www.sammamishmortgage.com/guide/buying-a-home/should-you-ever-waive-contingencies/), [Slocum Home Team – 21 strategies to win a bidding war 2025](https://www.slocumhometeam.com/blog/how-to-win-a-bidding-war-homebuyer-strategies-2025), [HousingWire – Compete with cash offers](https://www.housingwire.com/articles/compete-with-cash-offers/), [CUSO Home Lending – Appraisal gaps 2025](https://cusohl.com/appraisal-gaps-in-2025-what-they-are-how-to-bridge-them/), [Mortgage-Info – Appraisal gap coverage 2025](https://mortgage-info.com/blog/appraisal-gap-coverage-complete-guide-2025), [Abrams Homes – Multiple offers 2025](https://www.abramshomes.com/blog/multiple-offers-in-2025-how-buyers-win-bidding-wars/).

### 1.2 Compliance: is "do X to make your offer more likely accepted" advice brokerage activity, UPL, or permissible decision-support?

Three overlapping regimes apply. The line is **general/educational information (safe)** vs. **applying law or professional judgment to this user's specific deal (risky)**.

- **Real estate brokerage licensing.** Negotiating or advising on terms *on behalf of a party in a specific transaction* is licensed brokerage activity. General market education ("escalation clauses can help in a bidding war") is not. A feature that says, neutrally and generically, *what factors tend to strengthen offers* is decision-support, not brokerage. A feature that tells *this buyer* "offer $415k with a 3% appraisal gap and waive inspection on this house" edges toward acting as an unlicensed agent.
- **Unauthorized practice of law (UPL).** Per the prior brief and the CA DRE 2026 AI advisory, drafting/modifying contract clauses (e.g., an escalation or appraisal-gap clause) or opining on the *legal effect* of terms is the practice of law. The DRE advisory is explicit that **AI-generated explanations or document summaries must not replace attorney advice or a licensee's duty to recommend counsel**, and that real estate pros should *not* use AI to draft contracts, modify standard forms, or give legal advice.
- **Permissible educational/decision-support.** Term explainers, neutral pros/cons of each tactic, "factors sellers weigh" content, and *non-prescriptive* what-if framing ("buyers in competitive markets sometimes add appraisal-gap coverage; here's the tradeoff") are defensible.

**How existing tools frame it safely.** AI homebuying tools and brokerages consistently disclaim that nothing is legal/financial advice and route users to a licensed professional. The DRE frames AI as *assistive technology, not a substitute for professional responsibility* — "the machine may know the law, but it doesn't have to live with the consequences."

**Disclaimers/guardrails needed (minimum):**
- Persistent, conspicuous "not legal advice / not a real estate brokerage / not a substitute for a licensed agent or attorney" labeling on every AI output, not buried in ToS.
- Frame outputs as *educational decision-support* and *general information*, never "you should."
- Route to the pros directory (attorney / licensed agent) at every decision point, especially in attorney-states (use the legal engine to branch).
- Log/disclose that the user is interacting with AI.

**Flag for a licensed pro or attorney:** drafting any clause (escalation, appraisal-gap, addendum), choosing *which* contingencies to waive for this deal, opining on legal effect, and anything transaction-specific that "applies law to facts."

Sources: [CA DRE – AI in California Real Estate advisory (2026)](https://www.dre.ca.gov/Licensees/Advisories/Advisory_2026_03_17_AI_in_California_Real_Estate.html), [NAR – What constitutes UPL](https://www.nar.realtor/magazine/real-estate-news/law-and-ethics/what-constitutes-the-unauthorized-practice-of-law), [LegalMatch – Agent liability & UPL](https://www.legalmatch.com/law-library/article/real-estate-agent-liability-unauthorized-practice-of-law.html), [NAR – Why every brokerage needs an AI use policy](https://www.nar.realtor/magazine/broker-news/why-every-brokerage-needs-an-ai-use-policy).

### 1.3 AI-specific risks: hallucination, steering, Fair Housing

- **Hallucination / fabricated terms.** LLMs fabricate citations, rules, and figures — a documented, elevated risk in regulated domains (legal/financial/real estate). The **Air Canada** precedent is the cautionary case: a company was held liable for its chatbot's false promise about a refund policy. Translated to us: if our AI invents a contingency rule, a deadline, or a "this will get accepted" guarantee and a user relies on it, **we (not the AI) carry the liability.** Mitigations: ground outputs in our own vetted content (retrieval over the legal engine, not free generation), avoid guarantees, label as informational, keep a human/pro escalation path, and verify any factual claim before surfacing.
- **Steering.** HUD's May 2024 guidance confirms the FHA applies to AI-driven content/advertising; AI can "steer" by limiting or framing housing information along protected-class lines. Our AI must never nudge users toward/away from areas based on demographics, "good schools" proxies, or neighborhood "fit."
- **Fair Housing — must NOT use or infer protected class.** The FHA protects race, color, national origin, religion, sex (incl. gender identity / sexual orientation), disability, and familial status. The AI must never collect, infer, or condition suggestions on any of these, and must never help draft **buyer "love letters"** (a documented FHA liability; banned in Oregon, and sellers/agents increasingly refuse them). Keep AI suggestions strictly transaction-financial (price, EMD, timeline, contingencies) — never personal narrative.
- **Keeping suggestions FHA-safe:** input schema excludes protected-class data by design; free-text fields are filtered/nudged away from personal/family/religious narrative; outputs are screened (an FHA "remarks checklist"-style filter, per HousingWire) before display; no "love letter" generation feature, period.

Sources: [Hayhurst Law – The hallucination liability](https://hayhurstlaw.com/the-hallucination-liability-when-ai-gives-bad-advice/), [Harris Beach Murtha – Minimizing legal risks of AI chatbots](https://www.harrisbeachmurtha.com/insights/minimizing-legal-risks-of-ai-powered-chatbots/), [HUD – FHA guidance on AI (PR 24-098, May 2024)](https://archives.hud.gov/news/2024/pr24-098.cfm), [Consumer Financial Services Law Monitor – HUD AI guidance](https://www.consumerfinancialserviceslawmonitor.com/2024/05/hud-issues-guidance-on-applicability-of-the-fair-housing-act-to-tenant-screening-and-housing-related-advertising-that-relies-upon-algorithms-and-ai/), [HousingWire – AI fair housing remarks checklist](https://www.housingwire.com/articles/ai-fair-housing-remarks-checklist/), [GAO – AI changing home buying, not always better](https://www.gao.gov/blog/ai-changing-home-buying-and-renting-not-always-better), [U.Balt Law Review – Love letters & Fair Housing](https://ubaltlawreview.com/2022/03/19/better-left-unsent-real-estate-love-letters-and-fair-housing-violations/).

---

## Area 2 — State-Specific Contract Auto-Fill + E-Signature + PDF Export

### 2.1 Filling official purchase-agreement forms: the UPL safe harbor, revisited for auto-fill

The prior brief established the **NC H436 (2016) software safe harbor** (registration; a licensed in-state attorney reviews each blank template; attorney info on file; consumer-satisfaction process; complaints referred to the bar) and that there is **no national rule**. Extending that to *auto-fill*:

- **The LegalZoom model is the defensible blueprint.** LegalZoom built a large business on one disclaimer — repeated on virtually every page — that it is **not a law firm, gives no legal advice, and is not a substitute for an attorney.** Its terms state it reviews answers only for *completeness/spelling/internal consistency*, and at no time reviews for *legal sufficiency, draws legal conclusions, selects forms, or applies law to facts.* That self-positioning (mechanical fill, no judgment) plus prominent disclaimers is what survived years of UPL litigation, often via consent judgments with conditions (e.g., NC: local-attorney oversight, preserved consumer remedies).
- **Texas statutory exemption** explicitly excludes software that "clearly and conspicuously states that the products are not a substitute for the advice of an attorney" — a clean pathway where the disclaimer is prominent.
- **What's defensible for us:** mechanically populate a *vetted, attorney-reviewed* template from the user's literal answers (filling factual blanks), with strong disclaimers, no clause drafting, no "which terms should I pick" advice, and an explicit attorney-review prompt (especially attorney-states via the legal engine). **Cross the line** if we generate custom clauses, choose terms for the user, or opine on legal effect.

### 2.2 Access to the actual state/association forms — copyright/licensing constraints

- **The canonical association forms are copyright-locked and membership-gated.** The C.A.R. Residential Purchase Agreement (RPA) carries an explicit copyright notice forbidding unauthorized reproduction. Non-members can only reach C.A.R. forms by buying **zipForm + a ~$799–$999/yr** library fee (or via a local brokerage). We **cannot** legally redistribute C.A.R./association forms inside our product.
- **Defensible alternatives:**
  1. **License attorney-drafted, state-specific templates** (e.g., LawDepot/Legal Templates/LawPassport-style, or our own counsel-drafted set) — generic but state-compliant; this is the auto-fill path that pairs with the NC/TX safe harbor.
  2. **Generic state-compliant templates** we own/license, attorney-reviewed per state.
  3. **Term-sheet / summary export** (our existing wizard output) that the user hands to their attorney or licensed agent to transcribe onto the official form — lowest risk, no copyright/UPL exposure, works today.
- **Practical note:** offers written on outdated/non-canonical forms are "more likely to be put aside by the seller" (prior brief, §1.2). So template quality and currency matter, and the term-sheet-to-attorney route remains the safest for the official-form step.

Sources: [C.A.R. – Copyright policy](https://www.car.org/transactions/zipform/zf/copyrightpolicy), [C.A.R. – zipForm for non-members](https://www.car.org/transactions/zipform/zf/nonmembers), [firsttuesday – C.A.R. forms monopoly debate](https://journal.firsttuesday.us/car-is-dangerously-close-to-having-a-monopoly-on-real-estate-forms-counters-pdffiller/54393/), [Adams on Contract Drafting – LegalZoom & UPL](https://www.adamsdrafting.com/legalzoom-and-unauthorized-practice-of-law/), [Bloomberg Law – NC law regulates LegalZoom & doc providers](https://news.bloomberglaw.com/business-and-practice/n-c-law-regulates-legalzoom-other-legal-doc-providers), [LawDepot – Real estate purchase agreement (state templates)](https://www.lawdepot.com/us/real-estate/real-estate-purchase-agreement/), [LegalTemplates – Purchase agreement](https://legaltemplates.net/form/purchase-agreement/).

### 2.3 E-signature legality (ESIGN + UETA), real-estate specifics, RON

- **Two laws, four requirements.** ESIGN (federal) and UETA (adopted in 49 states; NY uses its own ESRA) make e-signatures legally valid when: **(1) intent to sign, (2) consent to do business electronically** (ESIGN requires explicit consumer consent + disclosures; UETA allows implied consent by conduct), **(3) attribution** (audit trail: signer details, IP, timestamps), and **(4) record retention** (records accurately reflect the agreement and can be reproduced/downloaded by all parties).
- **Real-estate specifics.** Purchase offers are routinely signed/transmitted electronically (DocuSign/Dotloop, per prior brief). Some states add formalities — e.g., NY has specific rules for real-estate-transfer e-signing — so per-state checks belong in the legal engine.
- **Remote Online Notarization (RON).** RON is permitted in **~45 states + DC** as of early 2025, mostly permanent. Exceptions/limits: **Connecticut** excludes real estate; **Delaware** restricts RON to attorneys; **Alabama/South Dakota** allow only RIN (remote ink-signed); **California's** SB 696 RON is not live until the Secretary of State stands up regulations (deadline 2030), though CA signers can use out-of-state RON notaries. The federal **SECURE Notarization Act** would set national standards. Note: a *purchase offer* itself usually isn't notarized — RON matters at closing (deeds), so it's a later-phase concern, not the wizard's core.

Sources: [Juro – ESIGN Act & UETA](https://juro.com/learn/esign-act-ueta), [DocuSign – ESIGN & UETA](https://www.docusign.com/products/electronic-signature/learn/esign-act-ueta), [Adobe – ESIGN vs UETA](https://www.adobe.com/acrobat/business/hub/difference-between-esign-act-vs-ueta.html), [MBA – RON adoption map](https://www.mba.org/advocacy-and-policy/residential-policy-issues/remote-online-notarization), [Stavvy – Which states allow RON](https://blog.stavvy.com/which-states-allow-remote-online-notarization), [NotaryCam – RON laws by state 2025](https://www.notarycam.com/remote-online-notary-laws-which-states-allow-online-notarization-in-2025/).

### 2.4 Tooling: e-sign providers + PDF generation (Next.js / Vercel fit)

**E-signature providers** (all ESIGN/UETA-capable with audit trails; rough pricing):

| Provider | API fit | Rough pricing | Notes |
|---|---|---|---|
| **DocuSign** | Mature REST API, SDKs, sandbox, built-in ID verification; NAR's official provider | Dev Starter ~**$600/yr** (40 envelopes/mo) up to ~$5,760/yr Advanced | Industry-standard, most expensive; brand trust in real estate |
| **Dropbox Sign (HelloSign)** | Clean API, generous rate limits | from ~**$75/mo** | Good DX, mid-market |
| **BoldSign** | REST API, .NET SDK, webhooks, templates, 99.99% uptime | Basic/Standard ~**$120–$240/yr**, Premium ~**$480** | 80–90% cheaper than DocuSign at low/mid volume |
| **Documenso (open-source)** | Next.js + Postgres + Prisma; AGPL; self-host via Docker/Helm; REST API; PAdES digital sigs + audit trail | **self-host free**; cloud from ~**$30/mo** | Best architectural fit (same stack); self-host = data control; AGPL license obligations to weigh |
| **anvil / DocuSeal / others** | PDF-fill + sign workflows | varies | DocuSeal also open-source |

**PDF generation on Vercel — key constraint:** headless-browser approaches (Puppeteer/Playwright) **don't fit Vercel serverless** (Chromium ~300MB vs 250MB bundle limit; no subprocess spawning). Practical options:
- **pdf-lib** — pure JS, fills existing PDF form fields, runs in serverless; best fit for *auto-filling a template form*.
- **@react-pdf/renderer** — JSX → PDF via own layout engine, no browser; good for *generating* documents/term sheets from scratch; ~860k weekly downloads.
- **pdfme** — modern template + form-fill workflow.
- **External PDF API** — offload browser-based rendering; keeps the function small; recommended when you need pixel-perfect HTML→PDF.

**Recommendation for our stack:** `pdf-lib` (fill licensed template form fields) and/or `@react-pdf/renderer` (generate term sheets / watermarked previews) for PDF; **Documenso** (stack-native, self-hostable, cost-controlled) or **BoldSign** (cheap managed) for e-sign. Reserve DocuSign for if real-estate brand trust becomes a requirement.

Sources: [Signb.ee – Best e-sign APIs 2026](https://signb.ee/blog/best-e-signature-apis-developers-2026), [Signb.ee – E-sign API pricing 2026](https://signb.ee/blog/e-signature-api-pricing-comparison-2026), [eSign.ai – DocuSign vs Dropbox Sign API/pricing](https://www.esign.ai/blog/docusign-vs-dropbox-sign-api-rate-limits-pricing-tier-review-2026), [Documenso – GitHub](https://github.com/documenso/documenso), [DEV – Documenso pricing teardown 2026](https://dev.to/beton/documenso-pricing-teardown-2026-3ic6), [PDF4.dev – PDF generation in Next.js](https://pdf4.dev/blog/pdf-generation-nextjs), [react-pdf-kit – 6 open-source PDF libraries 2025](https://www.react-pdf-kit.dev/blog/6-open-source-pdf-generation-and-modification-libraries-every-react-dev-should-know-in-2025).

---

## Area 3 — Monetization (freemium: watermarked free → paid no-watermark, exportable/emailable)

### 3.1 Freemium patterns for document/legal-doc-adjacent tools

The dominant pattern for doc tools is **free generation/preview, pay to unlock the clean deliverable**:
- **Watermark on free** → pay to remove (most common for doc/PDF tools).
- **Low-res / limited preview free** → paid high-quality, downloadable export.
- **Credit-based** (e.g., 1 credit per document; monthly credit allotment for subscribers).
- **Feature/quota gates** — free tier capped (file size, # docs/month, no API); paid removes caps.

For us the natural lever: **free = watermarked, on-screen offer/term-sheet preview; paid = no-watermark, downloadable PDF + email-to-self/attorney.** This keeps the *educational* value free (good for UPL posture — see §3.3) and charges for the *artifact*.

Sources: [Wondershare – Best PDF watermark removers 2026](https://pdf.wondershare.com/top-pdf-software/pdf-watermark-remover.html), [LightPDF – watermark remover](https://lightpdf.com/remove-watermark).

### 3.2 Payment options (Stripe): subscription vs one-time per-document

- **Stripe Billing** supports subscription, one-time, usage-based/metered, volume-tiered, and **hybrid** (base subscription + included usage + overage). Implementation has three parts: **metering** (count documents/exports), **rating** (convert to $), **invoicing** (collect via Stripe Checkout/Billing).
- **For a per-document artifact:** a **one-time charge per document export** (Stripe one-time price) is the cleanest match to "pay to remove watermark / export this offer." It avoids subscription-cancellation friction and the negative-option compliance burden (§3.3).
- **Subscription** fits if we bundle the whole journey (unlimited offers + dashboard + tracker). A **hybrid** (low monthly base + per-export overage) is viable later.
- **Bill-shock guardrails** (if usage-based): spend caps, in-product usage visibility, proactive notifications.

Sources: [Stripe – Subscription pricing models](https://stripe.com/resources/more/subscription-pricing-models-a-guide-for-businesses), [Stripe – Recurring pricing models docs](https://docs.stripe.com/products-prices/pricing-models), [Stripe – Usage-based pricing strategy](https://stripe.com/resources/more/usage-based-pricing-strategy-for-saas), [Stripe – Build a subscriptions integration](https://stripe.com/docs/billing/subscriptions/build-subscriptions).

### 3.3 Legal / consumer-protection considerations when charging for legal-doc-adjacent output

- **"Not a law firm" disclaimers are necessary but not sufficient.** They are the backbone of the LegalZoom defense (§2.1), but the **FTC** has been clear that a disclaimer does **not** cure an otherwise-deceptive practice. So the disclaimer must be true *and* the product must actually behave as described (mechanical fill, no advice).
- **Don't oversell the artifact.** Avoid implying the output is attorney-prepared, guaranteed valid, or a substitute for legal review. Charging money raises the consumer-protection bar — the value promised must match what's delivered.
- **Subscription/auto-renew compliance.** The FTC "click-to-cancel" Negative Option Rule was **vacated by the 8th Circuit (July 2025)** on procedural grounds, and the FTC opened a **new rulemaking (ANPRM, Jan 2026)** — but the FTC is **actively enforcing** auto-renewal abuses under **ROSCA** and **FTC Act §5** regardless, and **state laws (e.g., California's ARL)** impose their own clear-disclosure + easy-cancel requirements. So if we use subscriptions: clear up-front terms, affirmative consent, and easy cancellation. **A one-time per-document charge sidesteps most of this.**
- **Refunds.** Have a clear, honest refund policy; the FTC pursues "billed for things you never got." Define what the user is paying for (the export/no-watermark artifact) and honor it.

Sources: [FTC – Bureau of Consumer Protection](https://www.ftc.gov/about-ftc/bureaus-offices/bureau-consumer-protection), [FTC – Negative Option Rule](https://www.ftc.gov/legal-library/browse/rules/negative-option-rule), [Holland & Knight – FTC steps up subscription enforcement after click-to-cancel struck down](https://www.hklaw.com/en/insights/publications/2025/09/ftc-steps-up-subscription-enforcement-after-click-to-cancel-rule), [Goodwin – Click-to-cancel gets new life](https://www.goodwinlaw.com/en/insights/publications/2026/02/alerts-practices-ba-ftcs-click-to-cancel-rule-gets-new-life), [KeytLaw – LegalZoom disclaimer (PDF)](https://www.keytlaw.com/Cases/legalzoom-disclaimer-110724.pdf).

---

## Area 4 — Per-Home Progress Tracking Dashboard

### 4.1 Patterns for a multi-property buyer dashboard

- **Buyer-side multi-property trackers exist** (e.g., DWELLA: track unlimited properties, save notes, compare, decide) — the consumer analog to agent deal-pipeline dashboards.
- **Pipeline/stage tracking** from real-estate deal dashboards is directly transferable: each property moves through stages with **critical dates** and **status**, and the dashboard shows pipeline volume and in-flight deals at a glance.
- **For us, the unifying model:** one record per home, each carrying **(a) journey-step completion** (from the 14-stage guided journey), **(b) showing status** (from the existing showings tracker), **(c) offer stage** (drafting → submitted → countered → accepted/rejected/expired), and **(d) deadlines/documents** (from the deadline + document tracker). The dashboard is a **per-home rollup that unifies the showings tracker and journey progress** we already have, plus the new offer pipeline — so a buyer juggling several homes sees, per card: where each home is in the journey, showing/offer status, next deadline, and outstanding documents.
- **Offer status pipeline** (new): Draft → Term sheet ready → Sent to attorney/agent → Submitted → Countered → Accepted / Rejected / Expired (the 24–72h expiration clock from the prior brief feeds the deadline tracker).

Sources: [DWELLA – home buyer property tracking](https://www.dwella.me/), [Dealpath – Real estate dashboards 2025](https://www.dealpath.com/blog/real-estate-dashboards/), [GoodData – Real estate dashboard examples](https://www.gooddata.ai/blog/real-estate-dashboard-examples-that-drive-smarter-decisions/).

---

## Implications & Guardrails for Our Product

### Hard compliance DOs / DON'Ts

**UPL (offer recommendations + contract auto-fill):**
- DO keep AI output **educational/general decision-support** — explain factors, neutral pros/cons, what-if framing. DO mechanically fill **attorney-reviewed, licensed** templates from the user's literal answers. DO disclaim "not legal advice / not a brokerage / not a law firm" conspicuously on every output, and route to the pros directory + attorney-review (branch on attorney-states via the legal engine).
- DON'T draft or modify clauses (escalation, appraisal-gap, addenda), choose *which* terms/contingencies for this deal, or opine on legal effect. DON'T let AI tell a user "you should offer $X / waive Y."
- IF we ship generative document text, follow the **NC H436 / LegalZoom / TX** safe-harbor model (prominent disclaimers, per-state attorney template review, registration where required, consumer-complaint routing) **and get counsel sign-off first.**

**Licensing & copyright (forms):**
- DON'T redistribute C.A.R./association official forms (copyright-locked, membership-gated). DO license attorney-drafted generic state-compliant templates, or use the safest path: **term-sheet export the buyer hands to their attorney/agent.**

**Fair Housing (AI):**
- DON'T collect, infer, or condition any suggestion on protected class. DON'T build a "love letter" feature (FHA liability; Oregon-banned). DON'T steer by geography/demographics or "schools" proxies.
- DO design the AI input schema to exclude protected-class data, filter free-text away from personal narrative, and screen outputs before display. Remember **HUD: liability stays with us even when AI does the work.**

**AI reliability:**
- DON'T let AI guarantee acceptance or state legal/deadline facts it could hallucinate. **The Air Canada precedent = we're liable for our bot's false promises.** DO ground AI in our vetted legal-engine content (retrieval, not free generation), label AI clearly, and keep a human/pro escalation path.

**ESIGN / UETA (e-sign):**
- DO satisfy all four: intent, consent (explicit consumer e-consent + disclosures), attribution (audit trail: IP/timestamps), retention (downloadable executed copy). DO branch state-specific formalities via the legal engine. RON is a closing-stage concern (deeds), not the wizard core; CA RON isn't live until ~2030.

**Charging for legal-doc-adjacent output:**
- DO keep the *educational* layer free and charge for the *artifact* (no-watermark export/email). DON'T imply the output is attorney-prepared or guaranteed. Disclaimers don't cure deception (FTC) — the product must behave as described. **Prefer one-time per-document charges** to dodge auto-renewal (ROSCA / state ARL) compliance; if subscriptions, ensure clear terms + easy cancel.

### Buildable now vs. needs vendor / legal-review / paid pipeline

**Buildable now (no new vendor, low legal risk):**
- AI "offer strength" *educational explainer* over our legal-engine content (factors + neutral tradeoffs, no prescriptions), with FHA-safe input schema and output screening.
- Watermarked on-screen offer/term-sheet **preview** (extends the existing term-sheet wizard).
- Per-home unified **dashboard** rolling up journey steps + showings + offer stage + deadlines/documents.
- Offer-status pipeline + expiration/deadline wiring into the existing tracker.

**Needs a vendor:**
- E-signature integration (Documenso self-host / BoldSign / DocuSign).
- PDF generation/fill (pdf-lib / @react-pdf/renderer; external PDF API if HTML→PDF needed).
- Stripe billing for the paid pipeline.

**Needs legal review before ship:**
- Any **generative** contract text or auto-fill of a real contract (UPL safe-harbor compliance + per-state attorney template review).
- Licensing of attorney-drafted state templates.
- AI prompt/output policy + disclaimers (UPL + FHA + reliability) and ToS/refund/"not a law firm" language.
- Any subscription auto-renewal flow (ROSCA / state ARL).

**Needs the paid pipeline + real-data pipeline:**
- No-watermark export + email-to-attorney (paid).
- Actually *transmitting* an offer to a real listing agent (gated on real-data pipeline, per prior brief).

### Recommended phasing

1. **Phase 1 (now, low risk):** AI educational offer-strength explainer (grounded, FHA-safe, disclaimed) + watermarked term-sheet preview + unified per-home dashboard + offer-status pipeline into the deadline tracker.
2. **Phase 2 (vendor + legal review):** Stripe paid tier → no-watermark PDF export (pdf-lib / react-pdf) + email-to-self/attorney; one-time per-document pricing; finalize disclaimers/ToS/refunds.
3. **Phase 3 (legal-heavy):** licensed attorney-drafted state templates + safe-harbor-compliant auto-fill; e-signature integration (Documenso/BoldSign); per-state ESIGN/UETA branching.
4. **Phase 4 (data + closing):** real-agent transmission (on real-data pipeline) and RON at closing where state law allows.
