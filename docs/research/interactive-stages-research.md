# Research / Design Brief: Make Every Journey Stage Interactive

**Audience:** HomeOffer Direct scrum pod (PM backlog grounding — turn the 14-stage guided journey from *read-about-it* into *do-it-in-app*)
**Prepared by:** Researcher
**Date:** 2026-06-07
**Scope:** For each of the 14 canonical stages in `src/lib/journey/data.ts`, define the concrete **interactive interface(s)** that let a self-serve buyer *perform* that step in-app; map **reuse vs. gap**; tag **buildable-now vs. gated** with the governing **guardrail**; and propose a **wave / epic / story backlog** the PM can convert straight into GitHub issues.

---

## How this builds on what already exists (no duplication)

The journey spine is `src/lib/journey/data.ts` — 14 stages, each with steps + `tasks[]`. Today most stages render **static copy + a checkbox task list** (`step-checklist.tsx`, persisted via `useProgress`). Two stages already have real interactive tools; several have supporting infrastructure. This brief fills the gaps between them.

**Already built (the reuse surface):**

| Module / route | What it gives us | Stage(s) it serves today |
|---|---|---|
| `src/lib/savings.ts` + `savings-calculator.tsx` (`/tools/savings-calculator`) | Slider→`useMemo`→results-card pattern; down-payment / loan / closing-cost / cash-to-close math; `formatUSD`, `clampPercent` conventions | Get Ready, Make an Offer (commission savings) |
| `docs/research/budget-wizard-research.md` | Full spec for budget engine (`budget.ts`), affordability solver, PITI breakdown UI, xlsx/CSV export, grounded AI explainer | Get Ready (speced, not built) |
| `src/lib/offer/*` + `src/components/offer/*` (`/tools/offer-builder`) | Offer worksheet model, 5 contingencies (educational), term-sheet generator + disclaimer, concession/commission ask, offer deadlines | Make an Offer (built) |
| `src/lib/deadlines.ts` + `tracker-app.tsx` (`/tracker`) | Contract→milestone engine (earnest, inspection, appraisal, financing, title, CD 3-day rule, walkthrough, closing); business-day math; status (overdue/today/soon) | Under-contract → Closing (cross-cutting) |
| `src/lib/documents.ts` + `document-checklist.tsx` | Canonical doc list grouped by phase, status-tracked | Pre-Approval, Offer, Inspection, Closing, Post-Purchase |
| `src/lib/showings/*` (`/showings`) | Per-listing pipeline (interested→…→offer), schedule, rating, notes; FHA-safe contact templates (`templates.ts`) | Tour & Evaluate |
| `src/lib/offer-status/*` (`/offer-status`) | Offer lifecycle (draft→sent→submitted→countered→accepted/rejected/expired) + expiration clock + status notes | Negotiate / Under Contract |
| `src/lib/homes/rollup.ts` (`/dashboard`) | Per-home rollup: journey % + showing + offer + next deadline + outstanding docs + "next action" deep link | cross-cutting |
| `src/lib/listings/*` (`/listings`) | Listing provider abstraction (mock now, swappable for live feed) + browser | Search |
| `src/lib/states/*` (`/states`) | 50-state legal engine: closing path, attorney-required, disclosure regime, transfer tax, dual agency, e-sign/RON status, sources | Search (disclosures), Negotiate, Title, Closing |
| `src/lib/sync/*` (`local-store.ts`, `merge.ts`, `remote.ts`) | The cloud-sync pattern: per-key localStorage stores → `SyncData` → Supabase, with `emitLocalChange()` + LWW merge | persistence for everything |
| `src/lib/ai/screening.ts` + `docs/research/ai-offer-process-research.md` | FHA guardrail foundation: `AI_INPUT_ALLOWLIST`/`buildSafeAiInput`, `screenText` (input redaction), `screenOutput` (output reject); UPL/FHA/SAFE-Act posture, "AI never computes / never advises" | every AI surface |
| `src/lib/pros/*` (`/pros`) | Vetted-pro directory + handoff (attorney, inspector, lender) | every "flag a pro" hand-off |

