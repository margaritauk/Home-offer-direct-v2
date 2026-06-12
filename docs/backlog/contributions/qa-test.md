_Contributor: QA / Test · Backlog grooming · 2026-06-12_

# Test strategy & plans — buyer-agent gap backlog

Gate (every PR): **typecheck + lint + Vitest (unit + RTL component) + build + Playwright E2E**, all green.

## Conventions reused (match existing suites)

- **Pure math/threshold logic** → `src/lib/**/*.test.ts` (`describe/it`, no DOM). Pattern refs: `savings.test.ts`, `tools/clear-to-close.test.ts` (`appraisalGap`), `deadlines.test.ts`, `showings/calendar.test.ts`.
- **Components** → RTL `*.test.tsx` rendering against jsdom; mock `useStageTool` with real `useState` (ref: `tools/clear-to-close.test.tsx`) or use the **real** hook against jsdom `localStorage` when persistence is under test (ref: `savings-calculator.test.tsx`). Assert via `getByLabelText` / `getByTestId` / `getByRole`.
- **E2E** → `e2e/*.spec.ts` (Playwright): route renders, reachable from journey/tools block, key disclaimer visible (ref: `offer.spec.ts`).
- **FHA hooks** → reuse `lib/ai/screening` (`screenText`, `buildSafeAiInput`, `AI_INPUT_ALLOWLIST`, `screenOutput`). Any **new free-text field** that reaches AI or templates gets a screening test (ref: `screening.test.ts`).
- **Gate/kill-switch** → re-import module under `vi.stubEnv` per flag axis (ref: `supabase/deals-flag.test.ts`).
- **Test counts below are unit/component cases (rough).** Compliance UPL/FHA assertions are folded into the relevant layer.

---

## P0

### A1 — Market-conditions read
**Pure unit** (`lib/tools/market.test.ts`, ~14): the band classifier is the core.
- G: DOM=9, list-to-sale=102%, MoS=1.2 / W: classify / T: `"seller"` market, "aggressive" posture.
- G: DOM=120, list-to-sale=94%, MoS=9 / W: classify / T: `"buyer"` market.
- **Boundary cases (must):** values exactly on each threshold (e.g. list-to-sale = 100.0%, MoS at the buyer/balanced/seller cutoffs, DOM cutoffs) — assert the **side** the boundary falls on, both just-below and just-above. One `it` per threshold edge.
- Partial inputs: only DOM provided → still classifies on available signals, no NaN; all-empty → `"unknown"`/neutral, not a crash.
- Invalid/negative/`NaN` ratios → clamped/neutral (ref `savings` guard pattern).
**Component RTL** (~4): renders the plain-English read for each band; empty state ("enter or pull data") when no inputs; numbers echo inputs.
**E2E** (1): `/tools/market` (or comps/offer band) renders + disclaimer visible.
**UPL hook:** output copy must be descriptive ("homes here sell in N days at X%"), **no directive** ("offer above ask"). Add `it` asserting copy strings contain no imperative price directive; route through `screenOutput` if AI-generated.
**FHA hook:** any free-text "market notes" field → `screenText` test (school/neighborhood/demographic terms neutralized; ref existing `market.marketNotes` screening case).

