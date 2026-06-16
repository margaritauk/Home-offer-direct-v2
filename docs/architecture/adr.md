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

## ADR-011: Listing search (mock data behind a provider seam) (Sprint 6)

**Decision:** Ship a `/listings` search/browse experience now, powered by a
**mock dataset** behind a single data-access seam (`lib/listings/provider.ts`).
The UI filters by state, price, beds/baths, and property type, and links a found
home into the offer step of the journey. Listing imagery is generated as
self-contained **SVG placeholders** (no external photos / licensing risk), and
every listing is clearly flagged `isSample` with a prominent banner.

**The seam:** all reads go through `queryListings()` / `getListingById()`. The
mock implementation filters a bundled array today; swapping in a paid MLS/portal
feed later means reimplementing just that module (and making it async +
server-side) — no UI changes to the cards, filters, or detail page.

**Why:** Listing search needs a paid data feed we don't have yet, but the
search/browse UX, filters, and journey hand-in are valuable and fully buildable
now. Mocking unblocks the experience; the seam keeps the real integration cheap.
See the backlog story below for the paid pipeline.

### Backlog (future) — Plug in the paid MLS/listings pipeline
- Replace `lib/listings/provider.ts` mock with a real provider (e.g. a licensed
  MLS aggregator / IDX feed or a portal API).
- Make reads async + server-side (API route or server component) with caching;
  add pagination and real geo/photo fields.
- Handle data licensing/attribution, rate limits, and per-state IDX rules.
- Keep the `Listing` shape stable so the existing UI is reused unchanged.

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

### Sprint 4 — Document & deadline tracker ✅
- [x] Pure `lib/deadlines.ts`: milestone offsets, business-day math (CD rule), status
- [x] Document checklist data (phase-grouped) + types
- [x] `useTracker` localStorage hook (dates, offsets, doc statuses)
- [x] `/tracker` page: date inputs → computed timeline + document checklist
- [x] Unit tests (deadline math + hook) + E2E (enter dates → see deadlines)

### Sprint 5 — Accounts + cloud sync ✅
- [x] Supabase client + `isCloudSyncEnabled` flag (feature-gated)
- [x] `useAuth` (email/password) + `/account` panel + header auth link
- [x] Pure `mergeSyncData` (+ tests), local-store aggregator + change events
- [x] `CloudSync` orchestrator (merge-on-login, debounced push) + schema/RLS + setup docs
- [x] URL normalization fix (fast-follow)

### Sprint 6 — Listing search (mock data behind a provider seam)
- [ ] `Listing` / `ListingFilters` types + `lib/listings/provider.ts` seam
- [ ] Mock dataset (~15 sample listings, all flagged isSample)
- [ ] SVG placeholder listing imagery (no external photos)
- [ ] `/listings` browse + filters (state/price/beds/baths/type) + `/listings/[id]`
- [ ] Journey hand-in (found a home → start your offer)
- [ ] Unit tests (filter logic) + E2E (filter listings, open detail)

---

## ADR-012: Multi-user collaboration — shared deals, roles, RLS (v2 platform)

**Decision:** Introduce a **deal-centric, multi-user** data model so buyers and
agents collaborate, while preserving today's single-user/local-first experience.

**Model:**
- Reframe today's "my journey/tracker/offer/budget" as **deal #1, owned by me**.
- New tables: **`deals`** and **`deal_members`** (user ↔ deal ↔ `role` ↔ status),
  roles: `owner_buyer | co_buyer | agent | attorney | viewer`.
- Per-deal state starts as a **`deal_data` row** that reuses the existing
  `SyncData` shape + `mergeSyncData` (drop-in), normalizing hot facets
  (messages, docs, activity) into their own tables later.
- **RLS** via a `SECURITY DEFINER STABLE` membership helper
  (`is_deal_member(deal)`, `has_deal_role(deal, role)`); policies wrapped in
  `select(...)`, scoped `TO authenticated`, membership columns indexed.
- **Invitations:** Supabase has no native team invites — use `SECURITY DEFINER`
  RPCs / Edge Functions with expiring tokens; pending → active on accept;
  normalized emails.
- **Realtime (phased):** (1) per-deal Postgres Changes → re-fetch (reuses RLS);
  (2) private channels + Broadcast/Presence for chat/live presence.
- **Field-level scoping:** a buyer's financial data is hidden from non-consented
  roles (GLBA) — explicit per-deal consent gates sharing.

**Coexistence (critical):** local/guest mode is unchanged and remains the
default; **deals, sharing, the agent console, and realtime are all feature-gated
on Supabase being configured** (mirrors the existing cloud-sync flag). No keys →
the app behaves exactly as today, single-user and local-first.