**The persistence rule for all new tools:** follow `sync/local-store.ts` — add a versioned key (`hod:<feature>:v1`), a typed slice on `SyncData` (`sync/types.ts`), wire it into `readLocal`/`writeLocal` + the LWW `merge.ts`, and call `emitLocalChange()` on write. Per-home tools should be **keyed by `listingId`** (like `ShowingMap`/`OfferStatusMap`) so they roll up into the dashboard (`homes/rollup.ts`).

**The guardrail vocabulary** (carried as AC tags below):
- **UPL** — no drafting/modifying clauses, no "which terms to pick," no opining on legal effect → route to attorney (`pros`), branch on attorney-states via the legal engine.
- **Fair Housing (FHA)** — no protected-class collection/inference/steering; route free-text through `screenText`, gate AI output through `screenOutput`; no love letters.
- **SAFE Act / financial** — estimates + education only, "not a lender / not financial advice," AI never computes (deterministic engine does).
- **ESIGN/UETA** — real e-signature needs intent + consent + attribution + retention; branch state formalities via legal engine (closing-stage, mostly gated).
- **Data licensing** — live listings/comps/MLS, real lender rates, official association forms are copyright/feed-gated.

---

## Per-stage interactive map

Legend — **B** = buildable now (pure compute/UI + existing patterns, low legal risk); **G** = gated (needs vendor/API, real-data pipeline, AI key, or legal review).

### 1 — Get Ready  `get-ready`
- **Interactive interfaces:** (a) **Budget wizard** — affordability solver + live PITI breakdown + xlsx/CSV export (fully speced in `budget-wizard-research.md`); (b) **Credit-readiness checklist** — interactive version of the existing `pull-credit` / `pay-down-balances` / `season-funds` tasks, with a self-reported credit-band selector and a "what each band typically means for rate" *educational* note; (c) **Savings-goal tracker** — target (down payment + 2–5% closing + reserves) vs. current-saved progress bar.
- **Reuse:** `savings.ts` + savings-calculator slider pattern; existing Stage-1 tasks; `useProgress`.
- **Gap (new):** `src/lib/budget.ts` engine + budget UI; a `creditReadiness` slice; a `savingsGoal` slice.
- **B/G:** budget engine + UI + savings goal = **B**; grounded AI budget explainer = **G** (AI + FHA/financial review).
- **Guardrail:** SAFE Act/financial (estimates only, AI never computes), FHA (financial inputs only — no source-of-income/household-composition).
- **Persistence:** yes — `hod:budget:v1`, `hod:savings-goal:v1`; feed dashboard "readiness %".

### 2 — Get Pre-Approved  `get-pre-approved`
- **Interactive interfaces:** (a) **Lender comparison table** — user enters 2–3 Loan Estimates (rate, APR, monthly P&I, total fees, points, lender credits); tool normalizes and highlights the lowest total-cost over a horizon (apples-to-apples LE comparison the journey copy already preaches); (b) **Doc-prep checklist** — interactive bind of `documents.ts` "Financing & pre-approval" group; (c) **Pre-approval tracker** — per-lender status (applied → LE received → pre-approved → letter in hand) + the "avoid new credit" reminder.
- **Reuse:** `documents.ts` financing group + `document-checklist.tsx`; savings-card layout for the comparison results; `formatUSD`.
- **Gap (new):** `lenderCompare` engine (pure LE-normalization math + slice) + table UI; `preApprovalTracker` slice.
- **B/G:** comparison table + tracker (user types in their own LE numbers) = **B**; auto-pulling live lender rates = **G** (data licensing).
- **Guardrail:** SAFE Act/financial — compare what the *user* enters; never present a rate as an offer, never recommend a lender; "not a lender, confirm terms."
- **Persistence:** yes — `hod:lender-compare:v1`, `hod:preapproval:v1`; surface "pre-approved?" on dashboard.

