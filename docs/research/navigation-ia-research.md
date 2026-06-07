# Navigation & Information-Architecture Research — HomeOffer Direct

_Owner: Research · Status: draft for backlog grounding · Date: 2026-06-07_

## Why this exists

The top nav has grown to **10 primary links** (Dashboard, Search Homes, Journey,
Your State, Find Pros, Showings, Offer Builder, Tracker, Calculator, Glossary)
plus a deal switcher, "My Deal", auth/account, and a "Start free" CTA. Screen-to-
screen movement is complex because (a) the bar exceeds working-memory / scanning
limits, (b) two real destinations (`/offer-status`, `/deal`) aren't even in the
bar, and (c) the **journey** — the actual spine of the product — is just one link
among ten rather than the way you move between steps. With three more interactive-
tools epics (#64/#65/#66), a budget wizard (#51), an agent console (#62), and the
audience-routing path (#79–#82) all landing on top, the current flat bar will not
scale. This doc audits what exists, applies IA best practices, and proposes a
concrete, incrementally shippable simplification + backlog.

---

## STEP 1 — Audit: destinations, audiences, journey stage

Sources read: `src/components/site-header.tsx`, `src/components/site-footer.tsx`,
`src/components/{deal-switcher,deal-nav-link,auth-menu}.tsx`, every `src/app/**/page.tsx`,
`src/lib/journey/data.ts` (the canonical 14 stages), `docs/product/prd.md` (v2
personas), and epics #51/#62/#64/#65/#66/#79.

**Audience key:** UB = unrepresented buyer (homepage hero) · RB = represented
buyer · AG = agent. **Stage** maps to the 14-stage journey in `journey/data.ts`.

| # | Destination (route) | What it is | Audience | Journey stage(s) | Recommendation |
|---|---|---|---|---|---|
| 1 | `/` | Landing / value prop + audience routing (#79–#82) | UB·RB·AG (entry) | Pre-journey | **Logo / entry** (not a nav item) |
| 2 | `/listings` "Search Homes" | Listing search (mock provider) | UB·RB | Stage 3 Search | **Primary** (top-level) |
| 3 | `/journey` + `/journey/[stage]` + `/journey/[stage]/[step]` | The 14-stage roadmap, stage & step pages, checklists | UB·RB (AG views client) | All 14 | **Primary — the spine** |
| 4 | `/dashboard` | Multi-home rollup: progress, showing/offer status, next deadline, next action | UB·RB | Cross-stage (workspace) | **Primary — "My Deal" home** |
| 5 | `/deal` | Manage collaborators, roles, agency relationship, consent (`isDealsEnabled` gated) | RB·AG (+UB co-buyer) | Cross-stage | Group → **My Deal** |
| 6 | `/account` | Auth / cloud sync across devices (`enabled` gated) | UB·RB·AG | Cross-stage | Group → **My Deal** (account submenu) |
| 7 | `/tools/savings-calculator` "Calculator" | Commission-savings + cash-to-close estimator | UB·RB | Stage 1, 5 | Group → **Tools** + in-journey |
| 8 | `/tools/offer-builder` "Offer Builder" | Offer term-sheet / contingencies / deadlines builder | UB·RB | Stage 5–6 | Group → **Tools** + in-journey |
| 9 | `/tracker` | Contingency-deadline + document tracker | UB·RB | Stage 6–13 | Group → **Tools** + in-journey |
| 10 | `/offer-status` | Offer pipeline (draft→accepted) + expiration tracker — **not in nav today** | UB·RB | Stage 5–6 | Group → **Tools** + in-journey |
| 11 | `/showings` | Showings tracker + Fair-Housing message templates + agency explainer | UB·RB | Stage 4 Tour | Group → **Tools** + in-journey (Stage 4) |
| 12 | `/pros` | Directory: attorneys / inspectors / title (filter by state+role) | UB·RB | Stage 6, 8, 10, 13 | **Secondary** (resource) + in-journey |
| 13 | `/states` + `/states/[code]` | State guide: closing path, disclosures, transfer tax (50+DC) | UB·RB·AG | Stage 3, 10 + global | **Secondary** (resource) + in-journey |
| 14 | `/glossary` | Searchable definitions, linked from steps | UB·RB | All (reference) | **Secondary** (footer/utility) |

### Chrome elements (not pages)
- **`DealSwitcher`** — active-deal `<select>`; renders only when cloud + signed-in
  + ≥1 deal. Belongs **inside the "My Deal" surface**, not loose in the bar.
- **`DealNavLink` "My Deal"** — link to `/deal`; gated on deals + signed-in.
- **`AuthMenu` "Account/Sign in"** — link to `/account`; gated on cloud enabled.
- **"Start free"** — primary CTA, currently → `/journey`. Keep as the single
  persistent CTA; for known-audience users it should deep-link (UB → journey, AG →
  agent console once #62 ships).

### What's coming (must scale to)
- **#64 Pre-offer tools (Stages 1–4):** credit/savings tracker, lender comparison,
  pre-approval tracker, saved searches, compare-homes, comps worksheet, tour
  scorecard. → these are **per-stage**, so they belong *in the journey*, not the top bar.
- **#65 Under-contract tools (Stages 5–10):** counter-offer tracker, attorney-review,
  wire-fraud/escrow tracker, inspection logger, repair-request builder, CTC tracker,
  title checklist. → **per-stage**.
- **#66 Closing & post-purchase tools (Stages 11–14):** CD-vs-LE comparison,
  walkthrough checklist, closing-day checklist, move-in tracker. → **per-stage**.
- **#51 Budget wizard:** interactive PITI / affordability, lives in **Stage 1**.
- **#62 Agent console:** pipeline across many deals, plus a **"For agents" entry
  point** (E3, buildable now) — a distinct audience surface.
- **#79–#82 "Do you have an agent?" path:** homepage routes UB vs RB and persists
  the choice — the hook the nav should read to tailor surfaces.

**The pattern is unmistakable:** almost every new tool is **stage-scoped**. If
each new tool also earns a top-nav slot we go from 10 to ~25 links. The IA must
move tools *into the journey* and reserve the top bar for a few stable anchors.

---

## STEP 2 — IA best practices applied

- **Primary-nav item limit (~5–9).** Miller's 7±2 is the common ceiling, but the
  sharper point: a visible menu is *recognition, not recall*, so the real goal is
  **scannability and chunking**, not a magic number. Ten flat, equally-weighted
  links read as a wall. Target **4–5 primary anchors + grouped children**.
  ([Laws of UX — Miller's Law](https://lawsofux.com/millers-law/),
  [Stéphanie Walter — your menu doesn't need 7±2](https://stephaniewalter.design/blog/your-menu-doesnt-need-millers-7-plus-minus-rule/))
- **Progressive disclosure.** Defer infrequent items (glossary, state guide,
  account admin) to a second layer; keep frequent items up front. Stay within
  **two levels of disclosure** — deeper nesting tanks usability.
  ([NN/g — Progressive Disclosure](https://www.nngroup.com/videos/progressive-disclosure/))
- **Task- vs feature-based nav.** Organize around *what the user is trying to do*
  (move through my purchase, work my deal, use a tool) rather than a flat list of
  features. Task structures also survive product growth better — exactly our
  problem as tools multiply.
  ([Think Design — task-based navigation](https://medium.com/@marketingtd64/what-is-task-based-navigation-and-when-should-you-use-it-e73bd7f2eed6),
  [NN/g — Intranet IA](https://www.nngroup.com/articles/intranet-information-architecture-ia/))
- **Grouped dropdown vs mega-menu.** We have ~18 destinations across a few clear
  groups — past the point where a flat bar works, but **not** a 50+ page catalog.
  A **grouped dropdown ("Tools", "My Deal")** is the right weight; a full mega-menu
  is overkill now (revisit if Tools grows past ~8). Grouping aids recognition over
  recall and shows relationships.
  ([NN/g — Mega Menus Work Well](https://www.nngroup.com/articles/mega-menus-work-well/),
  [Slickplan — dropdown use cases](https://slickplan.com/blog/dropdown-menus-best-use-cases))
- **Journey/wizard-centric nav.** A stepper that always answers *where am I / what's
  next* lowers anxiety and is the natural backbone for a multi-month, sequential
  process. Make the **journey the primary movement model**, with tools reachable
  in-context at the relevant stage.
  ([Eleken — Wizard UI](https://www.eleken.co/blog-posts/wizard-ui-pattern-explained),
  [PatternFly — Wizard guidelines](https://www.patternfly.org/components/wizard/design-guidelines/))
- **Contextual navigation reduces clicks/effort.** Put the right tool *where the
  task is* (e.g. comps worksheet on Stage 3, wire-fraud checklist on Stage 7)
  instead of forcing a detour to the top bar. Contextual links **add to**, never
  replace, the primary nav. Optimize for **effort, not raw click count**.
  ([wearediagram — user context](https://www.wearediagram.com/blog/using-user-context-to-improve-site-navigation),
  [DCKAP — reduce effort not clicks](https://www.dckap.com/blog/reduce-effort-not-clicks-for-a-better-ux/))
- **Mobile pattern.** With 3–5 primary destinations, both Apple HIG and Material
  recommend a **bottom tab bar** over a hamburger for primary nav (feature
  discovery +30%+ in case studies, thumb-reach ergonomics, supports badges for
  "next deadline"). Use a **hybrid**: bottom tabs for the 4–5 anchors + a sheet/
  "More" for secondary items.
  ([NN/g — Mobile nav patterns](https://www.nngroup.com/articles/mobile-navigation-patterns/),
  [Acclaim — hamburger vs tab bars](https://acclaim.agency/blog/the-future-of-mobile-navigation-hamburger-menus-vs-tab-bars))
- **Role/persona-aware nav.** Different audiences have different objectives; show
  each only what serves their goal. Reuse the persisted #79–#82 audience choice to
  pick the buyer vs agent surface — a low-friction, high-impact structural change.
  ([Pencil & Paper — SaaS nav](https://www.pencilandpaper.io/articles/ux-pattern-analysis-navigation))

---

## STEP 3 — Proposed simplified IA

### Proposed primary nav (buyer surface) — 5 anchors

```
[ HomeOffer Direct ]   Journey   Search Homes   Tools ▾   My Deal ▾        [ Start free ]
                          │           │            │          │
                       the spine   listings    grouped     account/deal/
                                               dropdown    collaboration
```

1. **Journey** — `/journey`. The spine. Primary way to move between the 14 stages
   and (post-#64/65/66) to reach every per-stage tool in context.
2. **Search Homes** — `/listings`. Kept top-level: it's a frequent, distinct entry
   activity that isn't naturally "inside" one journey stage.
3. **Tools ▾** (grouped dropdown) — the calculators/trackers, also linked in-journey:
   - Savings Calculator (`/tools/savings-calculator`)
   - Budget Wizard (`/tools/budget` — #51, when built)
   - Offer Builder (`/tools/offer-builder`)
   - Offer Status (`/offer-status`) ← *surfaces a destination missing from nav today*
   - Deadline & Document Tracker (`/tracker`)
   - Showings Tracker (`/showings`)
4. **My Deal ▾** (grouped dropdown — the workspace) — gated/adaptive:
   - Dashboard (`/dashboard`) — multi-home rollup, the default landing for return users
   - Manage Deal & Collaborators (`/deal`) — when `isDealsEnabled` + signed-in
   - Active-deal switcher (the `DealSwitcher`, hosted here, not loose in the bar)
   - Account / Sign in (`/account`) — when cloud enabled
5. **Start free** — single persistent CTA; deep-links by known audience.

**Secondary / resource layer** (footer + contextual, not primary): **Glossary**,
**Your State** guide, **Find Pros**. Each is also linked *in-context* from the
relevant journey step (pros on Stages 6/8/10/13; state on Stages 3/10; glossary
inline via `terms`). They are reference/resource surfaces, not daily destinations,
so they leave the top bar but stay one click away where they're actually needed.

This takes the bar from **10 flat links → 5 anchors (2 of them grouped)**, absorbs
the two orphan routes (`/offer-status`, `/deal`), and gives every future per-stage
tool a home (the journey) without touching the bar.

### Grouping decisions (rationale)
- **Tools** groups the *cross-cutting, reusable* worksheets a user returns to
  directly (calculator, tracker, offer status). Per-stage tools from #64/65/66 do
  **not** all go here — they live in the journey and only the few "anytime"
  utilities are promoted into Tools.
- **My Deal** groups *workspace + identity + collaboration* (dashboard, deal mgmt,
  switcher, account). This is the natural home for the collaboration platform (v2)
  and for the agent's per-deal context.
- **Journey stays a single top-level item, not a dropdown** — you go *into* it and
  navigate by stepper, which is the whole point (wizard-centric).

### Journey becomes the movement model
- Each **stage page** lists its steps with a stepper showing position + a "Next
  step" affordance (wayfinding: where am I / what's next).
- Each **step page** surfaces its **stage-relevant tools inline** ("Tools for this
  step"): e.g. Stage 1 → Budget Wizard + Savings Calculator; Stage 3 → comps
  worksheet + saved searches; Stage 4 → Showings; Stage 5 → Offer Builder + Offer
  Status; Stage 6–13 → Tracker; Stage 7/13 → wire-fraud checklist; Stage 11 →
  CD-vs-LE. This is the contextual-nav win — the tool is where the task is, no top-
  bar detour. New tools from #64/65/66/51 attach here via a small per-stage
  `tools` map keyed on stage slug.

### Audience-aware nav
- Read the persisted audience from **#79–#82**:
  - **UB / RB (buyer surface):** the 5-anchor bar above. RB additionally sees
    "Manage Deal" prominence (invite your agent).
  - **AG (agent surface):** replace **Journey** anchor with **Console**
    (`/agent` pipeline, #62 E1/E2); **My Deal** becomes per-selected-client; keep
    Tools. Reached via the **"For agents" entry point** (#62 E3, buildable now).
- Default (unknown audience / signed-out) = buyer surface. Self-serve buyer stays
  the hero per PRD v2.

### Mobile
- **Bottom tab bar** with 4 anchors: **Journey · Search · Tools · My Deal**
  (drop "Start free" into the Journey tab for new users; show it as the empty-state
  CTA). The **My Deal / next-deadline** tab can carry a **badge** for the nearest
  deadline (reuse `lib/deadlines.ts`).
- Secondary items (Glossary, State, Pros) live in a **"More" sheet** or under Tools
  — hybrid pattern, not a catch-all hamburger.

### Wayfinding affordance ("what's next")
- A small persistent **"You're on Stage X of 14 — Next: <step>"** context strip on
  journey/step pages and on the Dashboard, linking straight to the next action.
  Reuses journey progress (already persisted) + `homes/rollup.ts` "next action".
  This is the single biggest cut to screen-to-screen friction.

### Reuse vs new (implementation notes)
- **Reuse:** `site-header.tsx` (restructure `navLinks` into anchors+groups),
  `site-footer.tsx` (already the right home for secondary links — expand it),
  `DealSwitcher`/`DealNavLink`/`AuthMenu` (move under "My Deal", unchanged logic),
  `usePathname` active-state, journey progress + `homes/rollup.ts` for wayfinding.
- **New (small):** a `NavGroup` dropdown component (desktop) + accessible disclosure;
  a `MobileTabBar`; a per-stage `stageTools` map + a `StageToolLinks` block on
  step pages; a `WhatsNext` context strip; an `useAudience` reader over the
  persisted #79–#82 choice.
- **Dependencies:** audience-aware surface depends on **#79–#82** (persisted
  choice) and the agent surface on **#62**; everything else (regroup, Tools menu,
  in-journey links, mobile tabs, wayfinding) is **buildable now**.

---

## STEP 4 — Proposed backlog

### Epic: Navigation & IA simplification
> Collapse the 10-item flat top nav into ~5 task-based anchors (Journey · Search ·
> Tools · My Deal · Start free), make the journey the primary movement model with
> tools reachable in-context, add audience-aware buyer/agent surfaces, a mobile tab
> bar, and a "what's next" wayfinding strip — so the IA scales to the per-stage
> tools (#64/65/66), budget wizard (#51), and agent console (#62).
> _Source: this doc; `docs/product/prd.md` v2._
> Guardrails: keep brand/visual design (not a redesign); self-serve buyer stays
> the hero; gated chrome (deal switcher/account) keeps its current render
> conditions so local-only / signed-out is unchanged.

Priority order: **N1 → N2 → N3 → N5 → N4 → N6 → N7**. N1–N5 are buildable now.

#### N1 — Regroup the primary nav into 5 anchors · P1 · **[now]**
- Top bar shows exactly: Journey, Search Homes, **Tools ▾**, **My Deal ▾**, Start free;
  Glossary / Your State / Find Pros move out of the primary bar.
- `/offer-status` and `/deal` are now reachable from the bar (no orphan routes).
- Active-state highlighting still works for a route nested under a group (e.g. on
  `/tracker` the "Tools" anchor reads active).
- No regression to gated chrome: deal switcher / "My Deal" / account still render
  only under their existing conditions.

#### N2 — Grouped "Tools" + "My Deal" dropdown menus · P1 · **[now]**
- "Tools ▾" lists Savings Calculator, Offer Builder, Offer Status, Tracker,
  Showings (+ Budget Wizard slot once #51 ships); "My Deal ▾" lists Dashboard,
  Manage Deal, account, and hosts the `DealSwitcher`.
- Dropdowns are keyboard-accessible (open/close, arrow/esc, focus-visible) and have
  correct `aria-expanded`/`aria-controls`; one level of disclosure only.
- Menu items show active state for the current route.

#### N3 — In-journey contextual tool links · P1 · **[now]**
- Each step page renders a "Tools for this step" block driven by a `stageTools`
  map keyed on stage slug (e.g. Stage 5 → Offer Builder + Offer Status).
- The map is the single extension point future tools (#64/65/66/51) plug into —
  adding a tool requires no top-nav change.
- Block is omitted cleanly for stages with no mapped tools.

#### N4 — "What's next" wayfinding strip · P2 · **[now]**
- Journey/step pages and Dashboard show "Stage X of 14 — Next: <step/action>"
  linking to the next action, sourced from persisted progress + `homes/rollup.ts`.
- New-user (no progress) state shows a sensible default ("Start: Get Ready").
- Strip is dismissible/non-blocking and does not shift primary content layout.

#### N5 — Mobile bottom tab bar (hybrid) · P1 · **[now]**
- On small screens, a bottom tab bar shows Journey · Search · Tools · My Deal with
  thumb-reach targets; the current hamburger is replaced (or demoted to "More").
- Secondary items (Glossary, State, Pros) live in a "More" sheet / under Tools.
- The "My Deal" (or a deadline) tab can show a badge for the nearest deadline;
  active tab reflects the current route.

#### N6 — Audience-aware nav surface · P2 · **[dependent: #79–#82]**
- A `useAudience` reader returns the persisted choice from the "Do you have an
  agent?" path; nav renders the buyer surface by default.
- RB users see "Manage Deal / invite your agent" given higher prominence;
  unknown/signed-out = buyer surface (hero preserved).
- No new guardrail regressions; choice can be changed and nav updates.

#### N7 — Agent console nav surface + "For agents" entry · P3 · **[dependent: #62]**
- For audience = agent, the Journey anchor is replaced by **Console** (`/agent`)
  and "My Deal" scopes to the selected client; Tools remain.
- A "For agents" entry point (reuse #62 E3) links into the agent surface without
  diluting the buyer homepage hero.
- Agents only see deals they're a member of (defer to #62 RLS).

### Candidate GitHub issues (titles for the PM)
1. **[Epic] Navigation & IA simplification**
2. N1 — Regroup primary nav into 5 task-based anchors — P1 · now
3. N2 — Grouped "Tools" & "My Deal" dropdown menus (a11y) — P1 · now
4. N3 — In-journey contextual "Tools for this step" links — P1 · now
5. N5 — Mobile bottom tab bar (hybrid with "More") — P1 · now
6. N4 — "What's next" wayfinding strip — P2 · now
7. N6 — Audience-aware nav (buyer vs agent) — P2 · depends #79–#82
8. N7 — Agent console nav surface + "For agents" entry — P3 · depends #62

---

## Sources
- [Laws of UX — Miller's Law](https://lawsofux.com/millers-law/)
- [Stéphanie Walter — your menu doesn't need the 7±2 rule](https://stephaniewalter.design/blog/your-menu-doesnt-need-millers-7-plus-minus-rule/)
- [NN/g — Progressive Disclosure](https://www.nngroup.com/videos/progressive-disclosure/)
- [Think Design — what is task-based navigation](https://medium.com/@marketingtd64/what-is-task-based-navigation-and-when-should-you-use-it-e73bd7f2eed6)
- [NN/g — Intranet Information Architecture](https://www.nngroup.com/articles/intranet-information-architecture-ia/)
- [NN/g — Mega Menus Work Well for Site Navigation](https://www.nngroup.com/articles/mega-menus-work-well/)
- [Slickplan — Dropdown menus best use cases](https://slickplan.com/blog/dropdown-menus-best-use-cases)
- [Eleken — Wizard UI pattern](https://www.eleken.co/blog-posts/wizard-ui-pattern-explained)
- [PatternFly — Wizard design guidelines](https://www.patternfly.org/components/wizard/design-guidelines/)
- [We Are Diagram — using user context to improve navigation](https://www.wearediagram.com/blog/using-user-context-to-improve-site-navigation)
- [DCKAP — reduce effort, not clicks](https://www.dckap.com/blog/reduce-effort-not-clicks-for-a-better-ux/)
- [NN/g — Basic Patterns for Mobile Navigation](https://www.nngroup.com/articles/mobile-navigation-patterns/)
- [Acclaim — hamburger menus vs tab bars](https://acclaim.agency/blog/the-future-of-mobile-navigation-hamburger-menus-vs-tab-bars)
- [Pencil & Paper — Navigation UX best practices for SaaS](https://www.pencilandpaper.io/articles/ux-pattern-analysis-navigation)
</content>
</invoke>
