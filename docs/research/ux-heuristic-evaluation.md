# Heuristic Evaluation — HomeOffer Direct

_UX research + product design audit · 2026-06-10 · read-only review of the codebase_

## Executive summary

HomeOffer Direct is a notably **mature, disciplined codebase for a v0.1**. The
design system is real (token-based brand/ink palette, `.btn`/`.card`/
`.container-page` component classes), the journey-centric IA was deliberately
built, and accessibility was clearly considered (accessible dropdown nav, a
mobile sheet with `role="dialog"`/Escape, an `aria` radiogroup on the scorecard).
The Tools menu is **already curated to 5 items** — per-stage tools live in
context via `STAGE_TOOLS`. This is better than feared.

The gaps are mostly **polish and the "glue" of a finished product**, not
structural debt: repetition that should be consolidated, a couple of genuine a11y
holes, missing wayfinding for the ~18 tool routes, and the absence of the
"feels-complete" layer (onboarding, tools index, trust/credibility, real data).

**Top 5 things to fix**

1. **No tools index / wayfinding for ~18 `/tools/*` routes.** Only 2 tools are in
   the top nav; the rest are reachable only via in-journey `STAGE_TOOLS` or URL.
   A `/tools` directory page is the single highest-leverage IA fix.
2. **Three near-identical amber disclaimer banners** (`LegalNotice`,
   `OfferDisclaimer`, an inline listings banner) — consolidate to one primitive.
3. **No skip-to-content link** and **no `prefers-reduced-motion` handling** — two
   quick, high-value a11y wins.
4. **The 1–5 rating "radiogroup" in the tour scorecard isn't keyboard-operable.**
5. **No first-run onboarding** — a new buyer lands on a marketing homepage then
   empty dashboard/tracker/showings.

**Weighted Nielsen score: ~3.9/5** — a strong, trustworthy core with polish/glue gaps.

---

## Findings by section

### 1. Design consistency

