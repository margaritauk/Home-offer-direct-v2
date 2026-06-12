# Buyer's-Agent Gap — UX/IA Specs

_Contributor: Product Designer (UX) · Backlog grooming · 2026-06-12_

How to read this: for each item — **IA & entry points** (where it lives, how it's
reached), **Flow & screen states** (default / empty / loading / error /
disabled-when-gated), **UX acceptance criteria** (incl. a11y + mobile), and
**Reuse** (existing patterns to follow). Copy guardrails are called out inline:
🟡 **UPL** = educational framing / trade-offs, never directives, keep "have your
attorney review"; 🟦 **FHA** = neutral data, no protected-class signals, no
love-letter framing.

**House patterns to follow everywhere** (don't reinvent):
`ToolPageHeader` (title/intro + "← All tools" back link) wraps every `/tools/*`
page · `useStageTool<T>(id, initial)` for localStorage persistence with
`hydrated` guard (render `Loading…` until hydrated), `save/reset/undoReset` +
`UndoToast` · register new tools in `STAGE_TOOLS` in
`src/lib/journey/navigation.ts` (auto-flows to `/tools` index and the in-journey
"Tools for this step" block — no nav change needed) · `DisclaimerBanner` (loud
amber, legal/contract surfaces) vs `ToolDisclaimer` (quiet gray, estimate tools)
vs `TrustCallout` (tone callouts) · `HomePicker` to scope a tool to a saved home ·
`ValidatedField` for numeric inputs · free text screened with the
forbidden-placeholder pattern from `src/lib/showings/templates.ts`.

---

# P0

## A1 — Market-conditions read

**IA & entry points.** New `/tools/market` (Market Conditions). Register in
`STAGE_TOOLS` under **search** and **make-an-offer** (so it appears in the
catalog and the in-journey block at both stages). Cross-link from the Comps
Worksheet and Offer Builder as "Market conditions for this area →". Also surface
a compact read-only **summary band** at the top of the Offer Builder once filled
(this is also J4's "front-and-center" goal).

**Flow.** (1) Buyer picks/sets the area (reuse `LocationSelector`/state from the
listings browser; default to the saved-state selection). (2) Either enter four
inputs manually — days-on-market, list-to-sale ratio, months-of-supply,
price-trend — or, where the RentCast seam returns them, "Pull market data" (same
seam pattern as comps auto-find). (3) Tool renders a plain-English read + a
buyer's↔seller's-market gauge and a one-line "what this means for your offer"
that links into A2.

**Screen states.** *Default/empty:* four empty inputs + a sample read shown as an
illustrative example labeled "example". *Loading:* skeleton on the read card +
disabled "Pull" button with spinner (mirror listings `updating`). *Error:* pull
fails → inline "Couldn't fetch market data — enter the numbers yourself" and fall
back to manual (never block). *Disabled-when-gated:* if the RentCast flag is off,
hide the Pull button entirely and show manual-only (reuse `rentcast-flag.ts`); no
dead button.

**Acceptance criteria.** Read updates live as inputs change; result card has
`aria-live="polite"`. Each input is a labeled `ValidatedField` with units in the
label and a glossary link on first use of DOM / list-to-sale / months-of-supply.
Gauge is not color-only — include a text label ("Strong seller's market") and an
`sr-only` summary. Mobile: inputs stack single-column; gauge scales; no
horizontal scroll at 360px. 🟦 **FHA:** market/area data only — **no** school
ratings, demographics, or "good/bad neighborhood" language; present numbers
neutrally with source + date attribution (cite RentCast + retrieval date, matching
the state-engine convention). 🟡 **UPL:** the read describes conditions and
typical buyer responses ("hot markets often mean offering at/above ask"), never
"you should offer X."

**Reuse.** `LocationSelector`, RentCast seam + `rentcast-flag.ts`,
`useStageTool` (`market`), `ValidatedField`, `ToolDisclaimer`.

## A2 — Comps + market → suggested price range (the bridge)

**IA & entry points.** Not a new route — a **band/step inside the Offer Builder**
("Suggested price range") plus a mirror summary on the Comps Worksheet result.
The Comps Worksheet already produces a fair-value range; A1 supplies the market
read; A2 joins them. Entry points: Offer Builder price step (primary), Comps
result card ("Carry this into your offer →"), and the A1 read's "what this means"
link.

**Flow.** (1) If comps + market data exist (read from their `useStageTool` keys),
show the joined band automatically: "Comps suggest **$380k–$410k**; market read:
hot → buyers here often land near the **top** of the range." (2) Buyer can accept
the band as a starting reference (prefills nothing binding) or dismiss. (3) A
"Where this comes from" disclosure expands the comps math + the market inputs so
it's transparent, not a black box.

**Screen states.** *Default:* both sources present → full band + rationale.
*Empty/partial:* missing comps → "Add comps to see a suggested range
[Open Comps Worksheet]"; missing market → show comps range only with "Add a
market read to sharpen this [Open Market Conditions]." *Loading:* none (reads
local state). *Error:* malformed/legacy stored data → normalize defensively
(follow `normalizeCompsState`) and degrade to whichever source is valid.
*Disabled-when-gated:* if neither source exists, the band collapses to a single
prompt card, never an empty/broken panel.

**Acceptance criteria.** The range is always a **band with reasoning**, never a
single number and never auto-filled into the binding offer price field — the
buyer types their own number. `aria-live` announces the band when it appears.
Keyboard-reachable disclosure for the rationale. Mobile: band + rationale stack;
keep the dollar figures legible (no truncation). 🟡 **UPL (critical here):** copy
is "comps + market suggest a range; you decide" — explicitly avoid "offer $X."
Keep a "have your attorney review the contract terms" line. 🟦 **FHA:** rationale
cites only price/market facts.

**Reuse.** `compsEstimate`/`normalizeCompsState` (`src/lib/tools/comps`), A1's
stored read, offer-strength indicator in the Offer Builder, `TrustCallout`
(info tone) for the rationale block.

## J1 — "Should I go solo?" decision aid + post-NAR framing

**IA & entry points.** New `/tools/should-i-go-solo` (decision aid), registered in
`STAGE_TOOLS` under **get-ready** (earliest, before they commit) and linked from
the homepage audience-routing path (#79–#82) and the Savings Calculator (pairs
with J2). Also a short evergreen "When to bring in a pro" callout reused on
stages with elevated stakes (offer, title).

**Flow.** (1) A short, non-scored **reflection checklist** of stake factors
(complex/clouded title, unusual financing, hot multiple-offer market, new
construction, probate/short-sale, low confidence/time). (2) As factors are
checked, surface a balanced read: "Several higher-stakes factors apply — many
buyers in your situation bring in a flat-fee or hourly attorney for the contract
while still self-representing elsewhere." (3) Static **post-NAR explainer** panel:
since Aug 2024, using an agent means a signed written buyer-agency agreement
before touring, and buyer-side comp is negotiable / not guaranteed seller-paid.
(4) CTA to `/pros` (flat-fee attorneys) — framed as optional, not a funnel out.

**Screen states.** *Default/empty:* nothing checked → neutral "Going solo is
reasonable for many straightforward purchases; here's how to tell when help is
worth it." *Filled:* balanced read reflecting checked factors. No loading/error
(local only). *Disabled-when-gated:* n/a.

**Acceptance criteria.** It is a **decision aid, not a verdict** — never outputs
"you must hire a lawyer"; always "many buyers choose to…". Checklist is native
checkboxes (keyboard + SR labels); the dynamic read is in an `aria-live` region.
Post-NAR facts carry source + date (NAR settlement 2024) per the accuracy
guardrail. Trust-forward, two-sided tone (the product champions going solo **and**
is honest about limits). Mobile: single column, comfortable tap targets.
🟡 **UPL:** explains roles and trade-offs, doesn't advise the legal choice.

**Reuse.** Get-Ready checklist component pattern, `useStageTool`
(`should-i-go-solo`), `/pros` directory handoff, `TrustCallout`.

## J2 — Conditional savings framing

**IA & entry points.** No new surface — **copy + one input change** in the
existing Savings Calculator (`src/components/savings-calculator.tsx`). The tool
already has a "how much of it you negotiate to capture" rate, which is the right
lever; the framing around it over-promises.

**Flow.** (1) Reframe the headline result from "Estimated savings you capture" to
"Estimated savings — **up to ~2.5%, if you ask and the deal allows.**" (2) Make
the capture-rate input's role explicit with a short helper: the seller may not be
offering buyer-side comp; you capture it only by negotiating a price reduction or
credit, subject to lender seller-credit caps. (3) Keep the big number but pair it
with the conditional caption so it never reads as guaranteed.

**Screen states.** *Default:* conditional caption always present under the result.
*Edge (capture 0%):* result shows $0 with "the seller keeps it" already in the
hint — keep that honest framing. No loading/error.

**Acceptance criteria.** The word "up to" and the conditionality appear adjacent
to the dollar figure, not buried. Caption is part of the same `aria-live` result
region so SR users hear the caveat with the number. Mobile: caption wraps under
the figure, stays readable. 🟡 **UPL / UDAP:** no over-promise; this is the
risk-reduction edit. 🟦 **FHA:** n/a.

**Reuse.** Existing `savings-calculator.tsx` (`buyerCommissionPercent`,
`captureRatePercent` already model this); `ToolDisclaimer`.

---

# P1

## A3 — Escalation / appraisal-gap / multiple-offer tactics

**IA & entry points.** Extend the existing **`/tools/offer-help`** page (already
hosts `OfferTactics`) rather than a new route — add three modeler/playbook
sections. Linked from `STAGE_TOOLS` make-an-offer & negotiate (already present).
Cross-link from A1 ("hot market? see competitive tactics").

**Flow.** *Escalation modeler:* enter base offer, increment, cap → renders the
resulting "you'd pay" examples against hypothetical competing bids, with the risk
explainer (reveals your ceiling; some sellers/states disallow). *Appraisal-gap
helper (at offer time):* enter price + expected appraisal scenarios → cash needed
to cover the gap; clearly distinct from the post-appraisal Clear-to-Close calc.
*Multiple-offer playbook:* static educational checklist (EM sizing, terms beyond
price, deadlines, highest-and-best).

**Screen states.** *Default/empty:* zeroed inputs with a worked example labeled
"example". *Computed:* live results table. *Error:* cap < base, or increment ≤ 0 →
inline `ValidatedField` errors ("cap must exceed your base offer"); don't compute
nonsense. *Disabled-when-gated:* if state engine flags escalation as
disallowed/disfavored in the buyer's state, show a state-aware caution
(`StateAwareCallout`) above the modeler but keep it usable as education.

**Acceptance criteria.** Each modeler explains the trade-off in plain English next
to the math. Tables have horizontal-scroll guards at 360px. Inputs labeled +
keyboard-operable; results `aria-live`. 🟡 **UPL:** models scenarios and risks —
never "use an escalation clause" or a recommended cap; "have your attorney draft
this." 🟦 **FHA:** no love-letter / personal-appeal tactic in the multiple-offer
playbook (terms only).

**Reuse.** `OfferTactics`, `ValidatedField`, `StateAwareCallout`, low-appraisal
math from `clear-to-close.tsx`, `ToolDisclaimer`.

## A4 — Transaction contacts / who's-who hub

**IA & entry points.** A **Contacts card on `/dashboard`** and on `/tracker`
(per-deal). Not a top-nav item. Scope to the active home via `HomePicker`.

**Flow.** Add a contact → pick role (loan officer, escrow/title officer, closing
attorney, inspector, listing agent, insurance) → name, phone, email. List groups
by role. The escrow/title contact carries an attached **wire-fraud reminder**
(reuse the escrow-tracker callout). One-tap `tel:`/`mailto:` on mobile.

**Screen states.** *Empty:* friendly "Add the people on your deal so you've got
one place to reach them," with role chips to seed. *Default:* grouped list.
*Loading:* `hydrated` guard → `Loading…`. *Error:* invalid email/phone → inline
field validation. *Disabled-when-gated:* purely local; no gating. (Persisted via
`useStageTool`, so it rides the future deal-sync seam.)

**Acceptance criteria.** Pure organization, **no advice**. Each contact row is a
list item with accessible labels; add/edit forms are keyboard-complete with
labeled fields and focus management. `tel:`/`mailto:` links have discernible
text. Mobile: cards stack; tap targets ≥44px. 🟦 **FHA:** store role/contact
facts only — no notes field that invites protected-class commentary (or screen it
like showings notes). 🟡 **UPL:** n/a (organizational).

**Reuse.** `useStageTool` (`contacts`), `HomePicker`, escrow-tracker wire-fraud
callout, `ValidatedField`, `UndoToast` for delete.

## A5 — Seller-disclosure review worksheet

**IA & entry points.** New `/tools/disclosure-review`, registered in
`STAGE_TOOLS` under **search**/**inspection** (it spans pre-offer and DD), linked
from the state guide (`/states/[code]`) since the disclosure regime varies by
state.

**Flow.** (1) Tool reads the buyer's state → pulls the state's disclosure regime
from the state engine. (2) Walks red-flag categories (water/roof/foundation,
prior repairs, deaths-where-required, HOA, environmental) as a checklist; each
prompts "what to look for" and a **"questions to ask"** capture (free text,
screened). (3) Outputs a tidy question list to bring to the inspector/attorney.

**Screen states.** *Empty:* category checklist unfilled with guidance text.
*Default:* progress across categories. *Loading:* `hydrated` guard. *Error:*
screened free text rejects protected-class signals with a gentle inline message.
*Disabled-when-gated:* if no state selected, prompt to pick a state first
(`StateAwareCallout`).

**Acceptance criteria.** Facts + questions only; every category ends with "have
your attorney/inspector confirm." Checklist native + keyboard; question fields
labeled. State-dependent content cites source + date. Mobile single-column.
🟡 **UPL:** flags categories to ask about, doesn't interpret legal significance.
🟦 **FHA:** screen free text (forbidden-placeholder pattern); the
"deaths-where-required" category is presented as a neutral state-law disclosure
fact, not stigmatizing language.

**Reuse.** State engine + `StateAwareCallout`, `useStageTool`
(`disclosure-review`), showings free-text screening (`templates.ts`), checklist
component pattern, `DisclaimerBanner`.

## A8 — `.ics` export / add-to-calendar

**IA & entry points.** On `/tracker` — a per-deadline "Add to calendar" and a
top-level "Export all deadlines (.ics)". No new route. Surface the same on the
dashboard "next deadline" card.

**Flow.** Compute milestones (existing `lib/deadlines.ts`) → generate a `.ics`
blob client-side → download (or per-deadline single-event `.ics`). Each event
title/description is neutral and includes the deadline name + a note to verify
against the contract.

**Screen states.** *Default:* buttons enabled when ≥1 dated deadline exists.
*Empty:* no contract date yet → buttons disabled with helper "Set your contract
date to enable calendar export." *Loading:* instantaneous; show a brief "Exported"
confirmation (`aria-live`). *Error:* generation failure → toast "Couldn't build
the calendar file — try again." *Disabled-when-gated:* disabled state described
above (don't hide; explain why).

**Acceptance criteria.** Buttons are real `<button>`s with discernible labels;
disabled state has an accessible explanation (not just dimmed). Confirmation is
announced. Mobile: download works on iOS/Android calendars; ensure VALARM gives a
sensible default reminder. 🟡 **UPL:** event copy is factual ("Inspection
contingency deadline — verify against your contract"), no advice. 🟦 **FHA:** n/a.

**Reuse.** `lib/deadlines.ts` (milestones + `formatISO`), tracker UI, toast
pattern.

## A9 — Listing-alert & access guide

**IA & entry points.** New `/tools/listing-alerts` (mostly static guide), linked
from `/listings` (ties to J3's "this is a demo" labeling) and `STAGE_TOOLS`
search. Pair the access-guidance portion with I1.

**Flow.** Static, trust-forward guide: how to set saved-search alerts on
Zillow/Redfin/Realtor.com, watching coming-soon/off-market, and an honest note on
what unrepresented buyers can't see (MLS-only/pocket listings). Optional small
checklist ("alerts set on: portal A/B/C") via `useStageTool`.

**Screen states.** *Default:* the guide. *Empty/Loading/Error:* minimal (mostly
static; the optional checklist uses the `hydrated` guard). *Disabled-when-gated:*
n/a.

**Acceptance criteria.** Honest about coverage limits (don't over-claim).
External links open clearly labeled, `rel="noopener"`. Headings structured for SR
navigation. Mobile: readable line length. 🟦 **FHA:** portal-neutral, no steering
by area demographics. 🟡 **UPL:** n/a.

**Reuse.** `ToolPageHeader`, `DisclaimerBanner` (the listings "sample data"
banner already sets the honest tone), `useStageTool` (`listing-alerts`).

## I1 — Showing access reality + scripts; dual-agency caution; tour checklist

**IA & entry points.** Extend `/showings` (already has message composer +
agency explainer). Add a **scripts/fallbacks** section, a **dual-agency caution**
(state-aware), and an **in-person tour checklist** that feeds the Tour Scorecard.

**Flow.** (1) Scripts: pick a scenario (agent won't show / requesting a showing
service / "I have my own attorney") → neutral, copyable script (same composer
pattern, screened). (2) Dual-agency caution reads the state engine for where it's
allowed/banned. (3) Tour checklist (what to look at, photos to take) → "Send to
Tour Scorecard."

**Screen states.** *Default:* scenario picker + scripts. *Empty:* checklist
unchecked. *Loading:* state-aware content via `hydrated`. *Error:* screened text
rejection inline. *Disabled-when-gated:* if no state selected, dual-agency caution
shows "pick your state to see local rules."

**Acceptance criteria.** Scripts copyable with a confirmation; no protected-class
or love-letter placeholders (FORBIDDEN_PLACEHOLDER_WORDS test must pass).
Dual-agency caution cites the state + source. Keyboard-operable scenario tabs.
Mobile: copy buttons reachable. 🟦 **FHA:** screened scripts, neutral.
🟡 **UPL:** caution explains the conflict of interest, doesn't advise the buyer's
representation choice.

**Reuse.** `message-composer.tsx` + `templates.ts` screening, `agency-explainer`,
state engine, Tour Scorecard handoff, `StateAwareCallout`.

## I2 — Negotiation playbook depth

**IA & entry points.** Extend the **Counter-offer Tracker** (`/tools/counter-offer`)
with an adjacent **playbook** panel; also linked from `/tools/offer-help`.

**Flow.** Educational playbook: reading a counter, anchoring, concessions beyond
price (rent-back, closing date, as-is, EM), repair leverage sourced from the
Inspection Findings summary, and **walk-away discipline** tied to the private
walk-away max the tracker already stores (surface it as a quiet reminder, never
shared with the seller side).

**Screen states.** *Default:* playbook + live tracker. *Empty:* "Log the seller's
counter to see term-by-term guidance." *Loading:* `hydrated`. *Error:* n/a (local).
*Disabled-when-gated:* walk-away reminder only appears once a walk-away max is set.

**Acceptance criteria.** Guidance is principles + options, not "counter at $X."
The walk-away max is clearly private. Inspection-derived leverage links to the
Inspection Findings logger. Accessible disclosure sections. Mobile single-column.
🟡 **UPL:** strategy education, not directives; contract changes → attorney.
🟦 **FHA:** n/a.

**Reuse.** `counter-offer-tracker.tsx` (walk-away max), `inspection-findings.tsx`
summary, `TrustCallout`.

---

# P2 (brief)

- **A6 — HOA/condo review checklist.** New `/tools/hoa-review`, `STAGE_TOOLS`
  search/inspection. Checklist (budget & reserves, special assessments,
  CC&Rs, litigation, rental caps, insurance) → question list. Same checklist +
  `useStageTool` + screened-notes pattern as A5. 🟡 facts + "have your attorney
  confirm." Empty/hydrated/disabled-state per house pattern.

- **A7 — Needs-assessment worksheet.** New `/tools/needs` in `STAGE_TOOLS`
  get-ready/search. Must-haves / nice-to-haves / deal-breakers; **seeds the Tour
  Scorecard rubric** (reuse its criteria shape). 🟦 keep criteria to property/
  logistics facts (beds, commute, budget, condition) — no protected-class proxies.

- **I3 — Pre-offer due diligence.** Light field set (last sold, price changes,
  DOM, seller motivation if known) on the listing detail + Offer Builder, not a
  new route. Reuse A1's DOM data where present. 🟡 informational.

- **I4 — Guided comp adjustments.** In-place enhancement to the Comps Worksheet:
  add **suggested adjustment prompts** (condition, sqft, garage, lot, recency)
  with methodology explained inline. Reuse existing adjustment field +
  `ToolDisclaimer`.

- **J3 — Listings labeling.** Copy-only: the `/listings` "sample listings"
  `DisclaimerBanner` already exists — tighten it to plainly say "demo/shortlist,
  search the portals for real coverage" and link A9. No new screen states.

- **J4 — Buyer-side market data front-and-center.** Satisfied by A1's summary band
  on the Offer Builder / dashboard rather than burying stats in the comps
  connector. Reuse A1's stored read; no separate build.

---

## Cross-cutting UX acceptance criteria (apply to every item)

- **Hydration:** any tool using `useStageTool` renders `Loading…` until
  `hydrated` to avoid SSR/local-storage mismatch (existing pattern).
- **Wayfinding:** every new `/tools/*` page uses `ToolPageHeader` (back link) and
  is registered in `STAGE_TOOLS` so it appears in the `/tools` index and the
  in-journey "Tools for this step" block automatically.
- **A11y baseline:** labeled inputs (`ValidatedField`), keyboard-operable controls
  (native inputs/buttons or roving-tabindex — do **not** repeat the scorecard's
  non-operable radiogroup bug), `aria-live` on computed results, visible focus
  rings, and `sr-only` text for any color-only signal (gauges, status).
- **Mobile:** single-column stacking, ≥44px tap targets, horizontal-scroll guards
  on any wide table at 360px.
- **Disclaimer register:** loud amber `DisclaimerBanner` for legal/contract/offer
  surfaces (A3, A5, A2 rationale); quiet `ToolDisclaimer` for estimate tools
  (A1, comps adjustments). Don't add a fourth disclaimer style.
- **Copy compliance:** 🟡 **UPL** — facts, ranges, trade-offs, "have your attorney
  review"; never directive numbers or "waive/offer X." 🟦 **FHA** — neutral data
  with source + date; screen all free text (forbidden-placeholder pattern); no
  love-letter framing; no demographic/school/steering content in market or
  needs/criteria tools.