**Why:** Collaboration requires genuinely shared data (not device-local). Anchor
on Supabase (already our auth/sync backend); RLS gives per-deal authorization
with minimal app-layer code. Reusing `SyncData`/`mergeSyncData` keeps the
migration incremental.

**Guardrails:** unrepresented path keeps every guardrail; represented paths add
consent + agency-relationship capture (no accidental dual agency) + FHA on shared
recommendations; RESPA review gates any referral/closing-tied revenue.

_Source: `docs/research/collaboration-platform-research.md`._

## ADR-013: Market-data seam (Null default + RentCast, new env gate) (Sprint 2 — A1)

**Context:** The A1 "market-conditions read" needs the four signals an agent
reads off a market — **months-of-supply, days-on-market, list-to-sale ratio, and
price trend** — so an unrepresented buyer knows how aggressive to be. That data
needs a paid feed we have wired only partially (RentCast), and the same vendor
already backs the listings (ADR-011) and comps (`comps-source.ts`) seams. We will
not overload the comps seam: comps reads the AVM/recent-sales endpoint, market
reads a different, area-level endpoint, and the two are gated and killed
independently.

**Decision:** Add a **third provider seam**, a sibling of listings/comps, under
`src/lib/market/`. All market reads go through a `MarketDataSource` contract
(`fetchMarketStats(area): Promise<MarketStats | null>`) with two implementations:

- **`NullMarketDataSource` (default)** — returns `null`/`[]`. With nothing wired,
  A1 still works entirely on buyer-entered numbers; we never fabricate a stat.
- **`RentCastMarketDataSource`** — calls RentCast **`/v1/markets`** (the
  area/zip-level stats endpoint, **distinct from the AVM endpoint the comps
  connector uses**), server-only key, mapped by a pure `mapRentCastMarket`.

A server-only `getMarketDataSource()` is the single switch point, mirroring
`getListingsDataSource()` / `getCompsDataSource()`: it returns the RentCast source
only when **`MARKET_DATA_SOURCE === "rentcast"` AND `RENTCAST_API_KEY` is set AND
the shared `isRentCastDisabled()` kill switch is off**, else the Null source. The
gate uses a **new `MARKET_DATA_SOURCE` env var (default off)** — we do **not**
overload `COMPS_DATA_SOURCE`, so market data can be turned on, off, or killed
without touching comps. The route wrapper never 500s: it returns
`{ stats, source }` and degrades to empty on any failure; the connector returns
`[]`/`null` on any error and **never throws and never fabricates**.

**Manual-entry-first:** A1 ships fully working with buyer-entered stats; the live
source is **additive and gated**, not a prerequisite. There is an **open spike**
on the exact `/v1/markets` field names (which list price the ratio uses, whether
DOM is cumulative). Until that is verified the connector must **degrade safely** —
unmapped fields stay manual-entry, and from the Researcher brief we already know
`/v1/markets` does **not** supply a list-to-sale ratio or a months-of-supply
sold-rate denominator, so those remain manual fields regardless.

**The metric set is a pure lib:** the neutral signals (months-of-supply bands,
days-on-market, list-to-sale ratio, price trend) and their interpretation
(`classifyMarket(stats): MarketRead` → a band enum + plain-English narrative +
trade-off framing, **never "offer $X"**) live in a pure, fully unit-tested module
(`lib/market/classify.ts`), no React/IO — same discipline as `lib/savings.ts` and
`lib/deadlines.ts`. The single read is computed **once** here and consumed by A2,
I3, I4, and J4 (no divergent classifications).

**Consequences:**
- Swapping or adding a real feed later means reimplementing only
  `src/lib/market/*` — A1's UI, the classifier, and consumers stay unchanged.
- Three RentCast-backed seams now share one kill switch and one key but three
  independent source vars; flipping `RENTCAST_DISABLED` cuts all three at once.
- **FHA guardrail:** the `MarketStats`/`MarketRead` types carry **transactional
  market data only — no demographic, school, safety, or "desirability" signals**;
  market conditions are described neutrally, sourced, and dated.
- **UPL/accuracy guardrail:** output is bands/facts/trade-offs, never a directive
  number; every figure renders its source (RentCast) + as-of date with a
  "snapshot, conditions move" caveat.

### Backlog (future) — Verify + land the RentCast `/v1/markets` connector
- Resolve the field-name spike against a live key; finish `mapRentCastMarket`.
- Keep the `MarketStats` shape stable so the classifier and A1 UI are reused.
- Hold the manual-entry path as the permanent fallback for thin-coverage areas.

## ADR-014: Reminders & server scheduler (Vercel Cron + Web Push, default-off) (Sprint 1 — R1)

