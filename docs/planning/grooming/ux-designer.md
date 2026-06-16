# UX grooming — HomeOffer Direct 10-sprint roadmap

_Contributor: Product Designer (UX) · 10-sprint grooming · 2026-06-16_

Grooms `docs/planning/roadmap-10-sprints.md` (S1..S10) into UX specs. For each epic:
**(1) IA placement + entry points · (2) flow + screen states (default/empty/loading/error/gated/paywalled) · (3) UX acceptance criteria incl. a11y + mobile · (4) reuse.**

## Conventions that bind every sprint (read once)

- **The 5-anchor IA is fixed** (`src/components/nav/nav-config.ts`, `mobile-tab-bar.tsx`): top bar is Journey · Search Homes · Tools ▾ · My Deal ▾ · Start free; mobile is Journey · Search · Tools · My Deal · More. New surfaces attach to one of these anchors or to the journey/stage spine — **do not add a sixth top-bar anchor.** Per-stage tools live in-context via `STAGE_TOOLS`, never the top bar.
- **The journey is the movement model.** New "do this now" surfaces deep-link from the cockpit and from the relevant stage step, not from a new global tab.
- **Three-tier disclaimer system — use the right weight, do not invent a fourth:**
  - `ToolDisclaimer` (`src/components/tools/tool-disclaimer.tsx`) — quiet gray `<p>`, for **estimate** tools.
  - `DisclaimerBanner` (`src/components/disclaimer-banner.tsx`) — amber `role="note"`, the single amber primitive.
  - `TrustCallout` (`src/components/trust-callout.tsx`) — loud info/warning/danger, for **trust-critical** moments (wire fraud, CD 3-day, consent).
  - Rule already documented in the heuristic audit: **quiet for estimate tools, loud for legal/contract/money-movement surfaces.**
- **AI-explainer disclosure pattern is set** (`src/components/offer/offer-strength.tsx`, `tools/budget-calculator.tsx`): default-off → renders an inline gray "Coming soon" pill; when offered → a secondary button; AI output sits in an indigo box under a **LOUD uppercase "AI-generated, educational only — not advice, no guarantee"** label + pro/attorney handoff + "only restates the factors above." Reuse this verbatim, never a new pattern.
- **State save/undo pattern is set** (`useStageTool`: `hydrated` flag + `UndoToast` on destructive reset). Every new tool follows it: render `Loading…` until `hydrated`, offer Undo on Clear/Reset.
- **Existing a11y debt to NOT repeat** (from `ux-heuristic-evaluation.md`): never ship a custom `role="radiogroup"` that isn't arrow-key operable (use native radios); keep the skip-link + `id="main"` + `prefers-reduced-motion` respected; give every new input the shared `.field` focus ring (no bare browser default); never encode state in color alone (add `sr-only` text); keep tap targets ≥44px (`min-h-[44px]`). Reuse the proven accessible primitives: `NavGroup` dropdown (haspopup/expanded/arrow/Esc/focus-return), the `role="dialog"`/`aria-modal` bottom sheet, `aria-live` on counts.
- **Copy framing carries the legal posture.** Process-not-advice (UPL); conditional savings "up to ~2.5%, if you ask and the deal allows" (UDAP); neutral, sourced, as-of-dated facts (UDAP/H2); no protected-class signals or steering (FHA); "ask your lender / title officer / attorney," never directive. Flagged per-epic below where it is load-bearing.

---

# S1 — Reminders + active next-actions cockpit (the highest-leverage redesign; no gate)

## R3 — Active next-actions cockpit (the flagship)

**IA placement + entry points.** Lives as the **top band of `/dashboard`** ("My Deal" anchor), above the per-home rollup grid, replacing the current static `WhatsNext` strip on that page with a richer cockpit. It is the **default landing for returning signed-in users** (the empty-marketing→empty-dashboard gap the audit flagged). Entry points: My Deal ▾ → Dashboard (desktop); the "My Deal"/"Dashboard" tab (mobile); the post-login redirect; and a "Back to your deal" link from any tool. Do **not** make it a new top-bar anchor — it is the cockpit *inside* My Deal.

