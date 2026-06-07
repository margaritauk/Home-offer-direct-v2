# Research Brief: AI-Powered Budget Wizard (Stage 1 "Build your budget")

**Audience:** HomeOffer Direct scrum pod (backlog grounding for expanding the journey's Stage 1 / `build-your-budget` step)
**Prepared by:** Researcher
**Date:** 2026-06-07
**Scope:** Turning the current "Build a realistic budget" step into a richer feature with three pillars — (1) an **AI-powered budget wizard** that helps a buyer build a home-buying budget, (2) an **exportable Excel budget sheet** they can review/modify, and (3) an **interactive interface** to adjust inputs and see the live impact on the monthly mortgage payment. Plus a light look at monetization fit.

> **Existing product context (given):** a savings calculator (`src/lib/savings.ts` + `src/components/savings-calculator.tsx`), a deadline/document tracker (`src/lib/deadlines.ts`, `src/lib/documents.ts`), accounts + cloud sync (`src/lib/sync/*`, Supabase), an offer wizard (`src/lib/offer/*`), and firm AI guardrails: a UPL posture (not legal advice) and a Fair-Housing screening layer at **`src/lib/ai/screening.ts`** (hard allowlist `buildSafeAiInput`, `screenText`, `screenOutput`), with the rule that AI must be **educational/grounded, not advice**, always disclaimed. Recommended model: **Claude (Anthropic), `claude-opus-4-8`**.

> **Builds on** `docs/research/ai-offer-process-research.md` (the AI hallucination liability, FHA-must-not-use-protected-class rule, "ground AI in our own vetted content," freemium watermark→paid-export pattern, Stripe one-time-vs-subscription analysis, FTC "disclaimers don't cure deception"). This brief reuses those guardrails rather than re-deriving them, and extends them to **financial/lending** advice (the offer brief covered legal/UPL) and to the budget/affordability domain.

> **Reuse note:** `src/lib/savings.ts` already implements the down-payment / loan-amount / closing-cost / cash-to-close skeleton with the right defensive-math conventions (`clampPercent`, `safePrice`, `formatUSD`) and a pure-function + `useMemo`-driven slider UI in `src/components/savings-calculator.tsx`. The budget wizard's math module should sit **alongside** these (e.g. `src/lib/budget.ts`) and the interactive UI should **clone the slider/`useMemo` pattern**, not reinvent it. `screenOutput`/`buildSafeAiInput` are the existing FHA gates the AI layer must route through.

---

## Area 1 — Home-buying budget anatomy & affordability math

A complete buyer budget is **not just the sticker price**. It has three layers: the recurring **monthly housing payment (PITI + extras)**, the **upfront cash** (down payment + closing costs + reserves), and the **affordability ceiling** derived from income and debts. Here is each, with the exact formulas we'll implement.

### 1.1 The monthly payment — PITI, PMI, HOA

**PITI** = **P**rincipal + **I**nterest + property **T**axes + homeowners **I**nsurance. This is the canonical monthly figure lenders use to qualify a borrower, and the four components are the baseline of our monthly calculator ([Bankrate – Mortgage Calculator](https://www.bankrate.com/mortgages/mortgage-calculator/); [SoFi – What is PITI](https://www.sofi.com/learn/content/what-is-piti/); [Empower – PITI and the 28% rule](https://www.empower.com/the-currency/life/piti-and-28-percent-rule)). On real budgets you add two more line items:

- **PMI (Private Mortgage Insurance)** — required on conventional loans when the down payment is **< 20%** (i.e. loan-to-value > 80%). Costs roughly **0.46%–1.5% of the loan amount per year** (credit-score dependent: ~0.46% at 760+, up to ~1.5% at 620–639). It can be **requested removed at 80% LTV** and is **automatically removed at 78% LTV** ([Bankrate – PMI basics](https://www.bankrate.com/mortgages/basics-of-private-mortgage-insurance-pmi/); [Bankrate – removing PMI](https://www.bankrate.com/mortgages/removing-private-mortgage-insurance/); [NerdWallet – PMI calculator](https://www.nerdwallet.com/mortgages/calculators/pmi)).
- **HOA dues** — where applicable; average ~**$291/mo** in a 2025 analysis. Counts toward the lender's housing ratio ([Chase – 28/36 rule](https://www.chase.com/personal/mortgage/education/buying-a-home/28-36-rule)).

**How the non-P&I pieces roll into the monthly figure** (all converted to a monthly amount):

```
monthlyTax       = annualPropertyTax / 12          (or homePrice * taxRate% / 12)
monthlyInsurance = annualHomeInsurance / 12
monthlyPMI       = (downPaymentPercent < 20)
                     ? loanAmount * annualPmiRate% / 12
                     : 0
monthlyHOA       = hoaMonthly
monthlyPITI      = M (principal+interest, below) + monthlyTax + monthlyInsurance + monthlyPMI + monthlyHOA
```

### 1.2 The amortization formula (principal + interest)

The fixed monthly principal-and-interest payment **M** for loan principal **P**, monthly rate **r** (= annual rate / 12 / 100), and **n** total payments (= years × 12):

```
M = P · r · (1 + r)^n / ((1 + r)^n − 1)
```

This is the standard US amortized-loan formula, derived from the present value of an annuity / geometric series ([Wikipedia – Amortization calculator](https://en.wikipedia.org/wiki/Amortization_calculator); [hughcalc.org – formula & derivation](https://www.hughcalc.org/formula.php); [LibreTexts – Amortized Loans](https://math.libretexts.org/Courses/Las_Positas_College/Math_for_Liberal_Arts/08:_Consumer_Mathematics/8.05:_Amortized_Loans)). **Edge case to implement:** when `r == 0` (0% rate), the formula divides by zero — fall back to `M = P / n`. (This mirrors the defensive style already in `savings.ts`.)

### 1.3 The affordability ceiling — 28/36 and 43% DTI

Lenders cap how much of gross income goes to housing and to total debt:

- **28% front-end ratio** — max share of **gross monthly income** for the **housing payment** (PITI + PMI + HOA).
- **36% back-end ratio** — max share for **all monthly debt** (housing + car loans, student loans, credit-card minimums, etc.). This is the **DTI** lenders weigh most ([Bankrate – 28/36 rule](https://www.bankrate.com/mortgages/what-is-the-28-36-rule/); [Chase – 28/36 rule](https://www.chase.com/personal/mortgage/education/buying-a-home/28-36-rule); [Hometap – 28/36 explained](https://www.hometap.com/blog/28-36-rule-mortgage-income-ratio)).
- **43% (and up to 45%)** — many lenders accept higher DTI; 43% is the common Qualified-Mortgage reference ceiling, with FHA often 31/43 and VA ~41 ([Bankrate – why DTI matters](https://www.bankrate.com/mortgages/why-debt-to-income-matters-in-mortgages/); [PNC – DTI for a mortgage](https://www.pnc.com/insights/personal-finance/borrow/debt-to-income-ratio-why-is-it-important.html)).

**Reverse "how much house can I afford"** (income + DTI → max price), the computation a wizard runs:

```
grossMonthlyIncome = annualIncome / 12
maxHousingPayment  = grossMonthlyIncome * frontEndRatio          (e.g. 0.28)
maxTotalDebt       = grossMonthlyIncome * backEndRatio           (e.g. 0.36 or 0.43)
housingFromBackEnd = maxTotalDebt − existingMonthlyDebts
maxMonthlyPayment  = min(maxHousingPayment, housingFromBackEnd)  ← binding constraint

# back out the P&I budget, then invert the amortization formula for max loan:
maxPandI    = maxMonthlyPayment − (monthlyTax + monthlyInsurance + monthlyPMI + monthlyHOA est.)
maxLoan     = maxPandI · ((1 + r)^n − 1) / (r · (1 + r)^n)        (inverse of §1.2; r==0 → maxPandI · n)
maxPrice    = maxLoan + downPayment
```

This is the standard lender process: take the **lower** of the front-/back-end caps as the binding monthly payment, then invert amortization to a loan amount and add the down payment ([Zillow – affordability calculator](https://www.zillow.com/mortgage-calculator/house-affordability/); [Reach Home Loans – how much house can I afford 2026](https://www.reachhomeloans.com/how-much-house-can-i-afford-complete-calculator-guide/); rule of thumb: ~3–4× gross annual income). Because taxes/insurance/PMI themselves depend on price, a precise solver iterates; a first version can estimate them as a % of price and solve once.

### 1.4 Upfront cash + reserves + maintenance

- **Down payment** — 2025–26 median ~**10%** (already in our journey copy); FHA floor 3.5%, conventional first-time as low as 3%.
- **Closing costs** — typically **2–5% of the loan** (cash buyers 1–3% of price); national average ~$4,661/single-family in a 2025 Lodestar dataset. Includes lender/origination fees, title insurance (~0.5–1% of price), escrow fees (~1–2%) ([Zillow – closing costs](https://www.zillow.com/learn/closing-costs/); [Bankrate – closing costs vs prepaids](https://www.bankrate.com/real-estate/closing-costs-vs-prepaids/); [The Mortgage Reports – average closing costs](https://themortgagereports.com/35800/guide-to-mortgage-closing-costs-what-average-mortgage-costs-are-and-how-to-keep-yours-low)).
- **Prepaids / escrow reserves at closing** — separate from closing costs: typically **~2–3 months** of homeowners insurance and property taxes deposited to seed the escrow account, plus per-diem interest to month-end ([Newcastle – prepaid items & escrow](https://www.newcastle.loans/mortgage-guide/prepaid-items-mortgage-escrow-account); [Redfin – cash to close](https://www.redfin.com/blog/cash-to-close/)).
- **Cash-to-close** = down payment + closing costs + prepaids/reserves − any seller credits (our `savings.ts` already models the credit/savings offset — extend it with prepaids).
- **Emergency fund / mortgage reserves** — lenders like to see post-close cash; a comfortable buyer keeps a cushion, not "just enough to squeak through."
- **Maintenance budgeting** — common rule of thumb is ~1% of home value per year set aside for upkeep (educational guidance line, not a lender requirement).

---

## Area 2 — The AI layer: what it should and shouldn't do

**The single most important architectural rule:** the **AI never does the math**. LLMs are arithmetically unreliable and hallucinate in regulated domains; the documented best practice in fintech is a **hybrid / neuro-symbolic split — deterministic engines compute, the LLM only interprets and explains** ([Origin – AI financial advisor technical overview](https://useorigin.com/resources/blog/technical-overview); [Squirro – deterministic AI in financial services](https://squirro.com/squirro-blog/deterministic-ai-accuracy); [Money – AI tools struggle with financial advice](https://money.com/ai-tools-financial-advice-struggle/); [BizTech – LLM hallucinations for financial institutions](https://biztechmagazine.com/article/2025/08/llm-hallucinations-what-are-implications-financial-institutions)). For us: **`src/lib/budget.ts` computes PITI/DTI/affordability with the formulas in Area 1; Claude only narrates the result, explains terms, and guides the next input.** This also lets us guarantee the mandatory disclaimer text is rendered verbatim rather than paraphrased by the model.

### 2.1 Financial/lending advice ≈ a licensing line, like UPL

The offer brief established the UPL (legal) line. The budget feature adds a **financial/lending** analogue:

- **SAFE Act / mortgage loan originator (MLO) licensing** regulates anyone who **takes a residential mortgage loan application or offers/negotiates loan terms** for compensation. General homeownership education is outside it; **bona-fide homeownership-education** is explicitly contemplated as non-origination ([12 CFR Part 1008 – SAFE Act](https://www.ecfr.gov/current/title-12/chapter-X/part-1008); [CFPB – SAFE Act exam procedures](https://www.consumerfinance.gov/compliance/supervision-examinations/secure-and-fair-enforcement-for-mortgage-licensing-safe-act-examination-procedures/)). A budget calculator that produces **estimates** and **education** is decision-support, not origination — but it must not present itself as a lender, quote a rate as an offer, or tell the user which loan to take.
- **The industry norm is heavy disclaiming.** Lender/calculator sites uniformly state: **"for educational/illustrative purposes only," "not a lender," "not a lending offer," "not financial advice," "we are not licensed financial advisors/mortgage brokers," "consult a financial professional/licensed lender"** ([MortgageMate – disclaimer](https://mortgagemate.app/disclaimer); [Mortgage Sandbox – calculators disclaimer](https://www.mortgagesandbox.com/calculators-disclaimer); [United Atlantic Mortgage – calculator disclaimer](https://uamva.com/legal-disclaimer-for-mortgage-calculator/); [Fidelity Home Group – calculator disclaimer](https://www.fidelityhomegroup.com/mortgage-calculator-disclaimer/)). Our existing savings calculator already carries a one-line version of this; the wizard needs it **persistently and conspicuously**, not buried.
- **FTC caveat (from the offer brief, still binding):** a disclaimer does **not** cure an otherwise-deceptive practice. The product must actually behave as described (estimates + education), and must not imply the numbers are a guaranteed approval or a real rate quote.

### 2.2 Fair Housing — the budget must not use protected-class info

HUD's 2024 guidance confirms the **Fair Housing Act applies fully to AI/algorithmic** tools, including **affordability/financial assessment**, and that **liability stays with the deployer** even when AI does the work ([HUD guidance summary – Consumer Financial Services Law Monitor](https://www.consumerfinancialserviceslawmonitor.com/2024/05/hud-issues-guidance-on-applicability-of-the-fair-housing-act-to-tenant-screening-and-housing-related-advertising-that-relies-upon-algorithms-and-ai/); [Joshua Law – four lessons from HUD AI guidance](https://www.joshualawfirm.com/2024/05/huds-guidance-about-ai-and-fair-lending/); [HousingWire – HUD FHA guidance on AI](https://www.housingwire.com/articles/hud-issues-fair-housing-act-guidance-on-ai-use/)). Concretely for the budget wizard:

- **Inputs are financial only** — income, debts, savings, price, rate, term, taxes, insurance, HOA, down payment. **Never** collect, infer, or condition on race, color, national origin, religion, sex/gender/orientation, disability, familial status, age, or marital status. (Note: a budget tool **may legitimately ask about income amount**; it must not ask about **source of income** in a way that proxies a protected class, nor about household composition.)
- **Reuse the existing FHA layer.** Route any free-text the user types (e.g. a "notes" field, a chat question to the assistant) through **`screenText`** before it reaches Claude, and gate every model response through **`screenOutput`** before display — exactly as the offer-strength explainer (#36) is designed to. Extend `buildSafeAiInput`'s allowlist philosophy: build a **budget-specific allowlist** of numeric financial fields the AI may see; everything else is excluded by default.
- **No steering.** The assistant must not nudge toward/away from areas, "good school districts," or neighborhood "fit" — same rule as the offer AI.

### 2.3 How to keep it grounded (implementation pattern)

- **Compute-then-explain.** Call `budget.ts`; pass the **numeric results** (not raw user PII) to Claude as the grounding context; ask it to explain/guide in plain English with the disclaimer appended. Recommended model **`claude-opus-4-8`** with **adaptive thinking** (`thinking: {type: "adaptive"}`); for the chat surface, **stream** the response.
- **Structured outputs / tool use** keep the model on-rails: define the budget result as the schema, or expose `budget.ts` as a tool so the model requests a recompute rather than inventing numbers. (Per the Claude reference: deterministic modules handle math, LLM interprets.)
- **Disclaimers rendered by us, not the model** — store the exact "estimates, not financial advice; confirm with a licensed lender" string and render it in the UI chrome so it can't be paraphrased away.
- **Audit trail** — `screenText`/`screenOutput` already return matched-class labels for logging; keep that for the budget surface.

---

## Area 3 — Excel export

### 3.1 Library choice: ExcelJS vs SheetJS (xlsx)

| | **ExcelJS** | **SheetJS / `xlsx`** |
|---|---|---|
| Weekly downloads | ~1.9M | ~7.8M (more formats: 20+) |
| Memory on serverless | **~6× lower** on large files; streaming `createReadStream`/`writeBuffer` keeps heap flat — important on Vercel's fixed-memory functions | Higher memory on large files |
| Formulas in cells | First-class: `cell.formula = '=B2+C2'` or `cell.value = { formula: 'B2+C2', result: 55 }` | Supported, less ergonomic for write-with-formula |
| Styling (headers, currency formats, fills) | Rich (fonts, fills, number formats, data validation) | More limited |
| Client + server | Both (browser build `exceljs/dist/es5/exceljs.browser.js`) | Both |

Sources: [PkgPulse – SheetJS vs ExcelJS vs node-xlsx 2026](https://www.pkgpulse.com/guides/sheetjs-vs-exceljs-vs-node-xlsx-excel-files-node-2026); [mfyz – Node Excel library comparison](https://mfyz.com/nodejs-excel-library-comparison/); [npm trends – exceljs vs sheetjs vs xlsx](https://npmtrends.com/exceljs-vs-sheetjs-vs-xlsx).

**Recommendation: ExcelJS.** Our budget sheet is small (tens of rows) so raw throughput is irrelevant, but ExcelJS wins on the two things that matter here: **lower serverless memory** and **clean formula + currency-format authoring**, which is exactly what a "review/modify" budget sheet needs.

### 3.2 Live formulas vs flat values — embed the formulas

To meet the vision's "**review/modify** in Excel" goal, the sheet should embed **live spreadsheet formulas** so the user can change an input cell (price, rate, down %) and Excel **recalculates the monthly payment** themselves — mirroring our in-app calculator inside their own spreadsheet:

- Lay out **named input cells** (HomePrice, DownPaymentPct, Rate, TermYears, TaxRate, Insurance, HOA, PMIrate) and write the amortization/PITI math as **cell formulas** referencing them, e.g. `=PMT(Rate/12, Term*12, -Loan)` for P&I, plus the tax/insurance/PMI/HOA roll-up.
- Set `cell.formula` **and** a pre-computed `result` so the number shows immediately before Excel recalculates ([ExcelJS formulas – Medium guide](https://medium.com/@shaikh.nadeem/how-to-implement-conditional-hyperlinks-and-formulas-in-excel-with-exceljs-a-complete-code-guide-f5f849b00781); [studyraid – ExcelJS formulas](https://app.studyraid.com/en/read/12493/404006/working-with-formulas)). Excel recalculates on open.
- A **flat-values** variant (no formulas) is a simpler v1 if formula authoring proves fiddly — but it loses the "modify and watch it recalc" payoff, so embed formulas in the shipped version.

### 3.3 Client vs server generation

- **Client-side** (`workbook.xlsx.writeBuffer()` → `new Blob([buf])` → `file-saver` `saveAs`) is the simplest path, keeps PII off our servers, and has zero serverless cost ([ExcelJS browser usage – issue #1556](https://github.com/exceljs/exceljs/issues/1556); [ExcelJS client-side discussion #2496](https://github.com/exceljs/exceljs/discussions/2496)). Use the **non-minified** browser build for compatibility.
- **Server-side** (Next.js Route Handler builds the buffer, returns it with `Content-Disposition: attachment` + xlsx MIME) is the right place if export becomes a **paid/gated** artifact (watermark logic, entitlement check, email-to-self) — same pattern the offer term-sheet export will use ([Dave Gray – download xlsx from a Next.js route handler](https://www.davegray.codes/posts/how-to-download-xlsx-files-from-a-nextjs-route-handler)).
- **Recommendation:** client-side for the **free** sheet; server-side route for the **paid/clean** sheet (so entitlement and watermarking are enforced server-side).

### 3.4 CSV fallback

A plain **CSV** export (flat values, comma-separated, generated with no dependency) is a trivial, universally-openable fallback worth shipping alongside xlsx — it can't carry live formulas or styling but covers users on Google Sheets / Numbers / anything. Cheap to add; offer it as a secondary "Download CSV" button.

---

## Area 4 — Interactive monthly-payment interface

The pattern is well established: **sliders/number-inputs that recompute the monthly payment live**, with a visual **PITI breakdown**. Slider-driven "what-if" calculators are exactly what buyers and investors expect ([Slider Calc – mindshocker](https://www.mindshocker.com/slider-calc/); [Zillow mortgage calculator](https://www.zillow.com/mortgage-calculator/); [Bankrate mortgage calculator](https://www.bankrate.com/mortgages/mortgage-calculator/); [calculator.net mortgage](https://www.calculator.net/mortgage-calculator.html)).

**Reuse our own pattern.** `src/components/savings-calculator.tsx` already implements the right shape: a reusable `Field` slider component, `useState` per input, a single `useMemo` over a pure calc function, and a results card. The budget interface clones this:

- **Inputs (sliders + entry):** home price, down payment %, interest rate, loan term (15/30 yr), property tax (rate or $/yr), homeowners insurance ($/yr), HOA ($/mo), and an auto-derived **PMI** toggle (shown only when down payment < 20%). Optionally income + monthly debts for the affordability ceiling.
- **Live recompute:** `useMemo(() => computeBudget(inputs), [inputs])` — instant, no network, deterministic (the Area-1 formulas).
- **Breakdown display:** show **monthly PITI as a stacked breakdown** (P&I / tax / insurance / PMI / HOA) so the user sees what drives the number — a stacked bar or a labeled list like the savings calculator's `<dl>` rows. Show the total monthly figure prominently (like the brand-color "captured savings" card).
- **Affordability badge (optional):** compute front-/back-end DTI for the current price and flag green/amber when within/over 28/36 (educational, not a verdict).
- **Same disclaimer footer** as the savings calculator ("Estimates only — not financial advice…").

This interactive view, the export, and the AI explainer all sit on the **one shared `budget.ts` compute module** — single source of truth for the math across UI, Excel result-prefill, and AI grounding.

---

## Area 5 — Monetization fit (light)

The Excel export fits the **existing freemium pattern** the offer brief recommends: **free = watermarked / limited, paid = clean, downloadable, emailable** ([offer brief §3](./ai-offer-process-research.md)). Concretely:

- **Free:** the live interactive calculator (keep the educational core free — good for the SAFE-Act/education posture and for funnel), plus a **watermarked** xlsx and/or a CSV.
- **Paid:** a **clean, branded, no-watermark** xlsx budget sheet with live formulas + email-to-self, generated **server-side** (entitlement enforced there).
- **Billing:** prefer a **one-time per-export** Stripe charge (sidesteps auto-renewal / ROSCA / state ARL compliance), or bundle into a journey subscription — same analysis and guardrails as the offer term-sheet, not re-litigated here.
- **FTC posture:** don't imply the sheet is lender-prepared or a guaranteed approval; charging raises the bar that the artifact match what's promised.

---

## Implications & guardrails + proposed stories

### Hard guardrails (carry into every story's acceptance criteria)

- **AI never computes.** `budget.ts` (deterministic) does all math; Claude only explains/guides. Hybrid compute-then-explain is the documented anti-hallucination pattern for financial tools.
- **Estimates + education, not advice.** Persistent, conspicuous disclaimers: "estimates only, not financial advice, not a lender/lending offer, confirm with a licensed lender." Rendered by us (verbatim), not paraphrased by the model. Disclaimers don't cure deception (FTC) — the product must behave as described.
- **Fair Housing.** Financial inputs only; never collect/infer/condition on protected class (incl. household composition / source-of-income proxies). Route free-text through **`screenText`**, gate model output through **`screenOutput`**, build a **numeric budget allowlist** in the `buildSafeAiInput` spirit. HUD: liability stays with us even when AI does the work.
- **No steering**, no rate-as-offer, no "you should take this loan."
- **Model:** Claude `claude-opus-4-8`, adaptive thinking, streaming for chat; structured outputs / tool use to keep it grounded.
- **Reuse, don't reinvent:** extend `savings.ts` conventions and the `savings-calculator.tsx` slider/`useMemo` UI; reuse the screening layer and the freemium/Stripe pattern from the offer brief.

### Candidate stories

**Buildable now (no new vendor, low legal risk — pure compute + UI + existing patterns):**

1. **Budget math engine (`src/lib/budget.ts`)** — Pure functions for the amortization formula (with `r==0` fallback), PITI roll-up, PMI (auto when down<20%), HOA, and DTI; mirrors `savings.ts` conventions (`clampPercent`, `formatUSD`). Unit-tested like `savings.test.ts`.
2. **Reverse affordability solver ("how much house can I afford")** — From income + DTI (28/36, configurable to 43%) + existing debts, return the binding monthly cap, max loan (inverse amortization), and max price; surface a green/amber DTI badge.
3. **Interactive monthly-payment calculator with PITI breakdown** — Slider/input UI cloned from `savings-calculator.tsx`; live `useMemo` recompute; stacked PITI breakdown (P&I / tax / insurance / PMI / HOA); PMI toggle appears only when down<20%; estimates disclaimer footer.
4. **Client-side Excel (xlsx) export with live formulas** — ExcelJS browser build; named input cells + embedded amortization/PITI formulas (e.g. `PMT`) so the user can modify and Excel recalculates; pre-computed `result` for instant display; currency number formats.
5. **CSV fallback export** — Dependency-free flat-values CSV "Download CSV" button alongside xlsx.
6. **Wire the wizard into the Stage-1 `build-your-budget` journey step** — Replace/augment the current static copy + task list (`src/lib/journey/data.ts`) with the live calculator + affordability output; keep the existing tasks (pull credit, set down-payment target, budget closing costs, build reserves) as the checklist.
7. **Budget persistence via existing cloud sync** — Save a user's budget inputs/results through `src/lib/sync/*` (Supabase) so it carries across the journey and per-home dashboard.

**AI / vendor / legal-review-gated:**

8. **Grounded AI budget explainer/guide (Claude)** — Compute-then-explain: pass `budget.ts` numeric results to `claude-opus-4-8`; explain PITI/DTI/PMI and guide the next input in plain English; route all free-text through `screenText`, gate output through `screenOutput`, ground with structured outputs/tool use; verbatim disclaimer rendered by us. *(AI + FHA review)*
9. **Server-side clean/paid Excel export (freemium)** — Next.js Route Handler builds a branded, no-watermark xlsx with live formulas; entitlement + watermark enforced server-side; optional email-to-self. Free tier gets the watermarked/client-side sheet. *(Vendor: Stripe billing; legal review of "not lender-prepared" framing)*
10. **AI affordability "budget coach" chat** — Conversational surface over the budget engine (tool-use lets Claude request recomputes); strictly financial scope, FHA-screened both directions, no steering, no rate-as-offer; one-time-charge or subscription gating per the offer-brief monetization analysis. *(AI + FHA + financial-disclaimer review; possibly Stripe)*

### Recommended phasing

1. **Phase 1 (now):** stories 1–3 (engine + affordability + interactive UI) → the core feature, all deterministic and low-risk.
2. **Phase 2 (now):** stories 4–7 (xlsx + CSV export, journey wiring, persistence).
3. **Phase 3 (AI + review):** story 8 (grounded explainer), then story 10 (coach chat).
4. **Phase 4 (paid pipeline):** story 9 (server-side clean/paid export + Stripe), reusing the offer term-sheet's billing + watermark plumbing.