### A2 — comps + market → suggested price range
**Pure unit** (`lib/tools/suggested-price.test.ts`, ~10): the bridge math/derivation.
- G: comps range $380–410k + `"seller"` market / W: deriveBand / T: band skews **top** (e.g. midpoint→top, with rationale tokens).
- G: same range + `"buyer"` market / T: skews **bottom/mid**.
- **Edge:** comps range inverted (low>high) → normalized; single-comp/zero-width range → degenerate band handled; missing market read → range passes through with neutral rationale; missing comps → no band (don't fabricate a number).
- Output is a **range + reasoning string**, never a single directive number (UPL): assert shape `{low, high, rationale}` and that no single "offer $X" value is emitted.
**Component RTL** (~5): pulls comps fair-value (mock) + market read into the offer step; shows band + rationale; empty states when either input absent; **regression:** offer-strength indicator still renders alongside.
**E2E** (1): comps→offer flow shows the suggested band with rationale text.
**UPL:** dedicated `it` — rendered text contains "suggested range / similar homes sold for…", excludes imperative directives. `screenOutput` if AI.

### J1 — when-to-go-solo decision aid + post-NAR framing
**Pure unit** (`lib/journey/go-solo.test.ts`, ~8): the rubric mapping deal-factors → recommendation **band** (reasonable-solo vs consider-help), with factors: complex title, unusual financing, hot multiple-offer, new construction, probate/short-sale.
- Each factor flips/escalates the band; all-clear → "solo reasonable"; multiple stacked factors → "consider help" (no hard "you must hire").
- Empty/no factors → neutral default.
**Component RTL** (~4): renders balanced both-sides copy; the post-NAR facts block present (written buyer-agency agreement since Aug 2024; compensation negotiable/not guaranteed seller-paid); **citation+date present** (accuracy compliance) — assert a source/date node.
**E2E** (1): decision-aid page renders + balanced framing visible.
**UPL:** assert output is "when it's smart to consider help" framing, **not** "do not use an agent"/"you must"; no directive to waive anything.

### J2 — conditional savings framing
**Pure unit** (`savings.test.ts` extension, ~3): existing math unchanged (regression-lock the numbers: $10k captured at 100% on $400k, 0% capture → $0). No new math; **the change is copy/labeling**, so:
**Component RTL** (`savings-calculator.test.tsx` extension, ~4): label now reads **"up to ~2.5%, if you ask and the deal allows"** (conditional); the existing best-case `sanity-note` still appears at 100% capture and clears below 100% (regression — keep these); capture-rate slider still recomputes `captured-savings` and persists (`hod:tool:savings:v1`).
**E2E** (1): savings calculator shows the softened/conditional copy (update any existing snapshot/string assertion that hard-codes "save 2.5%").
**Regression risk (flagged):** copy change can break existing `savings-calculator.test.tsx` string assertions and the `e2e` if it matches old copy — update both in the same PR. Don't change calc outputs.
**Compliance:** conditional framing reduces UDAP/over-promise; assert no unconditional "you will save".

---

## P1

### A3 — escalation / appraisal-gap / multiple-offer
**Pure unit** is the heavy lift here (cash math is the risk surface).
- `escalation.test.ts` (~10): given competing offer C, cap Y, increment $I → resulting price = min(C+I, Y); **edges:** competing offer **above cap** → price clamps at Y (don't exceed); competing == your base → no escalation; increment 0; negative/`NaN` inputs guarded → 0/no-op.
- `appraisal-gap (offer-time).test.ts` (~10): cash-to-cover = contract − appraised (or − a chosen gap-coverage amount); **edges (must):** **zero** gap (appraised ≥ contract → cover = 0, not negative); **negative** gap (appraised > contract → clamp to 0, never a "credit"); partial coverage cap; `NaN`/negative inputs → 0 (ref existing `appraisalGap` guard test). Keep **distinct** from post-appraisal Clear-to-Close calc — add an `it` asserting they don't share state/regress `clear-to-close` numbers.
- multiple-offer playbook is content → **content test** (~4, ref `offer/tactics.test.ts`): unique ids, non-empty name/what/help/**backfires**, escalation entry routes to **attorney** (UPL).
**Component RTL** (~5): escalation modeler renders computed price; appraisal-gap helper shows cash impact + zero/negative empty states; risk/"some states disallow" note present.
**E2E** (1): tactics page renders with UPL disclaimer.
**UPL:** modeler **explains/models**, never "use an escalation clause." FHA: n/a unless new free-text → screen it.

### A4 — contacts / who's-who hub
**Pure unit** (~5): contact CRUD/validation reducer (add/edit/remove, dedupe by role, email/phone format validation, empty hub state). Pattern ref `offer-status/reducer.test.ts`.
**Component RTL** (~6): renders per-role cards; **empty state** when no contacts; **wire-fraud reminder attached to the escrow/title contact** (assert it renders on that row specifically); persists via `useStageTool`.
**E2E** (1): contacts card on `/dashboard` + tracker.
**FHA hook:** name fields are PII but free-text "notes" on a contact (if any) → `screenText` so demographic notes don't leak; assert. **UPL:** "no advice" — pure organization, assert no recommendation copy.

### A5 — disclosure review worksheet
**Pure unit** (~8): given state disclosure regime (from state engine), produce the red-flag category checklist (water/roof/foundation, prior repairs, deaths-where-required, HOA, environmental). **Edges:** state with **no** statutory disclosure / caveat-emptor state → empty-but-explained checklist (not a crash); "deaths" category only appears where state requires it (boundary on the state flag). Ref `states.test.ts` / `legal/state-forms.test.ts`.
**Component RTL** (~5): renders categories; **empty state** for caveat-emptor; logs buyer questions; "have your attorney/inspector confirm" disclaimer present (UPL).
**E2E** (1): worksheet renders per a selected state.
**FHA:** the "questions to ask" free-text → `screenText` (no protected-class phrasing). **UPL:** facts/questions only, no "this is a defect, rescind."

### A8 — .ics deadline export
**Pure unit** is critical — `.ics` correctness (`lib/tracker/ics.test.ts`, ~14):
- Valid VCALENDAR envelope: `BEGIN:VCALENDAR`/`END:VCALENDAR`, `VERSION:2.0`, `PRODID`, one `VEVENT` per deadline with `UID`, `DTSTAMP`, `SUMMARY`.
- **All-day deadlines (must):** `DTSTART;VALUE=DATE:YYYYMMDD` (no time, no TZ) — assert no `T`/`Z` for all-day; **timezone:** if timed, either `DTSTART;TZID=...` or UTC `...Z` consistently — assert no naive local drift (ref `calendar.test.ts` TZ-stability reasoning).
- **Format validity:** CRLF line endings, line-folding for long SUMMARY (>75 octets), **escaping** of `,` `;` `\` and newlines in SUMMARY/DESCRIPTION.
- Date correctness: each VEVENT date == the tracker milestone date (reuse `computeMilestones`); invalid/empty milestone list → valid-but-empty calendar (or no file), no crash.
- Stable `UID` per deadline (re-export doesn't duplicate events in calendars).
**Component RTL** (~3): per-deadline "add to calendar" button generates a blob/href; "export all" present.
**E2E** (1): clicking export triggers a download with `text/calendar` (or the href has the data URI).
**Regression risk (flagged):** **tracker (A8 lives on the tracker)** — assert `use-tracker`/milestones rendering and `tracker-closing-countdown` unaffected; existing `deadlines.test.ts` numbers unchanged.

### A9 — listing-alert & access guide
Mostly content. **Content/unit** (~4): guide sections present, links to portals, honesty note about MLS-only/pocket listings. **Component RTL** (~3): renders sections + dual-agency/access cross-link. **E2E** (1): page renders + "not a full search" honesty note. **UPL/FHA:** neutral, no steering.

### I1 — showing access + scripts
**Content/unit** (~6, ref `showings/templates.test.ts` / `outreach.test.ts`): scripts non-empty; **dual-agency caution** keyed off state engine (assert it appears only/where allowed — boundary on the state flag); tour checklist items present.
**Component RTL** (~4): script picker renders; "I have my own attorney" fallback; feeds Tour Scorecard rubric (assert handoff).
**E2E** (1): showings page surfaces scripts.
**FHA (must):** outreach scripts are templates that may include buyer free-text → `screenText` on any editable field (no "love-letter"/protected-class; ref `screenOutput` love-letter cases). **UPL:** scripts are wording, not legal advice.

### I2 — negotiation playbook
**Content/unit** (~6, ref `tactics.test.ts`, `counter-offer/reducer`): playbook entries (anchoring, concessions beyond price, repair leverage, **walk-away discipline**) non-empty; walk-away ties to the **private walk-away max** already stored — assert it reads that value and never exposes it to outputs/templates.
**Component RTL** (~4): renders guidance; repair-leverage pulls inspection summary (mock).
**E2E** (1): playbook visible on counter-offer tracker.
**UPL:** educational "how to read a counter," no "counter at $X." Regression: counter-offer tracker reducer unchanged.

---

## P2

### A6 — HOA/condo review checklist
**Pure unit** (~6): checklist generation (budget/reserves, special assessments, CC&Rs, litigation, rental caps, insurance); **empty/non-HOA** state → checklist hidden/empty-explained (boundary on the "is condo/HOA" flag). **Component RTL** (~4): renders categories + empty state. **E2E** (1). UPL: facts only. FHA: rental-cap/occupancy notes phrased neutrally — screen any free-text.

### A7 — needs-assessment worksheet
**Pure unit** (~6): must-have / nice-to-have / deal-breaker categorization; seeds Tour Scorecard rubric (assert mapping); empty worksheet → valid empty rubric. **Component RTL** (~4): three buckets render + persist (`useStageTool`). **E2E** (1).
**FHA (must):** free-text criteria fields → `screenText` (e.g. "good schools"/neighborhood/demographic phrasing neutralized) — assert; this is the highest FHA-leak risk in P2.

### I3 — pre-offer diligence
**Pure unit** (~5): fields (last sold, price changes, DOM, seller motivation) summarize cleanly; missing fields → graceful partial summary. **Component RTL** (~3): renders on listing detail + offer builder. **E2E** (1). FHA: "why selling"/seller-motivation free-text → `screenText`. UPL: facts only.

### I4 — guided comp adjustments
**Pure unit** is the math (~10, ref `tools/comps.test.ts`): adjustment prompts (condition, sqft, garage, lot, recency) apply signed deltas; **edges:** zero adjustment, negative subject vs comp, recency=0, very large delta clamps; adjusted value math is deterministic and reversible. **Component RTL** (~4): prompts walk through adjustments; methodology explainer present. **E2E** (1). **Regression:** existing `comps`/`comps-rank` adjustment math must not change — lock current numbers.

### J3 — listings stub labeling
**Component RTL** (`listings-browser.test.tsx` extension, ~3): page labeled **"shortlist/demo, not a search engine"**; routes to portals (A9 cross-link).
**E2E** (`e2e/listings.spec.ts` extension, 1): label visible; serious-search CTA points out.
**Regression risk (flagged):** **listings page** — existing `listings-browser.test.tsx`, `listings/price-range.test.tsx`, `location-selector.test.tsx`, and `api/listings/search/route.test.ts` plus `e2e/listings.spec.ts` may assert old copy/behavior; update copy assertions in the same PR, keep search/provider logic untouched.

### J4 — buyer-side market data surfacing
**Component RTL** (~4): when market stats available (mock), the **buyer-facing** read (A1) renders prominently (not buried in comps); **gated/off state:** when no RentCast/source configured → read is hidden or shows "data unavailable" (kill-switch off path — ref `deals-flag.test.ts` env-stub pattern). **Pure unit** (~2): the "is data available" selector. **E2E** (1): with stats mocked, read appears front-and-center. Reuses A1 classifier (no new math). FHA: neutral presentation, screen any notes.

---

## Cross-cutting regression & compliance checklist (run for every PR)

- **Regression hot-spots:** savings calc copy (J2) → `savings.test.ts` numbers locked, `savings-calculator.test.tsx` + `e2e` copy updated; **listings page** (J3) → `listings-*` unit + `e2e/listings.spec.ts`; **tracker** (A8) → `use-tracker`, `deadlines.test.ts`, `tracker-closing-countdown`; **comps** (I4) → `comps`/`comps-rank` math locked; **offer-strength** (A2) still renders.
- **UPL gate (every item):** add at least one assertion that rendered/AI output contains **no directive** (no "offer $X", "waive the inspection", "you must hire/don't hire"); contractual tools keep "have your attorney review." Route AI output through `screenOutput`.
- **FHA gate (every NEW free-text field reaching AI/templates):** `screenText` test that protected-class terms (race/religion/familial/disability/national-origin/source-of-income) and love-letter phrasing are flagged + neutralized; new fields must be **off** `AI_INPUT_ALLOWLIST` unless explicitly screened (assert via `buildSafeAiInput`).
- **Accuracy (J1/J2 + any market stat):** assert a **source + date** node renders.
- **Boundaries are mandatory unit cases:** market thresholds (A1), appraisal-gap zero/negative cash (A3), escalation cap clamp (A3), `.ics` all-day vs timed/TZ + escaping (A8), state-flag-gated categories (A5/A6/I1).
- **Empty/off states are mandatory:** disclosure/HOA empty (A5/A6), contacts empty (A4), no-comps/no-market (A2), data-unavailable kill-switch (J4), non-HOA (A6).