**Flow + screen states.** The cockpit shows **the 1–3 things to do this week and why**, each as an action card: a verb-led title, a one-line "why this matters now," a date/urgency chip, and a primary deep link into the exact tool/stage. Source it from `buildHomeRollups` + `deriveNextAction` + `computeMilestones` (all shipped) — extend `deriveNextAction` to return a *ranked top-N* across homes rather than one-per-home.
- **Default:** 1–3 ranked cards (most-urgent first: expiring offer → financing/closing milestone today/overdue → showing follow-through), each with its deep link and a per-card "armed reminder ✓/Set a reminder" affordance (ties to R1).
- **Empty (no deal data):** not a blank page — a first-run prompt "Tell us where you are" linking to `first-run-onboarding` + "Start: Get Ready," mirroring `WhatsNext.isStart`. Never a bare empty dashboard.
- **Loading:** skeleton cards until `hydrated`; no SSR/client flash (the `WhatsNext` `hydrated` guard pattern).
- **All-clear:** a calm "Nothing needs you this week — next up: <milestone> on <date>" card, not an alarm.
- **Overdue:** the date chip uses `statusFor` tone (danger/amber/neutral) **plus an icon/text label** ("Overdue") — never color alone.
- **Error:** a per-card "couldn't compute this" fallback that degrades to the static next-action string; the cockpit never blanks the whole dashboard.

**UX acceptance criteria.**
- Cards are an ordered list (`<ol>`); each action is a real link/button reachable by keyboard with a visible `focus-visible` ring; the primary CTA is first in DOM order.
- Urgency conveyed by chip text + icon + color, not color alone; `aria-live="polite"` only on the count of items needing attention, not on every re-render.
- Mobile: single-column stack, full-width tap targets ≥44px, reachable above the fixed bottom tab bar (respect the `pb-16`/safe-area reserve).
- Copy is **process, not advice**: "Schedule your inspection by the contingency date," never "you should waive…"; every date carries "the contract governs — no deadline here is of record."
- Respects `prefers-reduced-motion` on any card-reorder transition.

**Reuse.** `buildHomeRollups`/`deriveNextAction`/`computeMilestones`/`statusFor` (`lib/homes/rollup.ts`, `lib/deadlines.ts`); `WhatsNext` (`hydrated`/dismiss/Start patterns); `card`/`btn-primary`; `ContactsHub` already co-located on the dashboard. New: a `CockpitBand` composing the above + a `rankNextActions(rollups, today)` pure selector (unit-testable, mirrors the existing rollup test style).

## R1 — Reminders (in-app + browser push first; email deferred to S2)

**IA placement + entry points.** A **per-card "Set a reminder" affordance** on every cockpit action and every milestone in `/tracker`, plus a **reminders preferences panel under `/account`** (opt-in toggle, push permission state, time-of-day). No new route. A small bell/"Reminders" entry in the My Deal ▾ surface.

**Flow + screen states.**
- **Default / opt-in:** first "Set a reminder" tap opens a lightweight consent step ("Get a nudge before this date — in-app, and on this browser if you allow notifications"). Two channels: in-app banner on next visit; browser push (Notification API permission prompt).
- **Permission states:** *default* (not yet asked) → show the value-first prompt before the native dialog; *granted* → "Reminder armed ✓"; *denied* → graceful fallback to in-app-only with "Turn on browser notifications in your settings to also get pushed" (never re-spam the native prompt).
- **Armed:** the source action shows "Reminder armed ✓" with an Undo/remove; re-fires when a contract date moves (`computeMilestones` recompute).
- **Disabled-when-gated:** signed-out users see "Sign in to arm reminders" (reminders need the account for the server scheduler) — disabled control with an explanatory tooltip, not a dead button.
- **Empty/error:** scheduler unreachable → "We couldn't arm this reminder — your dates are still saved; try again." Never silently fail.

**UX acceptance criteria.**
- Push permission is **never** requested on page load — only on an explicit user gesture (value-first prompt → native dialog). Denied state is respected permanently within the session.
- The opt-in and every "Set a reminder" control is keyboard-operable, labelled, and announces its armed/not-armed state to screen readers (`aria-pressed` or live status text, not icon-only).
- Mobile: the bell/armed affordance is ≥44px; in-app reminder banners dismissible and non-blocking.
- Copy: reminders are **process nudges** ("Your inspection contingency date is in 3 days"), never directive ("you must…"); footer note "we surface your dates; the contract is the source of truth."

**Reuse.** `computeMilestones`/`statusFor` for what/when; `UndoToast` for remove; the `role="dialog"` sheet for the opt-in on mobile; `useAuth` for the gated state.

## H2 — Fact/date freshness sweep (UX surface only)