### 3 — Search  `search`
- **Interactive interfaces:** (a) **Saved searches / criteria** — persist price ceiling, location, beds, must-haves; (b) **Compare-homes side-by-side** — pick 2–4 tracked listings, table of price/$ per sqft/beds/baths/DOM/notes; (c) **Comps worksheet** — user logs comparable recent sales (address, sold price, sqft, beds, condition, date) and the tool computes $/sqft and a suggested fair-value range to defend against overpaying; (d) **State-disclosure lookup** — already covered by the legal engine, surface it inline on the search page.
- **Reuse:** `listings/*` provider + `listings-browser.tsx`; `showings` records (the homes to compare are tracked listings); `states/*` disclosure regime; `selected-state-guide.tsx`.
- **Gap (new):** `savedSearch` slice; `compareHomes` selector over showings + listing data; `comps` worksheet engine (pure $/sqft + range math) + slice.
- **B/G:** saved criteria, compare table, comps worksheet (manual entry) = **B**; live MLS/portal listing feed + auto-pulled sold comps = **G** (data licensing — `listings/provider.ts` is built to swap).
- **Guardrail:** FHA — no demographic/"good schools"/neighborhood-fit steering in criteria or any AI summary; data licensing for live feeds.
- **Persistence:** yes — `hod:saved-search:v1`, `hod:comps:v1` (keyed by `listingId`); comps roll into per-home dashboard + offer-price defense.

### 4 — Tour & Evaluate  `tour-and-evaluate`
- **Interactive interfaces:** (a) **Tour scheduler + contact** — already built (`showings` schedule + FHA-safe `templates.ts`); (b) **Per-home tour checklist / scorecard** — structured condition checklist (roof, foundation, water, windows, HVAC age, electrical, plumbing) with per-item pass/concern/flag + a weighted score, and a free-text notes field (screened); compare scorecards across homes.
- **Reuse:** `showings` records (status, rating, notes, `scheduledAt`); contact templates; the compare-homes table from Stage 3.
- **Gap (new):** `tourScorecard` — a canonical checklist template (like `documents.ts`/`contingencies.ts`) + per-listing scorecard slice keyed by `listingId`; scorecard UI; surface score on the showing card + dashboard.
- **B/G:** **B** (pure checklist + scoring + UI).
- **Guardrail:** FHA — checklist items are property facts only; run the notes field through `screenText` (mirror the showings-notes guardrail).
- **Persistence:** yes — `hod:tour-scorecard:v1` keyed by `listingId`; feeds dashboard.

