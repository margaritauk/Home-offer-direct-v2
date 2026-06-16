# Market Research Priorities — 10-Sprint Replan

_Contributor: Market Researcher · 10-sprint replan · 2026-06-16_

This is the market/evidence lens on what the next ~10 sprints should prioritize.
It refreshes our earlier research (`docs/research/market-research.md`, dated
2026-06-06) against the June 2026 landscape, ranks priorities by market evidence,
and flags where the market has moved since we last looked. Every claim is sourced
and dated; all messaging recommendations stay inside the FHA/UDAP and UPL
guardrails already in the codebase.

> Scope note: I assess market pull, competitive pressure, and monetization
> timing. I do not set engineering sequencing — that is for Product/Eng to slot
> against the gated work (Stripe/e-sign, shared workspace, agent console,
> pricing, legal sign-off).

---

## TL;DR — the market has moved, and it moved toward us

1. **A direct competitor now exists and is closing real deals.** As of early–mid
   2026, **Homa** (`tryhoma.com`) is doing exactly our thesis — an AI-guided,
   commission-capture home-purchase flow for unrepresented buyers — with a **free
   tier and a $1,995 "Homa Pro"** tier, live in Florida, 10+ end-to-end closings,
   buyers reportedly saving $8K–$24K each. When our 2026-06-06 research said "no
   incumbent offers a guided, state-aware, transactional self-serve workflow,"
   that white space is **no longer empty**. This is the single biggest change and
   it reframes the whole replan: the race is now about **execution speed,
   state coverage, and trust/defensibility**, not discovering the category.
2. **The structural opening is confirmed and durable, not a fad.** One year+ past
   the NAR settlement, buyer-agent commissions did **not** collapse — they sit at
   **~2.4% (2.42% Q3 2025)** and have ticked *up* from their post-settlement low.
   The ~$10k-per-deal prize the buyer can capture is intact, and the mandatory
   written buyer-agreements-before-touring rule keeps raising buyer awareness of
   "what am I actually paying for?"
3. **Monetization timing is now urgent, not optional.** Competitors have already
   set buyer-side price anchors ($1,995 flat at Homa; ~1.5% / ~$10,450 median
   rebate at reAlpha/Prevu). We are still free with monetization gated. Staying
   free while a funded competitor monetizes is a strategic risk, not a safe
   default.

---

## What changed in the market since our 2026-06-06 research

