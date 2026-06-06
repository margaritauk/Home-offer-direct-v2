# Architecture Decision Records — HomeOffer Direct

_Architect · Last updated: 2026-06-06_

## ADR-001: Framework — Next.js 15 (App Router) + TypeScript

**Decision:** Build on Next.js 15 with the App Router, React 19, TypeScript in
strict mode.

**Why:** Content-heavy + interactive site. App Router gives us static rendering
for guide/glossary pages (fast, SEO-friendly) and client components where we
need interactivity (progress tracking, calculator). Easy zero-config deploy to
Vercel. TypeScript strict keeps the domain model honest.

## ADR-002: Styling — Tailwind CSS + small component layer

**Decision:** Tailwind CSS with a thin set of component classes (`.btn`,
`.card`, `.container-page`) and a `brand`/`ink` color scale.

**Why:** Fast, consistent, no runtime CSS-in-JS cost. The component layer keeps
markup readable without a heavy UI dependency for an MVP.

## ADR-003: Content as typed data, not a CMS

**Decision:** Journey stages/steps and glossary live as typed TypeScript data
(`src/lib/journey/*`, `src/lib/glossary.ts`) validated by the `JourneyStage` /
`GlossaryTerm` interfaces.

**Why:** MVP content is authored by us and changes with code. Typed data gives
compile-time safety, trivial static generation, and zero infra. A headless CMS
is deferred until non-engineers need to edit content. Trade-off: content edits
require a deploy — acceptable at this stage.

## ADR-004: Progress persistence — `localStorage`, no accounts

**Decision:** Task completion persists client-side in `localStorage` via a small
typed hook (`useProgress`). No backend, no auth in MVP.

**Why:** The PRD makes "no account required" a feature (low friction). Avoids
building auth/DB before validating the core experience. Trade-off: progress is
per-device and not portable — accounts are a fast-follow once validated.

## ADR-005: Routing & information architecture

```
/                                  Landing
/journey                           Journey overview (all stages + progress)
/journey/[stage]                   Stage detail (its steps)
/journey/[stage]/[step]            Step detail (guidance + checklist)
/tools/savings-calculator          Savings calculator
/glossary                          Searchable glossary
```

Stage/step pages are statically generated from the typed content via
`generateStaticParams`. The calculator, glossary search, and progress UI are
client components.

## ADR-006: Testing strategy

**Decision:** Vitest + Testing Library for unit/component tests (pure logic like
savings math and progress reducer get the most coverage); Playwright for one
happy-path E2E (land → open journey → complete a task → see progress).

**Why:** Pure functions (savings calc) are the highest-value, most regression-
prone units. One E2E guards the critical wiring without a heavy suite for an MVP.

## ADR-007: State layer (deferred depth)

**Decision:** Model state-specific behavior as guidance/flags in content
(attorney-vs-escrow closing path, disclosure-regime notes) rather than a
data-driven per-state engine in MVP.

**Why:** Full per-state legal templates are a large, compliance-sensitive
effort. We surface the *distinction* and prompt the buyer to confirm their
state's path — enough to be trustworthy — and defer the generative legal layer.

## ADR-008: Per-state legal engine (Sprint 2 — supersedes the deferral in ADR-007)

**Decision:** Promote the state layer from inline notes to a **data-driven
engine**. A typed `StateProfile` per US jurisdiction (50 states + DC) captures
the closing path (attorney / escrow / either), whether an attorney is legally
required at closing, the disclosure regime and statutory form name, who
customarily pays transfer tax, and links to official state sources. The buyer
picks their state (persisted in `localStorage`, like progress); relevant journey
steps then render a state-aware callout, and a dedicated guide page summarizes
the jurisdiction.

