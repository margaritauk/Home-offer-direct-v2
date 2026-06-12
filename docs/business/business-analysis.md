# Business Analysis — HomeOffer Direct

_Owner: Business Analyst · Status: v1 · Last updated: 2026-06-12_

The Business Analyst's charter: tie the product to business outcomes. This brief
grounds the opportunity (market sizing), the model (how value is created and
captured), unit economics, the metrics that prove it, the risks, and a
requirements-to-value traceability map. It builds on
[`docs/research/market-research.md`](../research/market-research.md) and
[`docs/product/prd.md`](../product/prd.md) — read those for the underlying
evidence; this doc turns it into a business case.

> Numbers below are **planning estimates** with stated assumptions, not audited
> figures. They exist to size decisions and set targets, and should be revised
> as real funnel data arrives.

## 1. The opportunity

**Problem.** Buying without a buyer's agent is legal in all 50 states, and since
the 2024 NAR settlement the buyer-side commission (~2.5% of price) is fully
negotiable — but the savings are **not automatic**. No incumbent offers a
guided, state-aware, transactional workflow for the unrepresented buyer.

**Who has it.** US home buyers who are willing to self-represent to capture the
commission: confident repeat buyers, finance-savvy first-timers, cash/investor
buyers, and FSBO-adjacent transactions.

### Market sizing (TAM / SAM / SOM)

Assumptions: ~4–5M existing-home sales/year in the US; median price ~$400k;
buyer-side commission ~2.5% ≈ **$10k of value per transaction** the buyer could
capture.

| Layer | Definition | Estimate |
|-------|------------|----------|
| **TAM** | All annual US home purchases where a buyer *could* self-represent | ~4–5M transactions/yr · ~$10k savings each ≈ **$40–50B/yr** of capturable commission |
| **SAM** | Buyers open to going agent-free with digital guidance (early adopters, finance-savvy, investors) — assume ~5–10% | ~250–500k transactions/yr |
| **SOM (3-yr)** | Realistic early capture with focused acquisition — low single-digit % of SAM | ~5–25k assisted transactions/yr |

The platform's job is to **convert the $10k/transaction of latent savings into
realized savings** for the buyer — and to capture a small, fair slice of the
value it helps create.

## 2. Business model & monetization options

The product is currently free and account-optional. Candidate models, ranked by
fit with the unrepresented-buyer trust promise:

1. **Flat success/usage fee (recommended primary).** A modest flat fee
   (e.g. $199–$499) to unlock the full transactional workflow (offer builder,
   tracker, document binder, deal export). Anchored against the ~$10k the buyer
   captures — a clear, honest "keep 95%+ of your savings" story. No % of price
   (avoids agent-like incentive conflicts).
2. **Freemium.** Journey, glossary, savings calculator, and state guidance stay
   free (top-of-funnel + SEO); paid tier unlocks offer/closing tooling and cloud
   sync/collaboration.
3. **Curated professional referrals.** Flat, disclosed referral fees from vetted
   attorneys / inspectors / title-escrow in the directory — **never** pay-to-play
   ranking, and clearly labeled, to preserve trust.
4. **B2B2C / partnerships (later).** Lenders, FSBO platforms, and fintechs
   white-label or bundle the workflow for their self-directed buyers.

Explicitly **avoided**: anything that recreates a commission incentive, dark
patterns, or selling buyer data.

## 3. Unit economics (illustrative)

Assumptions for a paid conversion at a $299 flat fee:

| Metric | Assumption / formula | Illustrative value |
|--------|----------------------|--------------------|
| ARPU (paid) | Flat unlock fee | $299 |
| Gross margin | SaaS-like (hosting + data APIs e.g. RentCast) | ~85% → ~$254 contribution |
| Target CAC | Blended paid + organic | ≤ $75 |
| Contribution / customer | ARPU·margin − CAC | ~$179 |
| LTV:CAC | Single-purchase + referrals/repeat | target ≥ 3:1 |
| Payback | First transaction | immediate (one-time fee) |

The buyer-side ROI is the headline: **pay ~$299 to help capture ~$10k** ≈ a
~30× return for the buyer. That asymmetry is the core acquisition argument and
should be front-and-center (handed to the Marketing Analyst).

## 4. KPIs & the funnel

North-star: **realized buyer savings** (sum of commission captured by users who
complete an offer with a concession ask). Supporting funnel:

| Stage | Metric | Why it matters |
|-------|--------|----------------|
| Acquisition | Visitors, organic share, CAC | Top of funnel & efficiency |
| Activation | Started the Journey / saved progress | Intent signal |
| Tool engagement | Savings calc completed, offer builder started | Value realization leading indicator |
| Conversion | Paid unlock rate | Revenue |
| Outcome | Offers built with a concession ask; est. savings captured | North-star |
| Retention/advocacy | Cloud-sync sign-ups, referrals, NPS | Compounding growth |

Instrumentation note: these map to existing surfaces (Journey, savings
calculator, offer wizard, tracker). Event tracking is privacy-first and must
never collect or infer protected-class data (FHA gate).

## 5. Key risks & mitigations

| Risk | Mitigation |
|------|------------|
| **Trust / liability** — buyers fear going agent-free | Loud trust callouts, state-aware guidance, attorney/inspector handoffs; UPL gate keeps us educational, not advisory |
| **Fair Housing exposure** in any messaging/AI surface | FHA messaging gate + input/output screening already enforced in code |
| **Regulatory shifts** (commission rules, state UPL) | State legal engine is data-driven and updatable; no generated legal docs |
| **Thin willingness-to-pay** | Anchor fee against $10k savings; keep a free top-of-funnel; validate price via experiments |
| **Data-cost creep** (3rd-party APIs) | Provider seams + the `RENTCAST_DISABLED` kill switch let us cap/cut live-data spend instantly |
| **Seasonality / rate sensitivity** of home sales | Diversify channels; lean on evergreen educational SEO |

## 6. Requirements → value traceability

| Capability (in PRD/product) | Business value | KPI it moves |
|-----------------------------|----------------|--------------|
| Savings calculator | Quantifies the ~$10k prize → motivates self-representation | Activation, conversion |
| Offer builder + concession ask | The mechanism that *realizes* the savings | North-star (realized savings) |
| State legal engine + handoffs | De-risks going agent-free → trust | Activation, conversion |
| Deadline/document tracker + binder | Reduces drop-off through a long transaction | Retention, outcome |
| Deal export / collaboration | Portability + multi-party deals → stickiness | Retention, advocacy |
| Glossary + Journey content | Evergreen SEO + education | Acquisition (organic) |

## 7. Recommendations (next sprint)

1. **Validate willingness-to-pay** with a price/packaging experiment on the
   offer-builder unlock.
2. **Instrument the north-star** (offers built with a concession ask + estimated
   captured savings) so the funnel above is measurable.
3. **Stand up referral economics** with disclosed, flat professional-directory
   fees — no pay-to-play.
4. Hand the **30× buyer-ROI** framing to the Marketing Analyst as the primary
   acquisition message (see [`../marketing/marketing-analysis.md`](../marketing/marketing-analysis.md)).