- **(Med) Duplicated amber disclaimer banner** rendered three independent ways
  (`legal-notice.tsx`, `offer-disclaimer.tsx`, an ad-hoc inline copy in
  `listings-browser.tsx`). → Extract one `<Callout tone="warning">` (or reuse
  `TrustCallout`'s warning tone) and compose the others from it.
- **(Med) Tool-page wrapper copy-pasted ~18×** (identical `container-page` +
  `max-w-2xl` + H1 + intro shell across every `src/app/tools/*/page.tsx`). →
  Introduce a `<ToolPageHeader title intro>` component; eliminates drift and makes
  a future breadcrumb a one-line change everywhere.
- **(Low) Ad-hoc tone color sets** defined locally three times (`offer-status-badge`,
  budget `INSIGHT_TONES`, `trust-callout`). → One semantic tone scale
  (info/good/warn/danger) reused everywhere.
- **(Low) `.card` padding overridden inconsistently**; recurring "mini-card"
  note callouts (why-this-matters, without-an-agent) aren't a shared component.
- **(Low) `ToolDisclaimer` is a quiet gray `<p>`** while other disclaimers are
  loud amber — same job, inconsistent weight. Document a rule (quiet for estimate
  tools, loud for legal/contract surfaces).

Heading hierarchy, button variants, spacing, and the H1 scale are **remarkably
consistent across all 31 pages** — a genuine strength.

### 2. Navigation & IA

- **(High) No `/tools` index page.** ~18 tool routes; the top nav surfaces 5. The
  rest are discoverable only in-journey or by URL. → Build a `/tools` directory
  grouping tools by stage/category (reuse the `STAGE_TOOLS` map), add "All tools →"
  to the Tools dropdown + the mobile More sheet.
- **(Med) Footer Tools group is a stale 5-item subset** and its "every route
  reachable from the footer" comment is inaccurate. → Point it at the new `/tools`.
- **(Low) Tool pages have no breadcrumb / back-to-journey** affordance (journey
  step pages do). → Add a back-link to the shared `ToolPageHeader`.
- **(Low) Signed-out mobile "Dashboard" tab** lands on an empty page. → Consider
  pointing it at `/journey` or the new `/tools` index until there's deal data.

The **journey is clearly the primary spine** and in-context `STAGE_TOOLS`
discovery is genuinely good; the weakness is purely the missing top-down catalog.

### 3. Accessibility

- **(High) Tour-scorecard rating control** (`role="radiogroup"` + `role="radio"`
  buttons) is not keyboard-operable (no arrow-key selection, no roving tabindex).
  → Use native `<input type="radio">` styled as the 1–5 pills, or implement the
  roving-tabindex pattern.
- **(Med) No skip-to-content link** — keyboard users tab the whole header on every
  page. → Add a visually-hidden skip link + `id="main"`.
- **(Med) No `prefers-reduced-motion` support** despite global smooth scroll and
  many transitions. → Add a reduced-motion media block in `globals.css`.
- **(Low) Inputs rely on browser-default focus rings** (~43 bare inputs) while
  buttons have a nice `focus-visible:ring`. → Shared `.field` input class with a
  focus ring.
- **(Low) Muted text contrast** (`ink-muted` #64748b at `text-xs`) is borderline;
  prefer `ink-soft` for the smallest text.
- **(Low) Calendar "today" cell is color-only** → add an `sr-only "Today"`.

**Strengths:** the desktop dropdown nav is a textbook accessible menu
(haspopup/expanded/controls, arrow/Home/End/Escape, focus return); the mobile
sheet is a proper `role="dialog"`/`aria-modal`; `aria-live` on result counts;
good landmark usage.

### 4. Mobile / responsive

- **(Low) Bottom tab targets** are borderline ~44px; consider `py-2.5`.
- **(Low) Calendar** correctly degrades to an agenda list on mobile (good); month
  grid truncates to 3/day without a drill-down.
- **(Low) Wide comparison tables** (comps, lender-compare, compare-homes) — verify
  horizontal overflow guards at 360px.
- Layout correctly reserves space for the fixed tab bar (`pb-16` + safe-area inset).

### 5. Content / UX writing

- **(Med) Disclaimer fatigue + inconsistent register** — 4 disclaimer mechanisms
  plus per-page caveats plus the footer line. Necessary for UPL, but one visual
  language would reduce noise.
- **(Low) Glossary under-leveraged** — jargon in tool pages (PITI, DTI, LTV, QM
  ceiling, appraisal-gap, escalation) isn't linked to the glossary at point of use.
- **(Low) Voice is consistent and good** — plain-English, second person, confident.

### 6. Heuristic scorecard (Nielsen)

| Heuristic | /5 | Note |
|---|---|---|
| 1. Visibility of system status | 4 | Stage X of 14, aria-live counts, export states; no global progress outside journey/dashboard. |
| 2. Match with real world | 4.5 | Strong domain language in plain English; glossary; minor jargon-linking gap. |
| 3. User control & freedom | 4 | Reset/Clear all, dismissible WhatsNext, Escape closes menus; missing breadcrumbs + undo on Clear all. |
| 4. Consistency & standards | 3.5 | Excellent tokens/headings/buttons; pulled down by duplicated disclaimers, copy-pasted shells, 3 tone vocabularies. |
| 5. Error prevention | 4.5 | Standout: wire-fraud forced verification, CD 3-day rule, fair-housing screening, UPL guardrails. |
| 6. Recognition vs recall | 3.5 | In-context tools great; no tools index forces recall; jargon not always defined at use. |
| 7. Flexibility & efficiency | 4 | Deep-linkable steps, xlsx/CSV export, HomePicker prefill; no power-user shortcuts (fine). |
| 8. Aesthetic & minimalist | 4 | Clean, restrained, good whitespace; slight disclaimer noise. |
| 9. Error recovery | 3.5 | Light form validation (no range/inline errors); friendly empty states. |
| 10. Help & documentation | 4 | Glossary, why-this-matters, legal page, pro handoffs; no onboarding. |

**Overall ≈ 3.9/5.**

---

## Prioritized recommendations

### (A) Quick wins — applied in this work

1. Skip-to-content link + `id="main"`.
2. `prefers-reduced-motion` handling in `globals.css`.
3. Keyboard-accessible tour-scorecard rating (native radios).
4. Shared `.field` input class with an accessible focus ring on high-traffic inputs.
5. `sr-only "Today"` on the calendar.
6. Consolidated amber disclaimer into one shared callout.
7. `ToolPageHeader` extracted across the ~18 tool pages (+ back-to-journey link).
8. A `/tools` index page grouping tools by stage, linked from the nav + footer.

### (B) Larger / strategic — roadmap

- **First-run onboarding** ("Where are you in the process?" intake that seeds
  WhatsNext and recommends a starting stage + tools).
- **Unify the tone/callout system** into one documented `<Callout tone>` primitive.
- **Form validation & error-recovery layer** (range checks, inline errors, "this
  looks unusually high/low" nudges on financial inputs).
- **Glossary-everywhere** inline tooltips for jargon first-use.
- **Mobile polish pass** (tap targets; horizontal-scroll guards on tables).

---

## Product-gap evaluation — what's needed to feel complete (prioritized)

1. **(High) Tools discoverability + index** — the product *has* the tools but
   doesn't let users find them top-down.
2. **(High) Onboarding / first-run** — new buyers hit a marketing page then empty
   surfaces; no flow connecting first visit → first action.
3. **(High) Trust & credibility surface** — for an audience skipping a $10k+
   professional there are no testimonials, security/privacy reassurance, "how we
   make money," or social proof. Biggest conversion/credibility gap.
4. **(Med) Real listings feed** — listings are sample placeholders (honestly
   disclosed); search/filter is basic (no map, saved searches, price-range min).
5. **(Med) Dashboard/progress cohesion** — no single overall % complete across
   tools (each saves independently via `useStageTool`).
6. **(Med) AI feature placeholders** — define the "coming soon / upgrade" UX
   consistently for the gated AI paths.
7. **(Med) Payments / paid tier** — watermark/print model implies free→paid, but
   no pricing page, checkout, or clear free/paid boundary.
8. **(Low) Data export/portability** — no account-level "export my whole deal"
   given device-local storage.
9. **(Low) Analytics** — none observed; needed to learn where buyers drop off in
   the 14-stage journey.

**Net:** the *engine* (journey, tools, guardrails, design system) is built to a
high standard. What's missing is the **trust layer, the front door (onboarding +
tools index), real data, and the commercial layer** — the things that turn a
strong toolkit into a product a nervous first-time unrepresented buyer will commit
their biggest purchase to.
