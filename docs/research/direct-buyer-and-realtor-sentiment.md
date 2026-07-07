# Social-Listening Study: Direct-Buyer & Buyer's-Agent Sentiment

_Prepared by: Market Researcher_
_Date: 2026-07-07_
_Scope: US only. A qualitative social-listening / sentiment scan across Reddit (r/RealEstate, r/FirstTimeHomeBuyer, r/RealEstateTechnology, r/realtors, r/RealEstateAgents), real-estate forums (BiggerPockets, Bogleheads), and real-estate blogs/news, aimed at three product-direction questions for HomeOffer Direct. This is sentiment signal for prioritization, **not** market sizing._

> **Read this first — integrity note on quotes.** In this environment, Reddit is blocked to the search crawler and every forum/blog page I attempted to open (BiggerPockets, Bogleheads, RISMedia, Redfin, Clever, real-estate news sites) returned **HTTP 403 / not fetchable**. I therefore could **not** capture verified verbatim quotes from primary threads. Everything attributed to buyers/agents below is a **paraphrase of what WebSearch surfaced** (its result summaries + link lists), explicitly labeled `(paraphrased)`. Where I cite a hard number, it comes from a named survey/report visible in search results. See **Methodology & limitations** for the full caveat. Do not treat any `(paraphrased)` line as a real quotation.

---

## Executive summary

- **Sample basis:** ~18 WebSearch queries across the three questions; ~10 returned usable link lists (surfacing NAR, Redfin, RISMedia, Clever, BiggerPockets, Bogleheads, HousingWire, Inman, and buyer/agent blogs). Reddit-targeted queries mostly returned crawler-refused ("No links found") plus a generic AI summary — usable only as weak directional signal, not as citeable quotes.
- **Q1 — Buyer sentiment (direct vs. represented):** The center of gravity in the threads/articles sampled is **"do a lot yourself, but keep a safety net."** A clear majority of the general/first-time-buyer discussion still values *some* professional help (agent or attorney), while a **sizable and growing minority** actively wants to go direct to capture the ~2.5% and is frustrated by the lack of buyer-side tooling. Concrete tool wishes cluster around: comps/"what should I offer," offer/contract paperwork, deadline tracking, and negotiation scripts — which map almost 1:1 onto our shipped features.
- **Q2 — Buyer's-agent sentiment (do they want more tools?):** Realtor communities are **anxious about buyer-side economics post-settlement** (Redfin: ~75% of agents worried about declining commissions; ~48% more pessimistic about their careers). Their "asks," however, skew toward **getting-paid / getting-the-agreement-signed and admin-load relief** (transaction management, CRM, e-sign, compliance) more than toward buyer-empowerment tools. This is a real but **differently-pointed** demand than ours — relevant if we ever build an agent-facing surface, less so for our unrepresented-buyer core.
- **Q3 — Prevalence + support used:** Represented buying still **dominates** (NAR 2025: **88% used an agent → ~12% unrepresented**), but the DIY behaviors we serve are **far more common than the 12% headline** (Clever: **~29% of recent buyers made an offer without a realtor**), and unrepresented buying **ticked up** post-settlement (RISMedia study). Direct/DIY buyers lean on: **real-estate attorneys** (the most-cited substitute), **flat-fee / rebate brokers** (Redfin, Clever, Prevu), **listing portals** (Zillow/Redfin/Realtor.com), and **self-made spreadsheets** — i.e., a fragmented stack with no single guided product, which is our wedge.

---

## Question 1 — Buyers: direct vs. represented sentiment

**Sample basis for this section:** general home-buying, "without a realtor," "make an offer without an agent," and "unrepresented buyer regret" queries; roughly 40+ result links reviewed across ~7 searches (Better, SoFi, Rocket, Redfin, HomeLight, Clever, NerdWallet, HousingWire, Veterans United, NerdWallet 2026 report, plus BiggerPockets/Bogleheads thread titles). No Reddit thread bodies were fetchable.

### Rough sentiment split (directional, not a computed statistic)