**Scope guardrail (still honoring ADR-007's spirit):** the engine provides
*guidance and official-form references*, not generated legal documents. We name
the required disclosure form and link to the authoritative source; we do not
draft or fill contracts. This keeps us clear of the unauthorized practice of
law while delivering the trust-critical state awareness the research demanded.

**Why:** Research flagged the state layer as non-negotiable for trust and
legality (attorney-vs-escrow closing, widely varying disclosure rules). It's
fully buildable as typed data with zero external dependencies, and it's the
clearest differentiator versus static educational sites.

## ADR-009: Professional directory + handoffs (Sprint 3)

**Decision:** Add a searchable, filterable directory of the pros a self-serve
buyer hands off to — real estate attorneys, home inspectors, and title/escrow
companies — filterable by role and state, and surfaced contextually at the
journey moments where each pro matters (attorney before going under contract,
inspector at the inspection stage, title/escrow at closing).

**Data integrity guardrail (important):** we do **not** fabricate real businesses
with invented contact details — that would mislead buyers and could cause real
harm. The directory is built from two honest sources:
1. **Official "find a vetted pro" finder services** that are real and
   authoritative — state bar lawyer-referral services (attorneys), InterNACHI /
   ASHI (inspectors), and ALTA (title/escrow). These are the real handoff path.
2. **Clearly-labeled sample listings** (explicitly illustrative, not real
   endorsements) that demonstrate how curated/partner listings render. The UI
   labels these as samples so no one mistakes them for vetted referrals.

This keeps the feature trustworthy today while the data model and UX are ready
to accept real, verified partner listings later.

**Why:** Research called out an attorney + inspector marketplace as the key
risk-mitigation for going agent-free (a flat-fee attorney neutralizes most
agentless legal risk). The directory + contextual handoffs deliver that without
external dependencies or compliance exposure.

## ADR-010: Document & deadline tracker (Sprint 4)

**Decision:** Add a `/tracker` tool that turns the two dates a buyer knows — the
date they went under contract and the target closing date — into a concrete,
countdown-driven timeline of the deadlines that matter (earnest money,
inspection / appraisal / financing contingencies, title review, the Closing
Disclosure 3-business-day rule, final walkthrough, closing). Plus a
phase-grouped document checklist (what to gather and keep). All state persists
in `localStorage` (consistent with the no-account approach).

**Design:** The date math lives in a pure, fully unit-tested module
(`lib/deadlines.ts`) — milestone offsets from the contract date, business-day
math for the CD rule, and a relative status (overdue / due today / soon /
upcoming) computed against "today". Contingency offsets ship as an editable
template with sensible defaults. The UI and a `useTracker` localStorage hook sit
on top.

**Why:** The riskiest part of an agent-free purchase is blowing a contingency
deadline (research §2). A buyer normally leans on an agent to track these; this
tool replaces that safety net. Pure date logic is high-value, regression-prone,
and trivially testable — exactly where tests earn their keep (cf. the savings
engine).

**Guardrail:** offsets are *typical* defaults, not legal terms — the buyer's
actual contract governs. The UI says so and lets them edit every offset.

## Sprint backlog

### Sprint 1 — Core journey MVP ✅
- [x] `JourneyStage`/`JourneyStep`/`GlossaryTerm` domain types
- [x] Author 14-stage journey content (22 steps, 94 tasks, 25 glossary terms)
- [x] Landing page (hero, how-it-works, savings teaser, white-space, CTA)
- [x] Journey overview page with progress
- [x] Stage detail + step detail pages (static generation)
- [x] `useProgress` localStorage hook + checklist UI + progress bars
- [x] Savings calculator (pure `lib/savings.ts` + UI)
- [x] Glossary page with client-side search
- [x] Trust callout component (wire-fraud / CD 3-day / walkthrough)
- [x] Unit tests (savings, progress) + E2E happy path
- [x] CI workflow (typecheck, lint, build, test) + Vercel deploy config + README

### Sprint 2 — Per-state legal engine ✅
- [x] `StateProfile` domain type + selectors (`lib/states`)
- [x] Author 50-state + DC dataset (closing path, disclosures, transfer tax, sources)
- [x] `useStateSelection` localStorage hook + state picker component
- [x] State guide page(s): `/states` overview + `/states/[code]` (static)
- [x] State-aware callout injected into relevant journey steps (closing, disclosures)
- [x] Unit tests (state data integrity + selectors) + E2E (pick state → see guidance)

### Sprint 3 — Professional directory + handoffs ✅
- [x] `ProProfile` / `ProRole` / finder-resource domain types + selectors (`lib/pros`)
- [x] Data: real official finder services per role + clearly-labeled sample listings
- [x] `/pros` directory page: search + filter by role and state
- [x] Pro card + finder-resources section (state-aware: uses selected state)
- [x] Contextual handoff component injected at the relevant journey steps
- [x] Unit tests (data integrity + filtering) + E2E (filter directory, see handoff)
- [x] Mobile navigation menu (fast-follow fix)

### Sprint 4 — Document & deadline tracker
- [ ] Pure `lib/deadlines.ts`: milestone offsets, business-day math (CD rule), status
- [ ] Document checklist data (phase-grouped) + types
- [ ] `useTracker` localStorage hook (dates, offsets, doc statuses)
- [ ] `/tracker` page: date inputs → computed timeline + document checklist
- [ ] Unit tests (deadline math + hook) + E2E (enter dates → see deadlines)