### 5 — Make an Offer  `make-an-offer`
- **Interactive interfaces:** **Offer wizard** — *built* (`offer/*`, `offer-builder`): price, earnest, financing, contingencies (educational), closing date/possession, commission-savings concession ask, term-sheet export with disclaimer.
- **Reuse / gap:** mostly built. Gaps already speced in `ai-offer-process-research.md`: grounded **AI offer-strength explainer** (#36 — uses `buildSafeAiInput`/`screenOutput`), **PDF/term-sheet export** (free watermarked vs. paid clean), **state-form auto-fill** (UPL safe-harbor + licensed templates).
- **B/G:** wizard = **built**; AI explainer = **G** (AI+FHA); PDF export = **G** (vendor); auto-fill real forms = **G** (legal review + form licensing).
- **Guardrail:** UPL (worksheet not contract; no clause drafting), FHA (AI explainer screened, no love letters).
- **Persistence:** built — `hod:offer:v1`.

### 6 — Negotiate & Go Under Contract  `negotiate-and-go-under-contract`
- **Interactive interfaces:** (a) **Counter-offer tracker** — log each round (who countered, price, repairs/credits, dates) against the offer worksheet, showing the delta from your last position and your walk-away number; (b) **Attorney-review checklist** — interactive "did the signed contract keep every contingency + deadline I negotiated?" verification, branching on attorney-states (legal engine) to prompt hiring counsel via `pros`.
- **Reuse:** `offer-status` reducer (already has `countered` + status notes — extend, don't replace); `offer` worksheet (the baseline terms); `states` attorney-required flag; `pros` handoff.
- **Gap (new):** a `counterRounds` structure on (or alongside) the offer-status record; counter-tracker UI; an attorney-review checklist template.
- **B/G:** **B** (extends existing offer-status + a checklist).
- **Guardrail:** UPL — track *facts the user enters*, never advise which counter to make or opine on legal effect; route to attorney, hard-prompt in attorney-states.
- **Persistence:** yes — extend `hod:offer-status:v1` (notes already exist) or add `hod:counters:v1`; surface latest round on dashboard.

### 7 — Earnest Money & Open Escrow  `earnest-money-and-open-escrow`
- **Interactive interfaces:** (a) **Wire-fraud verification checklist** — a forced-sequence checklist ("call escrow on an independently-verified number," "confirm account by phone," "send," "get written receipt") with a prominent warning banner; (b) **Escrow tracker** — record escrow holder, EMD amount, date due (already a milestone), date sent, receipt confirmed, and the refund-conditions note.
- **Reuse:** `deadlines.ts` earnest-money milestone (date already computed); `documents.ts` "earnest-receipt"; tracker UI.
- **Gap (new):** `escrow` slice (holder, amount, sent/received flags, refund note) + the wire-fraud checklist template; UI.
- **B/G:** **B** (checklist + record).
- **Guardrail:** consumer-protection / fraud-prevention copy (highest-value safety feature in the journey — wire fraud); no advice, just a verification flow.
- **Persistence:** yes — `hod:escrow:v1`; feed dashboard "earnest sent?" + tie to the earnest-money deadline.

### 8 — Inspection  `inspection`
- **Interactive interfaces:** (a) **Inspector scheduler** — book within the inspection-contingency window (deadline engine already computes it) + hire-an-inspector handoff (`pros`); (b) **Inspection-findings logger** — log each finding (system, severity, est. repair cost, photo note), separating cosmetic from major; (c) **Repair-request builder** — turn flagged findings into a neutral, written repair/credit request (worksheet, like the term-sheet) to submit before the deadline.
- **Reuse:** `deadlines.ts` inspection milestone + status; `pros` (inspector); `documents.ts` "inspection-report"/"repair-requests"; term-sheet's worksheet+disclaimer pattern for the request builder.
- **Gap (new):** `inspectionFindings` slice (keyed by `listingId`) + logger UI; a repair-request generator (pure, like `term-sheet.ts`).
- **B/G:** logger + scheduler = **B**; repair-request *generator* = **B** but keep it a neutral worksheet (UPL); attaching specialized-inspection vendor booking = **G**.
- **Guardrail:** UPL — request is a worksheet to hand to the seller/attorney, never advice on whether to walk; FHA n/a.
- **Persistence:** yes — `hod:inspection:v1` keyed by `listingId`; tie to inspection deadline; outstanding repair items on dashboard.

### 9 — Appraisal & Financing/Underwriting  `appraisal-and-underwriting`
- **Interactive interfaces:** (a) **Clear-to-close tracker** — checklist of underwriting conditions (appraisal ordered → received → conditions requested → submitted → clear-to-close) with same-day-response nudges; (b) **Low-appraisal scenario tool** — if appraisal < price, model the 3 options (renegotiate, bring cash, use appraisal contingency) with the cash-gap math; (c) **Rate-lock + insurance binder mini-tracker** — lock confirmed? insurance bound + proof sent to lender?
- **Reuse:** `deadlines.ts` appraisal + financing milestones; `savings.ts` for the cash-gap math; `documents.ts` "clear-to-close"/"homeowners-insurance"/"appraisal-report"; `pros` (lender, insurer).
- **Gap (new):** `financingTracker` slice (conditions list + flags); low-appraisal calculator (pure, reuses savings math); insurance/lock sub-tracker.
- **B/G:** **B** (trackers + calculator); pulling live appraisal status from a lender = **G** (data/integration).
- **Guardrail:** SAFE Act/financial — estimates only, not a lender; no advice on which option to take (present the trade-offs).
- **Persistence:** yes — `hod:financing:v1`; tie to appraisal/financing deadlines; "clear to close?" on dashboard.

### 10 — Title & Escrow  `title-and-escrow`
- **Interactive interfaces:** (a) **Title-review checklist** — walk the title commitment (liens, unpaid taxes, easements, boundary issues, clerical errors); log each exception, who's clearing it, and by when; (b) **Owner's-title-insurance decision aid** — neutral pros/cons + one-time-premium framing (educational); (c) **Closing-path confirmer** — already in the legal engine (attorney vs. escrow state); surface it inline and route to an attorney via `pros` in attorney-states.
- **Reuse:** `states/*` closing path + attorney-required + `dualAgency`; `deadlines.ts` title-review milestone; `documents.ts` "title-commitment"/"title-policy"; `pros`.
- **Gap (new):** `titleReview` slice (exception list + resolution status) + checklist UI; decision-aid content.
- **B/G:** **B** (checklist + content + legal-engine surfacing).
- **Guardrail:** UPL — log facts, don't opine on whether a defect is "clear"; route to title co./attorney; legal-engine branch.
- **Persistence:** yes — `hod:title:v1`; tie to title-review deadline; outstanding title items on dashboard.

### 11 — Closing Disclosure Review  `closing-disclosure-review`
- **Interactive interfaces:** **CD-vs-Loan-Estimate comparison tool** — user enters LE and CD figures (loan amount, rate, monthly payment, cash-to-close, itemized fees); tool diffs them line-by-line, flags increases beyond CFPB tolerance buckets (0% / 10% / unlimited categories — *educational*), and confirms the **3-business-day rule** date (already computed by `deadlines.ts` `businessDaysBefore`).
- **Reuse:** `deadlines.ts` CD 3-day milestone + `businessDaysBefore`; `lenderCompare` table component from Stage 2 (same LE inputs — reuse the entered LE!); `documents.ts` "closing-disclosure"; `formatUSD`.
- **Gap (new):** `cdCompare` engine (pure diff + tolerance-bucket flags) + UI; reuse the LE the buyer already entered in Stage 2.
- **B/G:** **B** (pure compute + UI).
- **Guardrail:** SAFE Act/financial — flag discrepancies for the user to raise with their lender; not financial advice; tolerance buckets are educational.
- **Persistence:** yes — `hod:cd-review:v1`; tie to the CD deadline; "CD reviewed?" on dashboard.

### 12 — Final Walkthrough  `final-walkthrough`
- **Interactive interfaces:** **Walkthrough checklist** — structured, mobile-friendly: verify each negotiated repair done (pulls flagged items from the Stage-8 inspection/repair record), test systems (faucets, toilets, HVAC, outlets, appliances), check fixtures convey, log new damage with photo notes; produces a pass/issues summary to raise *before* signing.
- **Reuse:** `deadlines.ts` final-walkthrough milestone; the inspection/repair-request record (Stage 8) to auto-list "confirm these repairs"; the tour-scorecard UI pattern (Stage 4).
- **Gap (new):** `walkthrough` slice keyed by `listingId` + checklist UI (composes inspection findings + a systems-test list).
- **B/G:** **B**.
- **Guardrail:** none heavy — property facts only; screen any free-text notes.
- **Persistence:** yes — `hod:walkthrough:v1` keyed by `listingId`; tie to walkthrough deadline.

### 13 — Closing / Settlement  `closing-settlement`
- **Interactive interfaces:** (a) **Closing-day checklist** — re-verify wire instructions by phone (the wire-fraud check returns at max dollars), bring ID + certified funds, confirm time/place/attendees, attorney attending? (legal-engine branch); (b) **Cash-to-close summary** — pull the confirmed CD cash-to-close figure and present it with the funds-arrangement reminder (wire vs. cashier's check, bank lead time).
- **Reuse:** `deadlines.ts` closing milestone; Stage-7 wire-fraud checklist (reuse the template); Stage-11 CD cash-to-close figure; `states` attorney-vs-escrow; `documents.ts` "certified-funds"/"id"; `pros` (attorney).
- **Gap (new):** `closingDay` checklist slice (mostly composed from existing data) + UI; cash-to-close summary view.
- **B/G:** checklist + summary = **B**; actual **e-signature / RON** at the table = **G** (vendor + ESIGN/UETA + state RON law via legal engine).
- **Guardrail:** fraud-prevention (wire), ESIGN/UETA (if e-sign added), UPL (attorney branch).
- **Persistence:** yes — `hod:closing-day:v1`; tie to closing deadline; "closed?" flips the dashboard card to Stage 14.

### 14 — Post-Purchase  `post-purchase`
- **Interactive interfaces:** (a) **Move-in checklist** — utilities transfer, address change, locks/security; (b) **Homestead / tax-exemption + utilities tracker** — per-item status, with state-aware homestead links (legal engine); (c) **Payment & maintenance reminders** — first-payment-due + autopay reminder, plus a recurring maintenance schedule (~1%/yr rule, seasonal tasks); (d) **Document vault confirm** — confirm deed recorded + closing package stored (ties off `documents.ts` "Keep after closing").
- **Reuse:** `documents.ts` post-closing group; `states` (homestead varies by state — extend the profile or link out); `deadlines.ts` date math for the first-payment reminder.
- **Gap (new):** `postPurchase` slice (move-in + exemptions + maintenance schedule) + UI; optional homestead links per state.
- **B/G:** checklists + reminders = **B**; real calendar/utility/notification integrations = **G** (vendor); state homestead detail = **B** but may want legal review of links.
- **Guardrail:** light — financial/tax framing stays educational ("file where available," not tax advice).
- **Persistence:** yes — `hod:post-purchase:v1`; final dashboard state.

---

## Proposed backlog structure — 3 new waves

Grouped by journey phase so each wave ships a coherent slice of the funnel. Cross-cutting dependencies on existing modules are flagged. Within each wave, **B** stories are sprint-sized and ship first; **G** stories follow after vendor/legal/AI enablement. The already-speced **Budget Wizard** (`budget-wizard-research.md`) and the **AI offer / PDF / dashboard** work (`ai-offer-process-research.md`) are *referenced, not duplicated* — they slot into Waves A and B respectively.

### Wave A — Pre-offer interactive tools (Stages 1–4)
*Goal: a buyer can get financially ready, compare lenders, search/compare/comp homes, and score tours — all interactively. Mostly **B**.*

### Wave B — Under-contract interactive tools (Stages 5–10)
*Goal: from accepted offer through title, every contingency step has a tracker/logger/builder, anchored to the existing deadline engine. Mostly **B**, AI/forms gated.*

### Wave C — Closing & post-purchase tools (Stages 11–14)
*Goal: catch CD errors, run the walkthrough, close safely, and settle in. All **B** except e-sign/RON and live integrations.*

---

## Candidate story list (titles + acceptance criteria + priority + tag)

> Conventions in every story's AC: persist via the sync pattern (`hod:<feature>:v1` + `SyncData` slice + `merge.ts` + `emitLocalChange()`); per-home tools keyed by `listingId` and surfaced in `homes/rollup.ts`; pure engine + unit tests mirroring `savings.test.ts`/`deadlines.test.ts`; reuse the `Field`/`useMemo`/results-card UI from `savings-calculator.tsx`; conspicuous disclaimer where a guardrail applies.

### Wave A — Pre-offer

**A1. Credit-readiness checklist & savings-goal tracker** — *P1 · B · FHA/financial*
- Interactive bind of Stage-1 credit/savings tasks + self-reported credit-band selector with educational "what this band typically means for rate" note (no advice).
- Savings-goal: target = down payment + 2–5% closing + reserves; progress bar vs. current-saved input.
- Persists; contributes a "readiness %" to the dashboard. Depends on `savings.ts`, `useProgress`.

**A2. Budget wizard (engine + affordability + PITI UI)** — *P1 · B · SAFE Act/financial*
- Implements `budget-wizard-research.md` stories 1–3: `src/lib/budget.ts` (amortization w/ r==0 fallback, PITI roll-up, PMI auto <20%, DTI), reverse affordability solver, live slider UI with stacked PITI breakdown + estimates disclaimer.
- AI never computes; deterministic engine only. Unit-tested. (Sub-issues per the budget brief.)

**A3. Budget export (xlsx + CSV) & journey wiring + persistence** — *P2 · B (server/paid export = G) · SAFE Act/financial*
- Budget brief stories 4–7: client-side ExcelJS with live formulas, CSV fallback, wire into Stage-1 step, persist via sync. Server-side clean/paid export is the **G** follow-up (Stripe).

**A4. Lender comparison table** — *P1 · B · SAFE Act/financial*
- User enters 2–3 Loan Estimates (rate, APR, monthly P&I, total fees, points, credits); tool normalizes and flags lowest total cost over a chosen horizon.
- Never presents a rate as an offer or recommends a lender; "not a lender" disclaimer. Reuses `formatUSD` + savings results-card. Persists `hod:lender-compare:v1`. (Auto-pull live rates = separate **G** story.)

**A5. Pre-approval & doc-prep tracker** — *P2 · B · financial*
- Per-lender status pipeline (applied → LE received → pre-approved → letter) + interactive `documents.ts` financing group + "avoid new credit" reminder.
- Persists `hod:preapproval:v1`; surfaces "pre-approved?" on dashboard. Depends on `documents.ts`.

**A6. Saved searches & criteria** — *P2 · B · FHA*
- Persist price ceiling/location/beds/must-haves; no demographic/"schools"/fit fields. Drives `listings` browser + alerts placeholder. Persists `hod:saved-search:v1`. Depends on `listings/provider.ts`.

**A7. Compare-homes side-by-side** — *P1 · B · (live data = G) · FHA*
- Select 2–4 tracked homes; table of price/$ per sqft/beds/baths/DOM/notes; sourced from `showings` + listing data.
- No steering in any summary. Persists selection. Depends on `showings`, `listings`.

**A8. Comps worksheet** — *P1 · B (auto-comps = G) · FHA/data-licensing*
- User logs comparable sales (address, sold price, sqft, beds, condition, date); computes $/sqft + suggested fair-value range to set offer price.
- Manual entry now; auto-pulled sold comps = gated **G** (data licensing). Persists `hod:comps:v1` keyed by `listingId`; feeds offer-price defense + dashboard.

**A9. Per-home tour checklist / scorecard** — *P1 · B · FHA*
- Canonical condition checklist (roof/foundation/water/windows/HVAC/electrical/plumbing) with pass/concern/flag per item + weighted score + screened notes; compare scorecards across homes.
- Notes run through `screenText`. Persists `hod:tour-scorecard:v1` keyed by `listingId`; score shows on showing card + dashboard. Depends on `showings`, `screening.ts`.

### Wave B — Under-contract

**B1. AI offer-strength explainer (grounded)** — *P2 · G · UPL+FHA*
- Per `ai-offer-process-research.md` #36: compute/retrieve over vetted content; input via `buildSafeAiInput`, output via `screenOutput`; educational factors + neutral trade-offs, never "you should offer $X"; verbatim disclaimers. Depends on `screening.ts`, `offer`.

**B2. Counter-offer tracker** — *P1 · B · UPL*
- Log each counter round (party, price, repairs/credits, dates) vs. the offer worksheet; show delta from last position + walk-away number.
- Tracks facts only; no advice on which counter to make; routes to attorney. Extends `offer-status` (notes/`countered` already exist). Persists; latest round on dashboard.

**B3. Attorney-review checklist (state-aware)** — *P1 · B · UPL*
- "Did the signed contract keep every contingency + deadline?" verification; branches on attorney-states (legal engine) to hard-prompt hiring counsel via `pros`.
- Persists `hod:attorney-review:v1`. Depends on `states`, `pros`, `offer`.

**B4. Wire-fraud verification checklist & escrow tracker** — *P1 · B · fraud-prevention*
- Forced-sequence wire-fraud checklist (verify number → confirm by phone → send → get receipt) with prominent warning banner; escrow record (holder, EMD amount, sent/received flags, refund-conditions note).
- Ties to the earnest-money deadline. Persists `hod:escrow:v1`; "earnest sent?" on dashboard. Depends on `deadlines.ts`.

**B5. Inspection scheduler + findings logger** — *P1 · B · UPL(light)*
- Schedule within the inspection-contingency window (deadline engine) + inspector handoff (`pros`); log findings (system, severity, est. cost, photo note) separating cosmetic vs. major.
- Persists `hod:inspection:v1` keyed by `listingId`; ties to inspection deadline. Depends on `deadlines.ts`, `pros`.

**B6. Repair-request builder** — *P2 · B · UPL*
- Turn flagged findings into a neutral written repair/credit request (worksheet + disclaimer, like `term-sheet.ts`) to submit before the deadline.
- Worksheet only — no advice on whether to walk. Depends on B5, term-sheet pattern.

**B7. Clear-to-close / financing tracker + low-appraisal tool** — *P1 · B (live status = G) · financial*
- Underwriting-conditions checklist (appraisal ordered→received→conditions→submitted→CTC) with same-day nudges; low-appraisal calculator modeling renegotiate / cash / contingency with the cash-gap math (reuse `savings.ts`); rate-lock + insurance-binder sub-tracker.
- Estimates only; present options, don't advise. Persists `hod:financing:v1`; ties to appraisal/financing deadlines; "clear to close?" on dashboard.

**B8. Title-review checklist + owner's-title decision aid** — *P1 · B · UPL*
- Log title-commitment exceptions (liens/taxes/easements/boundary/clerical) with who-clears-it + by-when; neutral owner's-title-insurance pros/cons; surface closing-path (legal engine) + route to attorney in attorney-states.
- Log facts, don't opine "clear." Persists `hod:title:v1`; ties to title-review deadline. Depends on `states`, `deadlines.ts`, `pros`.

**B9. (Reference) Offer PDF export & state-form auto-fill** — *P3 · G · UPL+vendor+licensing*
- Per `ai-offer-process-research.md` Areas 2–3: free watermarked → paid clean PDF (pdf-lib/react-pdf + Stripe), then licensed attorney-drafted state templates + safe-harbor auto-fill. Gated on legal review + form licensing. Listed here for completeness; lives in the offer epic.

### Wave C — Closing & post-purchase

**C1. CD-vs-Loan-Estimate comparison tool** — *P1 · B · financial*
- Enter LE + CD figures (reuse the LE captured in A4); line-by-line diff; flag increases beyond CFPB tolerance buckets (educational); confirm the 3-business-day rule date via `deadlines.ts` `businessDaysBefore`.
- Flags for the user to raise with the lender; not financial advice. Persists `hod:cd-review:v1`; ties to CD deadline. Depends on `deadlines.ts`, A4.

**C2. Final-walkthrough checklist** — *P1 · B · none-heavy*
- Mobile-friendly: auto-list negotiated repairs from B5/B6 to confirm; systems test (faucets/toilets/HVAC/outlets/appliances); fixtures-convey check; log new damage; pass/issues summary to raise before signing.
- Screen free-text notes. Persists `hod:walkthrough:v1` keyed by `listingId`; ties to walkthrough deadline. Depends on B5/B6, `deadlines.ts`.

**C3. Closing-day checklist + cash-to-close summary** — *P1 · B (e-sign/RON = G) · fraud+UPL+ESIGN*
- Re-verify wire by phone (reuse B4 wire-fraud template); bring ID + certified funds; confirm time/place/attendees + attorney-attending branch (legal engine); cash-to-close summary pulling the confirmed CD figure with funds-arrangement reminder.
- E-signature/RON at the table = separate **G** story (vendor + ESIGN/UETA + state RON via legal engine). Persists `hod:closing-day:v1`; "closed?" advances the dashboard card. Depends on B4, C1, `states`, `deadlines.ts`.

**C4. Move-in & post-purchase tracker** — *P2 · B (integrations = G) · educational*
- Move-in checklist (utilities/address/locks); homestead + tax-exemption tracker with state-aware links (legal engine); first-payment + autopay reminder + ~1%/yr maintenance schedule; confirm deed recorded + closing package stored (`documents.ts` post-closing group).
- Tax/financial framing stays educational. Real calendar/utility/notification integrations = **G**. Persists `hod:post-purchase:v1`; final dashboard state. Depends on `documents.ts`, `states`, `deadlines.ts`.

---

## Dependencies & sequencing at a glance

- **Deadline engine (`deadlines.ts`)** anchors B4, B5, B7, B8, C1, C2, C3 — already built; new tools attach to its milestones rather than recomputing dates.
- **Legal engine (`states/*`)** branches B3, B8, C3, C4 (attorney vs. escrow, homestead, RON).
- **Screening (`screening.ts`)** gates every free-text/AI surface: A9, B1, C2, and any notes field.
- **Dashboard rollup (`homes/rollup.ts`)** should be extended once per wave to surface the new per-home signals (comps, tour score, escrow, inspection items, financing status, title items, walkthrough, closing).
- **Sync (`sync/*`)** needs a new slice + merge rule per persisted feature; batch these so `SyncData`/`merge.ts` aren't churned story-by-story.
- **AI/PDF/forms (G)** stories (A2's explainer, A3 paid export, B1, B9, C3 e-sign) all wait on vendor keys + legal review per the two existing AI/offer briefs — keep them behind the **B** core of each wave so each wave ships value without them.

### Suggested ship order
1. **Wave A (B core):** A2 → A1, A4, A7, A8, A9 → A5, A6 → A3.
2. **Wave B (B core):** B4 → B5 → B6, B2, B3 → B7, B8; then B1 (AI), B9 (forms) when enabled.
3. **Wave C (B core):** C1 → C2 → C3 → C4; e-sign/RON when vendor + state law clear.