**IA placement.** Not a screen — an **"as-of <date> · source" line** rendered consistently under every dated legal/market/tax claim (state guides, closing-cost, post-close facts). Establish one tiny `<SourceStamp asOf source />` primitive so the cadence is visible and consistent.

**Acceptance.** Every dated fact shows source + as-of date in `ink-soft` (not the borderline `ink-muted` at `text-xs`); stamps are real text (screen-reader legible), not tooltips-only. **UDAP framing:** neutral data presentation, no editorializing.

---

# S2 — Monetization: paywall/unlock + honest pricing (trust-critical)

## #41/#58 — Paywall / unlock + paid export · #63 pricing · WTP test

**IA placement + entry points.** Two new surfaces:
1. **`/pricing`** — a real pricing page (the audit's biggest conversion/credibility gap). Reachable from the footer, a "Pricing" link in the marketing header, and as the destination of every unlock CTA. **Includes the "How we make money" trust band** (see below).
2. **The unlock moment is inline, at the highest-value artifact** — the operative offer/export, the binder export (`/deal/print`), and handoffs — *not* a standalone page. The paywall sits **on the export/finalize action**, where value is already demonstrated, never gating the educational journey or estimate tools (those stay free — that is the trust wedge).

**Flow + screen states.**
- **Default (free, pre-unlock):** the full worksheet/estimate experience is unchanged and free. The unlock CTA appears only at the export/finalize step: "Unlock your offer packet & export — keep 95%+ of your ~$10k."
- **Paywalled state:** a clear locked artifact with a **watermarked/preview** read of what they'll get (reuse the existing watermark/print model), the price, the tier comparison, and the trust band — never a hard wall with no preview.
- **Tier comparison:** a two-column **DIY (anchor) vs Guided (premium)** table — what's in each (DIY = export + binder; Guided = + handoffs/priority), with the Guided tier deliberately tested *upward* toward the $1,995 anchor. Use a real semantic `<table>` with a header row, not div soup.
- **Checkout (Stripe):** loading state on the pay button (disabled + "Starting checkout…"); redirect to Stripe; **return states** = success ("Unlocked ✓ — your packet is ready" + fires the realized-savings event), cancel (back to the paywall, nothing lost), error ("Payment didn't complete — you weren't charged; try again").
- **Disabled-when-gated (`PAYMENTS_ENABLED` off):** the unlock CTA renders as **"Paid export — coming soon"** (mirroring the AI "Coming soon" pill pattern) so the build lands before the Stripe key; the free experience is untouched.
- **Post-unlock:** the artifact is permanently unlocked for that deal; export/print enabled; a receipt is shown (email receipt is the S2 fast-follow #42).

**The "How we make money" trust band (load-bearing copy).** A prominent `TrustCallout tone="info"` (or a dedicated trust band on `/pricing`):
> "We charge one flat fee. **We don't take a commission, and we don't sell your loan or title.** No percentage of your price, no kickbacks, no upsell to a lender or title company. You keep the commission you negotiate."
This is the structural differentiator Homa's transaction-broker and reAlpha's cross-sell models can't claim — give it visual prominence, not fine print.

**UX acceptance criteria.**
- **Honest pricing, no dark patterns:** real price shown before checkout; no fake scarcity/countdown; cancel always returns the user with nothing lost; one-time flat fee stated plainly (not "from $X").
- **Savings copy stays conditional** (UDAP): "up to ~2.5%, if you ask and the deal allows" — never an unconditional dollar promise; **public savings copy does not launch ahead of legal sign-off** (gate). Until sign-off, savings figures stay framed as the buyer's own conditional estimate.
- Tier table is a keyboard-navigable semantic table; comparison readable at 360px (horizontal-scroll guard, the audit's wide-table concern).
- Pay button has a clear disabled/loading state; success/cancel/error are distinct, announced surfaces, not silent redirects.
- **RESPA/UPL:** tiers are tools + education, not advice; any referral surface stays flat, disclosed, fee-free.

**Reuse.** Watermark/print model (existing); `TrustCallout` for the trust band; `DisclaimerBanner` for conditional-savings note; `card`/`btn-primary`; the binder export (`deal/print`) as the gated artifact. New: `/pricing` page, `PaywallGate` wrapper, `TierComparison` table, `useEntitlement(dealId)` reader behind `PAYMENTS_ENABLED`.

## #42 — Email fast-follow (reminders + receipts)

**Placement.** Email channel added to the R1 reminders panel (`/account`) and an auto-receipt after unlock. **States:** email-capture/verify; "We'll email you before each deadline"; unsubscribe link in every email. **A11y/copy:** double opt-in, clear unsubscribe; receipts plain-text legible. No new screen beyond the toggle.

---

# S3 — Document binder: upload / store / organize (the connective tissue)

## R2 — Document binder (upload/store/consent/delete on Supabase Storage)

> **Naming care:** the *existing* `DealBinder` (`src/components/deal/deal-binder.tsx`, route `/deal/print`) is a **printable read-only summary** of saved worksheet data. R2 is a **new uploaded-document custody binder** — keep them distinct. Suggest naming R2 "Documents" / `DocumentBinder` to avoid collision; the printable binder stays the "Buyer binder (print)."

**IA placement + entry points.** A **"Documents" band inside My Deal** — surfaced on `/dashboard` (a "Your documents" section) and on `/deal` (per-deal). It also exposes **attach-points** at the points of use: A5 disclosure-review ("attach the actual disclosure"), A4/contacts ("attach the title commitment"), and the tracker (attach proof per milestone). Entry points: My Deal ▾ → Documents; contextual "Attach a document" buttons on the disclosure/tracker/contacts surfaces. Gated behind `DOC_BINDER_ENABLED`.

**Flow + screen states.**
- **Empty:** "No documents yet — upload your disclosure, inspection report, or title commitment. Stored privately for this deal only." with a single primary Upload affordance and a one-line privacy reassurance.
- **Upload flow:** drag-drop or file picker → **per-deal consent gate fires before the first upload** ("These documents are stored encrypted, scoped to this deal, and deletable any time. [Store securely]"); progress bar while uploading; success → file row with name, type tag, size, uploaded-date.
- **Organized state:** rows grouped by category (Disclosures · Inspection · Title/Closing · Wire/Escrow · Other); each row = view, download, delete.
- **Loading:** skeleton rows until storage list resolves.
- **Error:** upload failure ("Couldn't upload — your other files are safe; try again"); too-large/blocked type ("We accept PDF, JPG, PNG up to N MB"); offline-aware.
- **Disabled-when-gated (`DOC_BINDER_ENABLED` off):** the Documents band shows "Secure document storage — coming soon" rather than a broken uploader.
- **Delete:** a confirm step (this is destructive + custody) → "Deleted. Removed from our storage." with a brief Undo window where feasible (`UndoToast`), else explicit confirm.
- **Wire-instructions object** carries the existing **wire-fraud `TrustCallout`** ("Always verify wire instructions by calling a known number — fraud is irreversible") at the point of upload/view.

**UX acceptance criteria (consent + a11y are the whole point here).**
- **Consent is explicit, dated, scoped, and revocable** — a real checkbox/affirmative action with the GLBA-style copy, *before* any file leaves the device; the consent date is shown and the user can withdraw + delete-on-demand. **(Legal gate: per-deal consent + retention/delete copy must be signed off before default-on; ship behind `DOC_BINDER_ENABLED`.)**
- We **store, we do not interpret** — no "this disclosure looks fine," no OCR-into-advice, no protected-class inference from contents (UPL/FHA). Copy frames it as a vault, not a reviewer.
- Upload control is keyboard-operable and screen-reader-labelled (drag-drop has a real `<input type="file">` fallback); progress announced via `aria-live`; file rows are a semantic list with accessible action buttons.
- Mobile: full-width upload target ≥44px; file rows stack; long filenames truncate with full name available to AT.
- Each file row's type/category conveyed by text label, not color/icon alone.

**Reuse.** Supabase Storage (in stack), per-deal RLS (shipped deals infra); `TrustCallout` (wire-fraud + consent); `UndoToast`; `card`; the `role="dialog"` sheet for the consent + delete confirm; the disclaimer system for the "we store, not interpret" line. This binder is what makes the S2 paid unlock worth *keeping* and is the prerequisite for S8 sharing.

---

# S4 — Productionize the AI explainers (production label + disclosure)

## AI1 — Promote #36 offer-strength + #57 budget explainers to a production provider

**IA placement + entry points.** **No new IA** — these are the *same in-place explainer panels* already in `OfferStrength` (`/tools/offer-builder`) and `BudgetCalculator` (`/tools/budget`). The change is provider + the default-on flip, not a new surface.

**Flow + screen states (the production label is the deliverable).**
- **Default-off (pre-sign-off):** the existing **gray "Coming soon" pill** — unchanged. Do not show the button until the public-claims gate clears.
- **Offered, idle:** secondary button "Explain my offer's strength (AI)" / "Explain my budget (AI)" (exact existing copy).
- **Loading:** button → "Explaining…" + disabled (existing `AiState` machine).
- **Done:** indigo box under the **LOUD uppercase production label** — keep verbatim: *"AI-generated, educational only — not legal or financial advice, no acceptance guarantee"* (offer) / *"AI-generated estimate — not financial advice; confirm with a licensed lender"* (budget) — followed by the narration, the "only restates the factors above" line, and the attorney/lender handoff link.
- **Unavailable:** "The AI explainer isn't available right now. The plain-English read above still covers your offer." (existing) — also the state when output was **blocked by FHA screening** (fail safe to the deterministic read).
- **Error:** existing graceful "something went wrong… the read above still covers your offer."
- **Rate-limited / cost-capped:** add a state "You've reached today's explainer limit — the read above is always available." (new, for the abuse controls.)

**UX acceptance criteria.**
- The disclosure label is **always rendered with the AI output** (never collapsible-away), high-contrast, and uppercase — screen readers announce it before the narration (DOM order: label first).
- The button is a real `<button>` with disabled/loading semantics; no spinner-only state without text.
- **Default-off until legal sign-off; flip is one flag** — the UI must degrade cleanly to "Coming soon" if the flag is off, with no dead controls.
- **Copy is the whole ballgame (UPL):** the model **only narrates our deterministic factors** — never invents numbers, never says "offer $X" or "waive Y." Every disclosure repeats "restates the factors above," not "recommends." No free-text reaches the model unscreened (FHA), and the handoff to a licensed pro is always present.

**Reuse.** `OfferStrength`/`BudgetCalculator` AI panels verbatim; the `AiState` machine; `isAiExplainerOffered` client flag; the indigo disclosure box. Pure provider swap behind the one-file seam — **no UI rebuild.**

---

# S5 — Financing spine (under-contract milestone tracker)

## F1 — Financing-milestone tracker

**IA placement + entry points.** A **new stage-scoped tool** attached **in-journey at the under-contract/financing stages** via `STAGE_TOOLS` (not a top-bar item), and surfaced in the **cockpit** (S1) — financing milestones flow into `computeMilestones`/`deriveNextAction` so they appear as "do this now" cards. Route `/tools/financing` (under the Tools catalog) with a back-to-journey link via `ToolPageHeader`.

**Flow + screen states.** Tracks loan-process steps: application → appraisal ordered/received → underwriting conditions → clear-to-close-by-financing-date.
- **Default:** a milestone checklist with date inputs (loan app date, appraisal date, CTC-by date); each milestone gets a status chip + "Set a reminder" (R1).
- **Empty:** "Enter your financing dates to track the loan process" + why-this-matters note.
- **Loading:** `Loading…` until `hydrated` (`useStageTool`).
- **Gated/disabled:** none (no vendor gate) — but reminders are gated on sign-in (R1 rule).
- **Error:** invalid date → inline field error (use the validation layer, not silent).

**UX acceptance criteria.**
- **SAFE-Act copy:** educate on the *process* only — "ask your lender about your rate-lock," **never quote a rate-as-offer or recommend a lender.** No lender names presented as advice.
- Reuses the existing low-appraisal arithmetic (`clear-to-close`) for the appraisal-gap surface, with neutral framing.
- Inputs use the shared `.field` focus ring; date fields keyboard-operable; status chips have text labels (not color alone); milestones a semantic list.
- Mobile: single column, ≥44px controls.

**Reuse.** `useStageTool` + `UndoToast`; `computeMilestones`/`statusFor`; `clear-to-close` appraisal math; `ToolPageHeader`; `ToolDisclaimer` (quiet — it's an estimate/process tool) + a `TrustCallout` only on the irreversible/closing edges.

---

# S6 — Title/closing depth + post-close LTV

## F2 — Title-commitment review (A5-pattern clone) + pre-CD closing-cost estimator

**IA placement.** Stage-scoped (closing stages) via `STAGE_TOOLS`; routes `/tools/title-review` and `/tools/closing-cost` under the Tools catalog. Cockpit-aware (closing milestones).

**Flow + states.** Title review is a **checklist of what to check / what to ask the title officer** (clone the cleared A5 disclosure-review boundary). Closing-cost estimator: inputs → estimated cash-to-close before the CD arrives.
- States mirror the existing checklist tools (default/empty/loading-via-`hydrated`/error inline-validation).
- The estimator carries the **quiet `ToolDisclaimer`** ("estimate only"); the CD-comparison edge carries the **loud `TrustCallout`** for the 3-day rule.

**Acceptance.** **UPL:** surface *what to check / what to ask*, **never "this exception is/isn't a problem."** Reuse the **already-cleared A5/A6 boundary copy** verbatim (legal gate is the same regime — do not re-author). Keyboard + semantic lists + `.field` rings.

## F3 — Post-close depth (homestead/exemption deadlines, tax-appeal windows, escrow literacy, refi-watch)

**IA placement.** A **new post-close surface** — best as a journey stage-14+ extension and a `/states/[code]` aware band ("After you close in <state>"). It's the cheapest retention/referral + evergreen-SEO surface, so it must be a real linkable page, not buried.

**Flow + states.** State-aware deadline cards (homestead filing deadline, tax-appeal window) + escrow-analysis explainer + a passive refi-watch note.
- **Empty/no-state:** prompt to pick a state.
- Each fact = `SourceStamp` (source + as-of date, H2 cadence).

**Acceptance.** **UDAP/UPL:** tax/homestead facts framed **neutrally, sourced, as-of-dated**; "check your county's deadline," never "you qualify." No demographic/value proxies (FHA). Mobile: state-aware cards stack; ≥44px.

**Reuse (S6).** A5/A6 disclosure-review checklist pattern (`disclosure-review.tsx`); state engine + `/states/[code]`; `useStageTool`; `TrustCallout` (CD 3-day); `SourceStamp` (from H2).

---

# S7 — SEO/tools flywheel + AI explainer extension

## SEO1 — Tool-led transactional-intent pages on the 50-state engine

**IA placement.** Extends the shipped 51-page state engine and the `/tools` catalog with **transactional "…in <state>" tool-led pages** (savings calc, offer builder, closing-path). These are **landing/entry surfaces** — they must funnel to activation, not dead-end.

**Flow + states.** Each page = a working tool (or a strong tool preview) + the "…in <state>" framing + a clear "Start your <state> journey" CTA into the journey.
- **Default:** tool above the fold, state context, activation CTA.
- **Empty/unknown-state:** sensible default + state picker.
- AI-Overview resilience = the page is a *usable tool*, not just prose.

**Acceptance.** **FHA:** SEO + any saved-search stays on **objective attributes** — no demographic or "good schools as value" proxies. Tool-page → activation CTA is keyboard-reachable, descriptive (not "click here"). Mobile-first (these are organic landing pages). `SourceStamp` on any state facts.

## AI2 — Grounded explainers on A2 price-band rationale + disclosure red-flags

**IA placement.** Same in-place explainer pattern (S4), extended to the **A2 suggested-range step** (`suggested-range-step.tsx`) and the **disclosure-review** surface. Pure reuse of the proven seam + indigo disclosure box.

**Acceptance (most conservative grounding).** **A2 narration is the most directive-prone surface** — copy says *"comps + the market suggest a range; you decide,"* **never "offer $X."** Same LOUD label, same "restates the factors above," same handoff. **Gated on the S4 public-AI-claims sign-off** — default-off "Coming soon" pill until then.

**Reuse (S7).** State engine + 51 pages; `/tools` catalog; the S4 AI explainer panel/seam verbatim; `SourceStamp`.

---

# S8 — Shared deal workspace (consent-before-visibility + agency capture; trust-critical)

## T1 — Shared activity feed, attribution, presence, conflict handling + agency-capture workflow

**IA placement + entry points.** Lives in **`/deal`** (the existing Manage-Deal surface under My Deal ▾, gated by `isDealsEnabled`). The shared **activity feed + presence** become a band on `/deal`; the **agency-relationship capture + financial-data consent** are the **gate that runs before any invited agent sees buyer data**. Entry: My Deal ▾ → Manage Deal; an "Invite your agent/co-buyer" CTA (RB users see this with higher prominence per the audience-aware nav). Gated behind `isDealsEnabled` (route 404s when off — already enforced).

**Flow + screen states (consent-before-visibility is the spine of this flow).**
1. **Invite:** owner invites a member (agent/co-buyer/attorney) by email/role (shipped invites infra).
2. **Agency-capture gate (forced):** before an **agent** can see any buyer financial data, the owner must **capture the agency relationship** (`represents_buyer` / `listing_side` / `unrepresented`) — using the centralized, legal-gated copy in `lib/deals/agency-copy.ts`. This guards accidental **dual agency** (a `listing_side` selection shows the dual-agency caution).
3. **Financial-data consent (default OFF):** a distinct, explicit, **dated, revocable** consent toggle ("Share my budget & offer financing with this agent — off by default; revoking cuts access immediately") before financials become visible. Until consent, the agent sees only non-financial deal context (field-level scoping).
4. **Shared state:** activity feed (change attribution "X updated the offer"), presence ("Y is viewing"), and **conflict handling** when two members edit shared tool state (last-write with a visible "Z changed this since you opened it — review" prompt, never a silent clobber).

**Screen states.**
- **Empty (no members):** "It's just you on this deal — invite your agent, co-buyer, or attorney." + the solo-works-fine reassurance.
- **Pending invite:** "Invited — waiting for them to accept."
- **Invitee first action (the activation KPI):** a clear "here's what you can do on this deal" first-run for the invited member.
- **Consent-not-given (gated visibility):** the agent's view explicitly shows "Financial details are hidden until <owner> consents" — honest, not a broken/empty panel.
- **DRAFT legal state:** while `LEGAL_REVIEW_APPROVED === false`, **every representation/consent surface MUST render `LEGAL_DRAFT_BANNER`** ("DRAFT — pending legal review… not legally binding") above the copy. This is a hard requirement already wired in `agency-copy.ts`.
- **Conflict:** "This was changed since you opened it" review prompt with both values, no silent overwrite.
- **Revoked consent:** immediate "Access removed" confirmation; the agent's financial view cuts off.

**UX acceptance criteria.**
- **Consent before visibility, always:** no buyer financial field renders to an invited agent before an explicit, dated consent; revocation is immediate and obvious. Field-level scoping is visible to the buyer ("they can see X, not Y").
- **Agency capture is forced** before agent data access and clearly worded to prevent accidental dual agency.
- **Legal gate:** the DRAFT banner shows until counsel flips `LEGAL_REVIEW_APPROVED`; consent dated + revocable; **RESPA review if any shared surface touches referral/closing revenue** (keep the pro directory the only referral surface, fee-free).
- Activity feed is a semantic, time-stamped list; attribution legible to AT; presence conveyed by text, not avatar-color alone.
- Keyboard: invite form, consent toggle (real checkbox, labelled, `aria-pressed`/state announced), and conflict-resolution actions all operable; consent toggle is **not** a custom non-operable control (avoid the radiogroup a11y debt).
- Mobile: invite + consent flows in the `role="dialog"` sheet; ≥44px controls.

**Reuse.** Deals/roles/RLS/invites (shipped: `lib/deals/*`, `DealManagementPanel`); **`agency-copy.ts`** (centralized legal-gated copy + `LEGAL_DRAFT_BANNER` + `FINANCIAL_CONSENT_PROMPT`); `financials.ts` for field scoping; `TrustCallout` for the consent/dual-agency cautions; the S3 documents binder (sharing is hollow without it — that's why S3 precedes S8). New: activity-feed component, presence indicator, conflict-review prompt.

---

# S9 — In-deal comms + live-data parity

## T3 — In-deal messaging / structured comments

**IA placement.** A **messaging band inside `/deal`** (the shared workspace from S8 — there must be a workspace to comment on). Per-deal thread + structured comments on shared tool state. No new top-bar anchor.

**Flow + states.**
- **Empty:** "No messages yet — coordinate with your co-buyer, agent, or attorney here."
- **Composing:** standard message box; send disabled while empty/sending.
- **Sent:** message appears attributed + timestamped in a semantic list.
- **Screened-out:** if a message is blocked by FHA screening, show an honest, non-judgmental "This message can't be sent as written — keep it about the property and the deal" (no protected-class/steering/"love-letter" content reaches the other party).
- **Error:** "Couldn't send — try again," draft preserved.

**UX acceptance criteria.**
- **FHA is the gate:** **every message routes through `screenText`/`screenOutput`** and is **off the AI allowlist** (it's a comms pipe, not advice — UPL). The screening block is worded neutrally and educationally, never accusatory.
- Messages are a semantic, attributed, time-stamped list; `aria-live="polite"` on new-message arrival; compose box keyboard-operable with a visible focus ring.
- Mobile: composer above the keyboard, send ≥44px, thread scrolls above the tab bar.

## P2-6 — Productionize the flagged RentCast market/listings tools to parity

**IA placement.** In-place upgrade of the existing market/listings surfaces (`market-conditions`, `listings-browser`) — same routes, real data swapped behind `RENTCAST_DISABLED` kill switch.

**States.** **Default-on (data live):** real comps/market with the existing honesty framing. **Killed (`RENTCAST_DISABLED`):** falls back to the **honestly-disclosed sample data** + the existing "sample listings" `DisclaimerBanner` — never a broken/empty grid. Loading skeletons; per-tool error → "Live data unavailable; showing samples." `aria-live` on result counts (existing).

**Acceptance.** Margin-guardrail copy stays honest about sample vs live; `SourceStamp` on live data; no FHA-proxy filters in search. Reuse `listings-browser` + the existing sample-data disclaimer.

---

# S10 — Agent console wedge (gated expansion) + trust upkeep

## T2 (#62) — Agent multi-client console / pipeline / "For agents" entry + seat model

**IA placement + entry points (audience-aware nav, already specced in IA research N7).** For **audience = agent**, the **Journey anchor is replaced by "Console"** (`/agent`) and **My Deal scopes to the selected client**; Tools remain. A **"For agents" entry point** links in **without diluting the buyer homepage hero** (the unrepresented buyer stays the hero). Hard-gated on the pricing decision (#63) + proven S2 monetization.

**Flow + screen states.**
- **Console default:** a pipeline across the agent's deals (only deals they're a member of — RLS); each client deal = stage, next deadline, next action (reuse the cockpit rollup logic per-client).
- **Empty (no clients):** "No client deals yet — invite a client or add a deal."
- **Seat/paywall state (#62 seat model):** locked behind the seat purchase; "coming soon" when the pricing gate is unset (mirror the S2 paywall pattern).
- **Per-client scope:** selecting a client re-scopes My Deal to that client's workspace (respecting the S8 consent/visibility rules — an agent still only sees consented financials).

**UX acceptance criteria.**
- **RESPA:** paid seats must **not** be referral-for-fee; the pro directory stays the only referral surface, **fee-free**. Seat model copy is a tool subscription, not a lead-gen fee. (Legal gate.)
- The buyer hero is untouched — the agent path is reached by an explicit "For agents" entry, never by demoting the buyer homepage.
- Agents only see member deals (RLS); the audience switch is reversible; nav updates cleanly (reuse the `useAudience` reader, N6/N7).
- Console pipeline is a semantic table/list; keyboard-navigable; per-client deadline badges have text labels.

**Reuse.** The S1 cockpit rollup (`buildHomeRollups`) per-client; `useAudience` + audience-aware nav (IA research N6/N7); deals/RLS/invites; the S2 paywall pattern for seats; the S8 consent rules for agent-side financial visibility.

## H1 / H2 — Listings/MLS honesty refresh + recurring fact/date sweep

**Placement.** H1 keeps `/listings` honesty copy current (Clear Cooperation / portal policy) via the existing sample-data `DisclaimerBanner`. H2 is the recurring `SourceStamp` sweep across dated facts. **Acceptance:** honesty copy currency; every dated claim carries source + as-of date; no new screens.

---

## Cross-sprint UX dependencies & sequencing notes

- **S1 cockpit is the spine** the cockpit-aware tools (S5 financing, S6 closing, S10 console) all plug into via `deriveNextAction`/`computeMilestones` — build `rankNextActions` once in S1, extend its inputs later.
- **S3 documents precedes S8 sharing** for a UX reason too: the shared workspace is an empty room without documents worth sharing; the "Attach a document" affordances built in S3 become the shareable objects in S8.
- **S4 establishes the AI disclosure label** that S7 (AI2) reuses verbatim — do not re-author the label; both are gated on the same public-claims sign-off.
- **One new shared primitive to introduce early: `SourceStamp` (source + as-of date)** — used by H2, S6/F3, S7. Build it in S1's H2 sweep so later sprints just consume it.
- **Legal-DRAFT banner discipline (S8):** the `agency-copy.ts` gate (`LEGAL_REVIEW_APPROVED` + `LEGAL_DRAFT_BANNER`) is already the pattern — every new consent/representation/public-savings/public-AI-claims surface must render its DRAFT/gated state until counsel flips the flag, mirroring how the AI explainer and payments ship default-off.
- **No new top-bar anchor in any sprint** — every surface above attaches to Journey, Tools, My Deal, the cockpit, or the stage spine, preserving the audited 5-anchor IA.