| Theme | Earlier research said (2026-06-06) | What's true now (June 2026) | Implication |
|-------|-------------------------------------|------------------------------|-------------|
| **White space** | "No mainstream product is a guided, transactional, state-aware self-serve workflow for the unrepresented buyer." | **Homa** is doing precisely this in FL with paid tiers + real closings; **HouseMe.ai**, **linkhome**, and **reAlpha/Prevu** are adjacent AI-buyer entrants. | The category is being claimed *now*. Move from "educate the market" to "win the category." |
| **Commission level** | "~2.4–2.67% (Q1–Q2 2025), near pre-settlement." | **2.42% in Q3 2025**, up from a 2.36% post-settlement low; widely reported as "rebounding/stable." | Our core $10k value prop is confirmed and stable. Keep it central; it is evidence-backed. |
| **Regulatory** | NAR settlement effective Aug 2024; mandatory buyer agreements. | Settlement holding; **DOJ probe continues** (SCOTUS declined NAR's appeal Jan 2025; DOJ critical of the "touring agreement" clause); **Clear Cooperation** revised to let sellers opt out of syndication. | More fragmentation/opacity in how listings surface → buyers need a neutral guide. Tailwind, but don't over-claim a specific rule change. |
| **AI claims risk** | Not addressed. | **FTC Section 5 / state UDAP enforcement on deceptive AI claims is accelerating** (FTC AI guidance window closed Mar 11 2026; Workado settlement Apr 2025). | Our AI explainers being default-off prototypes is the *right* posture; legal sign-off on public AI claims is now a gating item with real enforcement behind it. |
| **Monetization anchors** | "Validate willingness-to-pay; $199–$499 band." | Market has set anchors: **Homa Pro $1,995** flat (incl. transaction broker), **reAlpha/Prevu ~1.5% rebate / ~$10,450 median**. | Our $199–$499 band may be *too low* and under-monetizes the guided/handoff tier. Re-test the band upward; tier by who-holds-the-license. |
| **Market conditions** | 2025 buyer-favorable. | 2026: ~4.26M existing sales (+4.3% YoY, Zillow), rates ~6.3%, inventory +9–15% YoY but still below pre-pandemic, "balanced/mild seller's market." | Modest volume tailwind; not a boom. Acquisition efficiency (SEO flywheel) matters more than riding a hot market. |
| **FSBO/agent-free adoption** | Framed as latent demand. | FSBO at/near **record low ~6%** of sales; only ~11% of FSBO sellers finish without an agent. | Sobering: agent-free is still niche behaviorally. Reinforces our **assisted/guided + pro-handoff** model over pure go-it-alone, and that education/trust is the real funnel. |

---

## Ranked priorities for the next 10 sprints

Ranked by **market pull × competitive urgency × defensibility**. Each item: the
evidence (sourced + dated), why now, the differentiation/defensibility, and the
risk.

### P0-1. Ship monetization (one-time flat unlock) — close the "free while rivals charge" gap

- **Market evidence.** Buyer-side competitors have already priced and are
  collecting: **Homa** offers a **$1,995 "Homa Pro"** tier (licensed transaction
  broker + protected rebate) alongside a free tier (CBS Miami / Yahoo Finance /
  completeaitraining, Feb–Mar 2026). **reAlpha/Prevu** delivered a **median
  $10,450 commission rebate** to buyers in 2025 and monetizes via mortgage/title
  (reAlpha IR, Nov 2025). Freemium→paid conversion lifts sharply with a
  card-on-file unlock (our `competitive-pricing-analysis.md`: ~22–31% vs ~2–5%).
- **Why now.** We are *still free* with Stripe paid export, e-sign, and email
  gated. Every month free is a month a funded rival sets the buyer-side price
  anchor and harvests willingness-to-pay we are leaving on the table. The
  Business Analyst's #1 recommendation (validate WTP) cannot run until there is a
  paywall to test.
- **Differentiation / defensibility.** Our **flat, no-commission-conflict** model
  is a trust asset Homa's transaction-broker model and reAlpha's
  mortgage/title-cross-sell model cannot fully claim — we don't make money from
  steering the loan or the title. Lead with "we don't earn a commission and don't
  sell your loan."
- **Risk.** UPL/RESPA: keep tiers framed as tools+education, not advice; keep any
  professional referral fees flat and disclosed (no pay-to-play). Pricing too low
  under-monetizes (see P0-3).

### P0-2. Defend and widen the state-coverage moat (the 50-state legal engine + 51 SEO pages)

- **Market evidence.** Homa is **Florida-only**; reAlpha/Prevu reach **~8–13
  states** for brokerage/rebate (reAlpha IR, Nov 2025–Jan 2026). The agent-free
  process is sharply **state-specific** (attorney vs. escrow closing, disclosure
  regimes — our market-research §4). Buyer demand is geographically uneven (FSBO:
  OH 13.6%, TX 13.2%, IN 12.8% vs HI 0.9%, HouseCashin Sept 2025).
- **Why now.** Our **shipped 50-state legal engine + 51 programmatic pages** is
  our biggest structural advantage over single-/few-state AI rivals and the
  hardest thing for them to replicate quickly. It is also our lowest-CAC
  acquisition engine. This is a "press the advantage" sprint set.
- **Differentiation / defensibility.** National state-aware coverage + an
  SEO/content flywheel is a **compounding, durable moat**; AI chat is
  commoditizing fast (every entrant has it). Depth-of-state-correctness and
  organic ranking are what rivals can't buy overnight.
- **Risk.** Legal accuracy liability scales with coverage — keep the engine
  data-driven, updatable, no generated legal documents, attorney-review framing.
  Clear Cooperation/listing-syndication churn means listing-data assumptions per
  state can drift; keep them sourced and dated.

### P0-3. Re-test willingness-to-pay UPWARD and tier by who-holds-the-license

- **Market evidence.** The buyer-side price anchor in-market is **$1,995 (Homa
  Pro)** for a guided/transaction-broker tier — **4–10× our planned $199–$499
  band**. Buyers using these tools report capturing **$8K–$24K** (Homa case
  studies, 2026); reAlpha/Prevu median rebate **$10,450** (2025). The ROI math
  supports a higher guided-tier price.
- **Why now.** We were about to A/B-test $199/$349/$499. The market says that
  band may anchor us as the "cheap DIY" option and leave money on the table for
  the **guided + pro-handoff** tier. Add a higher guided tier to the test
  (e.g. a self-serve unlock near our current band **plus** a guided tier tested
  meaningfully higher).
- **Differentiation / defensibility.** Tier by **support depth and who carries
  the license/liability**: DIY tools (us) → guided with vetted attorney/inspector
  handoffs (still us, flat-fee, no commission) — undercutting Homa Pro's $1,995
  while matching its hand-holding, *without* inserting a transaction broker.
- **Risk.** Over-pricing the DIY tier kills the SEO-funnel trust loop; keep a
  genuinely useful free top-of-funnel. Anchor copy to captured savings, never a
  guaranteed outcome (UDAP).

### P1-4. Trust & differentiation moat vs. AI competitors — "neutral, no hidden incentive, legally careful"

- **Market evidence.** AI-claims enforcement is **accelerating**: FTC Section 5 +
  state UDAP statutes targeting deceptive AI claims; FTC AI-guidance window
  closed **Mar 11 2026**; **Workado** settled deceptive-AI-claim charges Apr
  2025 (Morgan Lewis Apr 2026; FTC; Holland & Knight Jun 2025). Rivals monetize
  via **transaction-broker fees** (Homa) and **mortgage/title cross-sell**
  (reAlpha collects 1.2–2.47% via mortgage/title/insurance) — i.e. they *do* have
  steering incentives.
- **Why now.** Our AI explainers are **default-off prototypes on free-tier
  Gemini**, and public AI claims are a gated, legal-sign-off item. As we approach
  monetization and louder marketing, getting the **AI-claims + FHA/UDAP posture
  signed off** becomes the unlock for using AI as a *marketed* differentiator
  rather than a hidden prototype.
- **Differentiation / defensibility.** "**We don't earn a commission, don't sell
  your mortgage or title, and we tell you exactly what our AI can and can't do**"
  is a positioning rivals structurally can't copy. Trust is the category's
  scarcest asset (only 11% of FSBO sellers finish solo — fear/competence is the
  real barrier).
- **Risk.** If we over-claim AI capability we invite the exact UDAP enforcement
  that's accelerating. Keep claims conservative, sourced, and reviewed; keep the
  FHA gate on all AI input/output.

### P1-5. Double down on the SEO/content flywheel as the primary low-CAC channel

- **Market evidence.** "How to buy a house without a realtor in 2026" is a
  crowded, high-intent SERP (AmeriSave, Better, Opendoor all publishing 2026
  guides) — demand exists but is **contested content territory**. 2026 is a
  modest-volume market (~4.26M sales, +4.3%; rates ~6.3%), so paid-media tailwinds
  are weak and **organic efficiency dominates** unit economics. Our **51 state
  pages + 14-stage journey + ~20 tools** are a ready-made programmatic SEO asset
  (Marketing analysis P0).
- **Why now.** Before paid acquisition (gated on proven CAC) makes sense, organic
  must be harvested. Competitors (esp. single-state Homa) cannot match national
  long-tail "...in <state>" coverage. This is the cheapest defensible growth.
- **Differentiation / defensibility.** Content depth × 51 state pages ×
  interactive tools = a flywheel that compounds and is expensive to replicate;
  AI-chat-only entrants have thin indexable surface area.
- **Risk.** AI Overviews / answer-engines are eroding click-through on
  informational queries — prioritize **tool-led and transactional** intent pages
  (savings calculator, offer builder, state closing-path) over pure explainer
  content, and instrument the funnel to the unlock moment.

### P2-6. Live listing/market data and "what should I offer?" depth — match table stakes

- **Market evidence.** Every new AI entrant ships **instant valuation,
  cost-to-close, and negotiation insight** (HouseMe.ai "30-second" reports,
  realestatenews Jun 2026; linkhome conversational search Feb 2026; Homa AI
  pricing analysis). This is becoming **table stakes**, not differentiation.
- **Why now.** Our market-conditions read, "what should I offer?", and
  competitive-offer tactics are shipped, and live data via **RentCast is flagged**
  with a kill switch. As rivals normalize instant data, we need our flagged
  data-backed tools production-ready (within margin guardrails) so we're not the
  "no live data" option.
- **Differentiation / defensibility.** Lower defensibility (commoditizing) — so
  treat as **parity**, not a wedge. Our edge is pairing data with the
  state-specific *transactional* next step, not the data itself.
- **Risk.** Data-cost creep (the `RENTCAST_DISABLED` kill switch exists for this);
  don't let a parity feature blow gross margin. Avoid any data-driven steering
  that could implicate FHA.

### P2-7. Collaboration / shared-workspace foundation — keep warm, don't over-invest yet

- **Market evidence.** The v2 PRD bet (buyer + agent on one deal model) is real
  but **adoption is still niche**: FSBO ~6% record low; agent-mediated buying
  remains the norm. Competitors are racing the **buyer-direct** lane, not the
  collaboration lane, so the urgency here is lower than P0/P1.
- **Why now (modest).** Multi-user/deal foundation is shipped; deeper
  collaboration (shared workspace, agent console) is gated. Given the buyer-direct
  competitive fire, **defend the buyer-hero lane first**; advance collaboration
  opportunistically (it's a later expansion/RESPA-sensitive line, per PRD).
- **Differentiation / defensibility.** "One deal model with or without an agent"
  is still genuinely unowned — a durable later moat — but it's not where the
  2026 competitive pressure is.
- **Risk.** Splitting focus across two audiences while a funded rival out-executes
  on the core buyer flow. New guardrails (GLBA, RESPA, dual-agency) raise the cost
  of the agent lane; sequence it after the buyer-side monetization proves out.

---

## Top 5 for the next 10 sprints (summary)

1. **Ship the one-time flat unlock (monetization).** The white space has a paying
   competitor (Homa $1,995); being free while rivals monetize is now a risk.
   Flat, no-commission, no-loan/title-cross-sell = our trust wedge. _(P0-1)_
2. **Press the 50-state legal engine + 51-page SEO moat.** Homa is FL-only;
   reAlpha/Prevu ~8–13 states. National state-aware coverage is our hardest-to-
   copy, lowest-CAC advantage. _(P0-2)_
3. **Re-test willingness-to-pay upward, tiered by license/support depth.** The
   in-market anchor is $1,995, not our $199–$499 band; add a higher guided tier
   to the WTP test. _(P0-3)_
4. **Build the trust + AI-claims differentiation moat.** "No commission, no loan/
   title steering, conservative AI claims" — structurally uncopyable by Homa/
   reAlpha, and AI-claims UDAP enforcement is accelerating (FTC, Mar 2026).
   _(P1-4)_
5. **Double down on the SEO/content+tools flywheel.** Modest-volume 2026 market
   means organic efficiency wins; tool-led transactional intent pages over pure
   explainers to survive AI Overviews. _(P1-5)_

**Deliberately deprioritized for this 10-sprint window:** deep collaboration /
agent console (real, but not where 2026 competitive pressure is — defend the
buyer-hero lane first) and treating live-data depth as a wedge (it's becoming
table stakes; ship to parity within margin guardrails).

**Compliance note on all of the above:** every messaging recommendation here
stays inside the existing FHA messaging gate and UPL gate — no targeting by
protected class, no guaranteed-outcome or unsubstantiated AI claims (UDAP), no
legal advice. The "$8K–$24K saved" figures are competitor case studies cited as
market evidence, **not** a promise we should make to our own users.

---

## Sources

NAR settlement, commission levels & regulation
- [Redfin — Buyer's Agent Commissions Tick Up (Q2 2025)](https://www.redfin.com/news/commissions-q2-2025/)
- [HousingWire — Buyer agent commissions down to 2.55% since the NAR settlement](https://www.housingwire.com/articles/buyer-agent-commissions-down-to-2-55-since-the-nar-settlement/)
- [Inman — Buyer's Agent Commissions Rebound (Dec 8, 2025)](https://www.inman.com/2025/12/08/buyers-agent-commissions-see-rebound-in-wake-of-settlement/)
- [Kiplinger — Why the settlement hasn't lowered costs](https://www.kiplinger.com/real-estate/landmark-real-estate-commission-settlement-why-costs-havent-dropped)
- [NAR — What the settlement means for buyers and sellers](https://www.nar.realtor/the-facts/what-the-nar-settlement-means-for-home-buyers-and-sellers)
- [Inman — Supreme Court Denies NAR's Appeal in DOJ Case (Jan 13, 2025)](https://www.inman.com/2025/01/13/supreme-court-denies-nars-appeal-request-in-doj-case/)
- [Manatt — NAR v. DOJ: D.C. Circuit bolsters Antitrust Division](https://www.manatt.com/insights/newsletters/client-alert/nar-v-doj-d-c-circuit-bolsters-antitrust-division)
- [Propmodo — NAR finally makes a decision on Clear Cooperation](https://propmodo.com/nar-finally-makes-a-decision-on-clear-cooperation/)
- [Kallan LVRE — Nevada Buyer Agent Commissions in 2026: what changed](https://www.kallanlvre.com/blog/nevada-buyer-agent-commissions/)

Competitors / new AI-buyer entrants
- [Homa — AI-powered home buying, up to 2% commission back](https://www.tryhoma.com/)
- [CBS Miami — Homa changing the home buying game in South Florida](https://www.cbsnews.com/miami/news/homa-home-buying-south-florida/)
- [Yahoo Finance — Florida homebuyers using AI to get homes without agents](https://finance.yahoo.com/news/florida-homebuyers-using-ai-homes-212914903.html)
- [Yahoo Finance — Homa announces first end-to-end AI-powered home purchases in the US](https://finance.yahoo.com/news/homa-announces-first-end-end-140000097.html)
- [reAlpha IR — FY2025 results (record $4.5M revenue, +376% YoY)](https://ir.realpha.com/press-release/re-alpha-nasdaq-aire-reports-fourth-quarter-and-full-year-2025-results-record-full-year-revenue-of-4-5-million-up-376-year-over-year-1)
- [GlobeNewswire — reAlpha acquires Prevu (median $10,450 rebate; ~1.5%)](https://www.globenewswire.com/news-release/2025/11/25/3194232/0/en/reAlpha-Nasdaq-AIRE-Acquires-Prevu-to-Expand-Multi-State-Footprint-and-Offer-Its-Integrated-Realty-and-Mortgage-Services-in-Additional-States.html)
- [Quiver — reAlpha Q1 2026 results (revenue decline; 25% workforce cut)](https://www.quiverquant.com/news/reAlpha+Tech+Corp.+Reports+Q1+2026+Financial+Results+with+Revenue+Decline+and+Increased+Cash+Reserves)
- [HousingWire — HouseMe.ai launches free AI listing reports](https://www.housingwire.com/articles/free-ai-valuation-gta/)
- [RealEstateNews — Agent-built platform delivers buyer insights in 30 seconds (Jun 1, 2026)](https://www.realestatenews.com/2026/06/01/agent-built-platform-delivers-insights-to-buyers-in-30-seconds)
- [Barchart — linkhome launches AI agent for homebuying and financing](https://www.barchart.com/story/news/239444/linkhome-launches-ai-agent-to-enhance-the-home-buying-and-financing-experience)

Buyer demand / FSBO / market conditions
- [HouseCashin — 2026 FSBO statistics by state](https://housecashin.com/knowledge-base/for-sale-by-owner-statistics/)
- [AmeriSave — How to buy a house without a Realtor in 2026](https://www.amerisave.com/learn/how-to-buy-a-house-without-a-realtor-in-complete-guide)
- [Realtor.com 2026 Housing Forecast (balanced market)](https://www.barchart.com/story/news/36427040/realtor-com-2026-housing-forecast-housing-market-remains-balanced-as-supply-and-demand-find-firmer-footing)
- [Rate.com — 2026 Housing Market Outlook: will inventory improve?](https://www.rate.com/mortgage/resource/housing-market-outlook-will-inventory-finally-improve)

AI-claims / UDAP enforcement
- [Morgan Lewis — AI Enforcement Accelerates as Federal Policy Stalls and States Step In (Apr 2026)](https://www.morganlewis.com/pubs/2026/04/ai-enforcement-accelerates-as-federal-policy-stalls-and-states-step-in)
- [Holland & Knight — FTC Evaluating Deceptive AI Claims (Jun 2025)](https://www.hklaw.com/en/insights/publications/2025/06/ftc-evaluating-deceptive-artificial-intelligence-claims)
- [FTC — Crackdown on Deceptive AI Claims and Schemes](https://www.ftc.gov/news-events/news/press-releases/2024/09/ftc-announces-crackdown-deceptive-ai-claims-schemes)