- **"Keep a pro, but let me do more myself" — the plurality.** Survey signal reinforces the thread tone: **73% of buyers do their own independent research, yet 88% still want a human in the loop**, and **45% expect an agent to guide them start-to-finish** ([HousingWire](https://www.housingwire.com/articles/buyers-are-doing-independent-research-but-they-still-want-an-agent/)). Read as sentiment: most buyers are **not** anti-agent; they are **anti-opacity** and want to self-serve the research/decision layer.
- **"I want to go direct to save the commission" — a sizable, vocal minority.** Recurring across the FSBO/"without a realtor" articles and investor forums; strongest among repeat/experienced/investor buyers who already found the house and mainly need paperwork + negotiation, not hand-holding.
- **"Happy I used an agent" — a steady, genuine share.** NAR's own read: buyers valued help finding the home, negotiating, and navigating paperwork, and **76% of first-time buyers credited their agent with helping them understand the process** ([NAR 2025 Profile](https://www.nar.realtor/magazine/real-estate-news/nar-2025-profile-of-home-buyers-sellers-reveals-market-extremes)). First-timers skew pro-agent; experienced buyers skew DIY.
- **"Went direct and regretted it / it was harder than expected" — a cautionary minority.** The "unrepresented buyer regret" cluster is dominated by *agent-authored* blogs (selection bias — they benefit from the scary framing), but the concrete failure modes they cite (missed contingency deadlines, mispriced offers, contract clauses) are exactly the friction our product removes.

### What buyers say they wish they had (tool/support asks) — all `(paraphrased)`

- **A "what should I offer" / comps tool.** Buyers repeatedly frame comps as the hardest DIY gap: *without access to recent comparable sales you risk overpaying or lowballing* `(paraphrased)` ([Robbie English blog](https://www.robbieenglish.com/blog/what-are-the-pitfalls-of-being-an-unrepresented-buyer/); [Better](https://better.com/content/buying-house-without-realtor)). Third-party point tools like "Comps Chomper" get name-checked as stopgaps ([Clever apps list](https://listwithclever.com/top-real-estate-apps/)).
- **A way to actually write/submit the offer and contract.** *The process is doable but unforgiving — overlooking a clause or agreeing to a contingency you don't understand can cost money* `(paraphrased)` ([Clever: make an offer without a realtor](https://listwithclever.com/real-estate-blog/make-offer-on-house-without-realtor/)). On BiggerPockets, DIY buyers describe cobbling together state forms or an attorney to draft the purchase contract `(paraphrased)` ([BiggerPockets thread](https://www.biggerpockets.com/forums/21/topics/1029788-how-to-make-an-offer-on-a-sfh-without-an-agent)).
- **Deadline / paperwork tracking.** The regret literature keeps returning to *missing a deadline or misunderstanding a clause can cost thousands* `(paraphrased)` ([Robbie English](https://www.robbieenglish.com/blog/the-perils-of-being-an-unrepresented-buyer-in-real-estate-why-competency-matters/)). Buyers explicitly note the agent's hidden value is project-managing dozens of deadlines — the thing a tool can replace.
- **Negotiation confidence against a pro.** Recurrent worry: *you're negotiating for yourself against seasoned professionals* `(paraphrased)` ([HomeLight](https://www.homelight.com/blog/buyer-how-to-make-an-offer-on-a-house-without-a-realtor/)). Buyers want scripts/playbooks, not just a blank text box.
- **Transparency / "explain this to me."** The clearest unmet want in the survey-level signal: buyers want *context around each listing — why this house, why now, what am I missing* and plain-language explanations of pre-approval, insurance, flood risk, etc. `(paraphrased)` ([HousingWire: transparency](https://www.housingwire.com/articles/real-estate-simplicity-transparency/)). And **58% have already used at least one AI tool** in their home-buying journey ([Veterans United survey](https://www.veteransunited.com/education/ai-homebuying-survey/)); NerdWallet projects **~48% of 2026 prospective buyers will use AI** ([NerdWallet 2026 report](https://www.nerdwallet.com/mortgages/studies/home-buyer-report/)). This validates our **AI explainers** direction.

**Takeaway for us:** The dominant buyer posture ("self-serve the research, keep a safety net") is *exactly* the wedge HomeOffer Direct occupies. The tool wishes buyers voice are the modules we've already shipped (offer builder, "what should I offer," market read, negotiation playbook, deadline reminders, AI explainers). The gap in the market is that these exist only as **disconnected point tools**, not a guided end-to-end journey.

---

## Question 2 — Buyer's agents (realtors): do they want more tools/support?

**Sample basis for this section:** realtor-facing queries (buyer-agent economics, buyer-broker agreements, agent challenges, REALTOR tech survey); ~30 links reviewed across ~6 searches (NAR Technology Survey 2025, Redfin commission survey, Inman, National Mortgage News, RISMedia, PrimeStreet, Matterport). r/realtors thread bodies were not fetchable; the strongest realtor signal is from named surveys.

### The prevalent ask is *economic/admin relief*, not buyer-empowerment tools

- **The overriding sentiment is post-settlement income anxiety.** **~75% of agents worried about declining commissions and just over half expected further cuts; ~48% said they're more pessimistic about their real-estate careers since the settlement** ([Redfin survey via realestatenews.com](https://www.realestatenews.com/2025/08/16/after-a-year-of-nars-new-rules-commissions-are-up); [National Mortgage News](https://www.nationalmortgagenews.com/news/real-estate-agents-predict-what-fallout-from-nar-settlement-will-be)). (Note: commissions actually held ~2.4–2.6%, so the anxiety over-predicted the outcome — [Inman](https://www.inman.com/2025/12/08/buyers-agent-commissions-see-rebound-in-wake-of-settlement/).)
- **The #1 concrete "tool" ask is getting-paid / getting-the-agreement-signed.** Agents describe struggling to get buyers to sign buyer-broker agreements and to get compensated when buyers won't sign `(paraphrased)` — the demand is for **contract management, buyer-education material, and value-justification tooling** ([search-surfaced r/realtors discussion, thread body not fetchable]; framing corroborated by [PrimeStreet: 2025 agent challenges](https://primestreet.ai/real-estate-blog/market-trends/10-industry-challenges-agents-must-overcome-2025)).
- **Admin/transaction-load relief is the second cluster.** Agents cite *overwhelming administrative requirements* and *sustaining momentum / keeping deals moving* as top pains, wanting transaction pipelines, deadline tracking, task automation, and CRM ([PrimeStreet](https://primestreet.ai/real-estate-blog/market-trends/10-industry-challenges-agents-must-overcome-2025); [Matterport: agent tools 2025](https://matterport.com/blog/real-estate-agent-tools)).
- **Compliance load is rising** post-settlement (new disclosure/representation-agreement requirements) — more paperwork, more liability `(paraphrased)` ([PrimeStreet](https://primestreet.ai/real-estate-blog/market-trends/10-industry-challenges-agents-must-overcome-2025)).

### How prevalent is the "wish for more tools" ask? — Mixed / arguably *saturated*

- Counter-signal: in the **2025 REALTORS® Technology Survey, ~67% of agents agree/strongly agree their brokerage already provides all the tech tools they need** (38% agree + 29% strongly agree), and only 34% spend $50–250/mo on their own tools ([NAR 2025 Tech Survey](https://www.nar.realtor/research-and-statistics/research-reports/realtor-technology-survey); [HousingWire summary](https://www.housingwire.com/articles/nar-2025-technology-survey-realtor-tech-usage-trends/)). AI is gaining (~33% report moderately positive impact), and clients respond positively to tech (~82%).
- **Interpretation:** Agents are not starved for *generic* tools — they're comparatively well-served by brokerage tech (CRM, e-sign, MLS). Their acute, *unmet* need is narrow and specific: **defend/justify buyer-side compensation and cut admin drag.** That is a **different problem than the one HomeOffer Direct solves.**

**Takeaway for us:** There is a real, prevalent realtor pain, but it points *away* from our unrepresented-buyer thesis (agents want to keep buyers represented and get paid; we help buyers go without). If we ever explore an agent-facing or hybrid/flat-fee-broker surface, the wedge would be **compensation-justification + transaction/compliance automation** — not more buyer search tools. For the core product, this question mostly confirms we should **not** pivot to serving buyer's agents.

---

## Question 3 — Prevalence of direct buyers vs. realtor-users, and the support direct buyers used

**Sample basis for this section:** prevalence/statistics queries + attorney-vs-agent + flat-fee/rebate queries; ~30 links reviewed across ~5 searches (NAR 2025 Profile, RISMedia study, Clever survey, Redfin/Clever/Prevu rebate pages, Bogleheads/BiggerPockets thread titles, FindLaw, real-estate-lawyer blogs).

### Prevalence (directional; anchored to named surveys, not to thread counts)

- **Represented buying still dominates:** **NAR 2025 Profile — 88% of buyers used an agent/broker → ~12% unrepresented** ([NAR 2025 Profile](https://www.nar.realtor/magazine/real-estate-news/nar-2025-profile-of-home-buyers-sellers-reveals-market-extremes)).
- **But DIY *behaviors* (our actual target) are much more common than 12%:** **Clever — ~29% of recent buyers made an offer on a house without a realtor** ([Clever](https://listwithclever.com/real-estate-blog/make-offer-on-house-without-realtor/)). The gap between 12% "fully unrepresented" and ~29% "made an offer solo" is precisely the **partially-DIY** population our journey can convert.
- **Unrepresented buying ticked up post-settlement:** a 2025 study found **more unrepresented buyers** (and both sides preferring more experienced agents); researchers flagged that **up-front buyer-agent payment requirements in some states scared some buyers off representation** ([RISMedia](https://www.rismedia.com/2025/10/22/more-unrepresented-buyers-more-experienced-agents-study-finds-consumer-shifts-commission-post-settlement/)).
- **Prevalence in the *social threads themselves*:** among the "buying without an agent" discussions sampled (BiggerPockets had ~10 dedicated threads on the first results page alone; Bogleheads had a multi-page "lawyer instead of buyer's agent" thread), **DIY-curious posts are well-represented and recurring** — but this is a self-selected, investor-skewed audience (BiggerPockets), so it *overstates* DIY prevalence versus the general population. Treat forum prevalence as evidence of **demand intensity**, not market share.
- **Reality check on deal completion:** one market study cited **~70% of unrepresented-buyer deals failing** for lack of someone walking them through — i.e., demand exists but the **execution gap is large**, which is the risk our guided journey + deadline/financing tracking directly mitigates ([surfaced via NAR-settlement one-year searches](https://www.erealestatecoach2.com/blog/dealing-with-unrepresented-buyers-in-real-estate-protecting-your-sale-earnings-post-nar-settlement)).

### What support direct/DIY buyers actually used — all `(paraphrased)`

- **Real-estate attorney (the most-cited substitute for a buyer's agent).** Repeated framing: *a lawyer will draft/negotiate the contract, review title and closing docs for ~$500–$2,500 — on a $600K home you save up to ~$15K vs a 3% buyer commission* `(paraphrased)` ([Seattle Property Lawyer](https://seattlepropertylawyer.com/blog/use-a-lawyer-instead-of-a-real-estate-agent-when-buying-a-house); [Lerch Early](https://www.lerchearly.com/news/hiring-an-attorney-may-save-you-money-when-looking-to-buy-a-home/); [FindLaw](https://www.findlaw.com/realestate/buying-a-home/home-buying-agent-vs-real-estate-attorney.html)). The [Bogleheads "lawyer instead of buyer's agent" thread](https://www.bogleheads.org/forum/viewtopic.php?t=245194) is the canonical DIY discussion — though one commenter noted a poster *actually used an agent who rebated the commission, not a pure attorney route* `(paraphrased)`, a nuance worth heeding.
- **Flat-fee / commission-rebate brokers (the "middle ground").** Named repeatedly: **Redfin** (Sign & Save 0.25% buyer rebate; +1% listing fee if buyer is unrepresented), **Clever** ($250 buyer / $500 buy+sell cash back, in 42 states), **Prevu** (up to 1% buyer rebate). Rebates are legal in ~41 states + DC ([Redfin](https://www.redfin.com/why-redfin-how-you-save); [Clever flat-fee](https://listwithclever.com/flat-fee-real-estate/); [RealEstateWitch on Redfin rebates](https://www.realestatewitch.com/redfin-rebates/); [AnytimeEstimate rebates](https://anytimeestimate.com/home-buying/home-buyer-rebates/)).
- **Listing portals for search/comps.** Zillow / Redfin / Realtor.com are the default DIY search + rough-comps layer; buyers note portals *lag the MLS*, a recognized gap `(paraphrased)` ([Housing.info](https://www.housing.info/blog/pros-and-cons-of-home-buying-without-a-realtor); [SoFi](https://www.sofi.com/learn/content/how-to-buy-a-house-without-a-realtor/)).
- **Point apps + spreadsheets.** DIY buyers stitch together single-purpose tools — comps tools ("Comps Chomper"), e-sign ("SignFast"), payment/affordability calculators, and **self-built spreadsheets** for tracking offers/deadlines ([Clever apps](https://listwithclever.com/top-real-estate-apps/); [HomeLight house-buying apps](https://www.homelight.com/blog/buyer-house-buying-apps/)). **No single product ties this together** — the fragmentation is the opportunity.
- **Direct-to-listing-agent contact + dual-agency offers.** On BiggerPockets, solo buyers describe *contacting the listing agent directly and, when countered, either bringing in their own agent or asking the listing agent to credit the buyer-side commission toward the down payment* `(paraphrased)`, while wary of **dual agency** ([BiggerPockets: buying without a buyer's agent](https://www.biggerpockets.com/forums/311/topics/787237-buying-without-buyers-agent)).

**Takeaway for us:** The DIY buyer's real stack today is **attorney + portal + flat-fee/rebate broker + spreadsheets + point apps.** HomeOffer Direct's differentiation is **consolidating that fragmented stack into one guided journey** and, critically, **coaching the buyer to convert the unpaid ~2.5% into a price cut / closing-cost credit** — the dollar outcome the attorney-only and rebate routes only partially deliver.

---

## Tools people ask for → mapped to our roadmap/backlog

| # | Ask surfaced in social listening (Q it came from) | Prevalence signal | Our status | Gap / recommendation |
|---|---|---|---|---|
| 1 | **"What should I offer?" / comps** — hardest DIY gap; buyers fear overpaying (Q1, Q3) | High, recurring | ✅ Shipped ("what should I offer?" + market-conditions read) | Deepen comps data quality; portals lag MLS, so credibility of our comps is the moat. |
| 2 | **Write/submit the offer & contract** without an agent (Q1, Q3) | High | ✅ Shipped (offer builder) | Ensure state-specific forms + attorney handoff; DIY buyers currently use attorneys for exactly this. |
| 3 | **Deadline / paperwork tracking** — the "hidden project-management" value of an agent (Q1) | High (regret literature + failed-deal stat) | ✅ Shipped (deadline reminders) | Highest-leverage risk-reducer given ~70% unrepresented-deal-failure signal; make it prominent. |
| 4 | **Negotiation confidence vs. a pro** — scripts, not a blank box (Q1) | Medium-high | ✅ Shipped (negotiation playbook) | Add the commission-credit negotiation script (convert 2.5% → price cut); this is our unique $ outcome. |
| 5 | **Plain-language "explain this to me" / transparency** (Q1) | High + rising (58% already use AI; ~48% of 2026 buyers will) | 🟡 Prototype (AI explainers) | Strong validated demand — prioritize hardening the prototype. Biggest upside module. |
| 6 | **Financing / pre-approval clarity & tracking** (Q1, Q3) | Medium | ✅ Shipped (financing tracker) | Tie explainers to financing steps (why a pre-approval "disappeared," insurance cost changes). |
| 7 | **Contact the listing agent directly / handle dual-agency & commission credit** (Q3) | Medium (investor forums) | ✅ Shipped (contact-the-listing-agent) | Add guidance on dual-agency pitfalls + how to request the buyer-side credit. |
| 8 | **Consolidate the fragmented stack** (attorney + portal + rebate broker + spreadsheets) (Q3) | The core unmet meta-need | ✅ Core thesis (guided journey) | Position explicitly against the "5 disconnected tools" status quo in messaging. |
| 9 | **Attorney access / handoff** (Q3) — attorney is the #1 DIY substitute | High | ❔ Not a named feature | Consider an attorney-referral / flat-fee-attorney handoff at the contract step — meets buyers where they already go. |
| 10 | **Agent-facing asks** — get buyers to sign, justify compensation, cut admin (Q2) | Prevalent among realtors, but **off-thesis** | ❌ Out of scope | Do **not** pivot to serving buyer's agents; note as future optionality only (hybrid/flat-fee-broker surface). |

---

## Methodology & limitations

- **Search-snippet-based, and unusually constrained this run.** Findings rest on ~18 WebSearch queries. **Reddit is blocked to the search crawler in this environment** (queries scoped to reddit.com are rejected; "reddit …" queries frequently returned "No links found" with only a generic AI summary). **Every forum/blog/news page I tried to open (BiggerPockets, Bogleheads, RISMedia, Redfin, Clever, realestatenews.com) returned HTTP 403 / not fetchable** under this session's egress policy. Consequently I relied on **WebSearch result summaries and link lists**, not on primary page text.
- **No verified verbatim quotes.** Because primary threads were not fetchable, I did **not** reproduce any real quotation. Every buyer/agent "voice" line is labeled `(paraphrased)` and reflects WebSearch's summary of a source, not the source's exact words. Hard numbers are attributed to named surveys/reports that appeared in results (NAR 2025 Profile, NAR 2025 Technology Survey, Redfin commission survey, Clever survey, RISMedia study, Veterans United, NerdWallet). Treat even those as reported-by-search, second-hand.
- **You cannot compute a valid percentage from social media.** Social threads are a **self-selected, vocal, non-representative** sample. All sentiment splits here are **directional impressions** ("plurality," "sizable minority," "recurring") with the sample basis stated per section — never fabricate-precise single percentages. The only percentages given are from named external surveys, and even those measure their own populations, not "Reddit sentiment."
- **Selection & venue bias.** BiggerPockets skews to **investors/experienced buyers** (over-states DIY appetite). The "unrepresented buyer regret" and "dealing with unrepresented buyers" content is largely **agent-authored** (incentive to over-state DIY risk). Agent-tech-saturation stats come from **NAR**, an industry body. These biases pull in opposite directions; I weighted named cross-source surveys over any single blog.
- **Recency & scope.** WebSearch is **US-only**; the current window is mid-2026, so post-NAR-settlement (Aug 2024) dynamics dominate and may still be shifting. Commission-level and unrepresented-share figures are from 2025 reports and will move.
- **Purpose.** This is **sentiment signal for product direction/prioritization, not market sizing.** Use the roadmap-mapping table for backlog weighting, not for demand forecasting or TAM.

---

## Sources

**Prevalence / representation stats**
- NAR — 2025 Profile of Home Buyers and Sellers (88% used an agent): https://www.nar.realtor/magazine/real-estate-news/nar-2025-profile-of-home-buyers-sellers-reveals-market-extremes
- RISMedia — More Unrepresented Buyers, More Experienced Agents (post-settlement shift): https://www.rismedia.com/2025/10/22/more-unrepresented-buyers-more-experienced-agents-study-finds-consumer-shifts-commission-post-settlement/
- Clever — How to Make an Offer on a House Without a Realtor (~29% made an offer without a realtor): https://listwithclever.com/real-estate-blog/make-offer-on-house-without-realtor/

**Buyer sentiment / what buyers want**
- HousingWire — Buyers do independent research but still want an agent (73% / 88% / 45%): https://www.housingwire.com/articles/buyers-are-doing-independent-research-but-they-still-want-an-agent/
- HousingWire — Why the next breakthrough is transparency: https://www.housingwire.com/articles/real-estate-simplicity-transparency/
- Veterans United — More homebuyers turning to AI in 2025 (58%): https://www.veteransunited.com/education/ai-homebuying-survey/
- NerdWallet — 2026 Home Buyer Report (~48% will use AI): https://www.nerdwallet.com/mortgages/studies/home-buyer-report/
- Better — Buying a house without a realtor (guide): https://better.com/content/buying-house-without-realtor
- HomeLight — Make an offer without a realtor: https://www.homelight.com/blog/buyer-how-to-make-an-offer-on-a-house-without-a-realtor/
- Robbie English — Pitfalls of being an unrepresented buyer: https://www.robbieenglish.com/blog/what-are-the-pitfalls-of-being-an-unrepresented-buyer/
- Housing.info — Pros and cons of buying without a realtor 2025: https://www.housing.info/blog/pros-and-cons-of-home-buying-without-a-realtor
- SoFi — How to buy a house without a realtor: https://www.sofi.com/learn/content/how-to-buy-a-house-without-a-realtor/

**Buyer's-agent sentiment / tools**
- realestatenews.com — After a year of NAR's rules, commissions are up (Redfin survey: ~75% worried, ~48% pessimistic): https://www.realestatenews.com/2025/08/16/after-a-year-of-nars-new-rules-commissions-are-up
- National Mortgage News — Agents predict fallout from NAR settlement: https://www.nationalmortgagenews.com/news/real-estate-agents-predict-what-fallout-from-nar-settlement-will-be
- Inman — Buyer's-agent commissions rebound: https://www.inman.com/2025/12/08/buyers-agent-commissions-see-rebound-in-wake-of-settlement/
- NAR — 2025 REALTORS® Technology Survey (~67% say brokerage provides all tools): https://www.nar.realtor/research-and-statistics/research-reports/realtor-technology-survey
- HousingWire — NAR 2025 Technology Survey (AI gaining): https://www.housingwire.com/articles/nar-2025-technology-survey-realtor-tech-usage-trends/
- PrimeStreet — 2025 agent challenges: https://primestreet.ai/real-estate-blog/market-trends/10-industry-challenges-agents-must-overcome-2025
- Matterport — Real estate agent tools 2025: https://matterport.com/blog/real-estate-agent-tools
- eRealEstateCoach — Dealing with unrepresented buyers post-settlement (~70% deal-failure claim): https://www.erealestatecoach2.com/blog/dealing-with-unrepresented-buyers-in-real-estate-protecting-your-sale-earnings-post-nar-settlement

**Support direct buyers used (attorney / flat-fee / rebate / forums)**
- Bogleheads — Lawyer instead of buyer's real estate agent (forum): https://www.bogleheads.org/forum/viewtopic.php?t=245194
- BiggerPockets — Buying without a buyer's agent (forum): https://www.biggerpockets.com/forums/311/topics/787237-buying-without-buyers-agent
- BiggerPockets — How to make an offer on a SFH without an agent (forum): https://www.biggerpockets.com/forums/21/topics/1029788-how-to-make-an-offer-on-a-sfh-without-an-agent
- Seattle Property Lawyer — Use a lawyer instead of an agent: https://seattlepropertylawyer.com/blog/use-a-lawyer-instead-of-a-real-estate-agent-when-buying-a-house
- Lerch Early — Hiring an attorney may save you money: https://www.lerchearly.com/news/hiring-an-attorney-may-save-you-money-when-looking-to-buy-a-home/
- FindLaw — Home-buying agent vs. real estate attorney: https://www.findlaw.com/realestate/buying-a-home/home-buying-agent-vs-real-estate-attorney.html
- Redfin — How you save (rebates / unrepresented +1% fee): https://www.redfin.com/why-redfin-how-you-save
- RealEstateWitch — Redfin buyer rebates 2025: https://www.realestatewitch.com/redfin-rebates/
- Clever — Best flat-fee real estate agents 2025: https://listwithclever.com/flat-fee-real-estate/
- AnytimeEstimate — Home buyer rebates 2025: https://anytimeestimate.com/home-buying/home-buyer-rebates/
- Clever — Top real estate apps (point tools/spreadsheet stopgaps): https://listwithclever.com/top-real-estate-apps/
- HomeLight — Best house-buying apps 2026: https://www.homelight.com/blog/buyer-house-buying-apps/