**Context:** The riskiest part of an agent-free purchase is blowing a contingency
deadline; the pure deadline engine (`computeMilestones`, `lib/deadlines.ts`)
already turns the two anchor dates into the milestones that matter, but nothing
*pushes* a buyer when one is about to cross. A reminder is "a milestone whose date
crosses a threshold relative to today, not yet acknowledged" — so the policy is
pure logic, but firing it needs the first always-on server job we've built. That
job must be observable, hold secrets server-side, and not fork the deadline math
into a second runtime. R1 ships in S1 with **no external vendor**, so it must work
on in-stack pieces alone and ship default-off behind an opt-in.

**Decision — scheduler is Vercel Cron, not Supabase pg_cron:** a Vercel Cron route
**`/api/cron/reminders`** (hourly) runs in the same TypeScript runtime as the app
(ADR-001), **imports the pure reminder deriver directly**, and holds the VAPID and
cron secrets as Vercel server env. Accounts/sync are already server-side, so the
job lives where the data and the deadline math already are. pg_cron would split
reminder logic into SQL/Edge and duplicate the calendar math, so we reject it. The
route is **guarded by a `CRON_SECRET`** header check and no-ops when the kill
switch is set or no subscriptions exist.

**Decision — a pure reminder core, the cron route is a thin caller:** a new
`src/lib/reminders/` module of pure functions —
`computeReminders(milestones, opts)` and `dueReminders(...)` — derives reminders
from the existing `computeMilestones` output (no re-derivation of dates), is
**fully unit-testable and idempotent**, and carries the re-fire diffing when
contract dates move. The cron route is pure IO shell over it: derive → filter due
→ send → record. Same discipline as `lib/deadlines.ts` / `lib/savings.ts` /
`lib/market/classify.ts`.

**Decision — two channels, in-app first:** (1) an **in-app banner** is a cockpit
read of the pure deriver — no key, no server job, ships first; (2) **background
Web Push** (the Web Push API + **VAPID** keys + a service worker holding a
`PushSubscription` per user) is the additive background channel, behind a
**`PUSH_ENABLED` flag (default-off)**. No third-party vendor, satisfying "no gate
this sprint." (If Web Push proves flaky, the same cron route is the email sender in
S2 — one mechanism, more channels.)

**Decision — new tables, RLS-scoped, idempotent firing:** two additive tables —
**`push_subscriptions`** (user_id, endpoint, keys, created_at) and
**`reminder_state`** (deal_id, milestone_id, fired_at, acknowledged_at,
last_seen_date) — both RLS-scoped via the existing **`is_deal_member`** helper
(ADR-012), membership columns indexed, `TO authenticated`. Reminder *preferences*
(opt-in, lead-time) persist per-tool via `useStageTool`/`useTracker` and sync to
the deal. Firing carries an **idempotency key on `(deal_id, milestone_id,
fired-at-bucket)`** so overlapping cron runs cannot double-fire; dates use the same
**UTC `YYYY-MM-DD`** frame as the deadline engine for tz correctness; a date-move
**re-fires** (the diff is in the pure core), and past-due milestones are
**suppressed from bursts** rather than firing a backlog at once.

**Decision — env + kill switch, default-off:** `VAPID_PUBLIC_KEY` (may be
`NEXT_PUBLIC_`), `VAPID_PRIVATE_KEY` (server-only), `CRON_SECRET` (server-only). A
new **`REMINDERS_DISABLED`** kill switch **mirrors `RENTCAST_DISABLED`**
(`src/lib/rentcast-flag.ts`): one truthy (`1|true|yes|on`) server env var checked
first, flippable without disturbing config (outage, cost, bad fire). Default-off ⇒
the in-app banner ships behind the opt-in and push stays dark until
`PUSH_ENABLED` + VAPID are set.

**Consequences:**
- The scheduler is the first always-on server job; its correctness rests on the
  pure core's idempotency and the `(deal_id, milestone_id, fired-at-bucket)` key,
  both unit-testable without the cron.
- One mechanism serves two (later three) channels: the in-app banner needs no
  infra, Web Push and the S2 email path both ride the same `/api/cron/reminders`
  route and the same deriver.
- Flipping `REMINDERS_DISABLED` cuts all firing at once; the cron also no-ops with
  no subscriptions, so an empty deployment costs nothing.
- **UPL guardrail:** reminders are *process* nudges ("schedule your inspection by
  the contingency date"), never directive; the buyer's **contract is the source of
  truth** and no reminder is a deadline "of record" — the copy says so.

### Backlog (future) — Email channel on the same scheduler (S2)
- Add an `EmailProvider` seam (Resend) and make `/api/cron/reminders` the
  reminder-email sender — one mechanism, an added channel — behind `EMAIL_DISABLED`.
- Keep `computeReminders` / `dueReminders` stable so in-app, push, and email all
  consume one deriver with no divergent policy.
