_Contributor: Product Designer (UX) · Journey navigation/completion/resume review · 2026-06-16_

# Journey navigation, step-completion, and session resume — UX review

## TL;DR

Most of the plumbing the founder is asking for already exists; the gap is **consistency and a few missing links**, not net-new systems.

- Journey **step pages already have prev/next** (`stepNeighbors` crosses stage boundaries) and an in-context "Tools for this step" block — but they show **no "where am I" progress** and **don't reflect step completion**.
- The **journey overview already shows ✓ on completed stages** (`JourneyOverview`), and `nextStep`/`WhatsNext` already compute the first-incomplete step — but **step pages and the tools index don't show any completion state**, and the rule is task-checkbox-only (it ignores whether a tool actually has data).
- **Tools dead-end.** `ToolPageHeader` gives a "← All tools" back-link to the catalog, but **no tool links back to the journey or forward to the next step**. The tour scorecard is the poster child: you score homes and then hit a wall. This is the single highest-leverage fix and is shared with the parallel Tour Scorecard review.
- **There is no persisted "last position."** `WhatsNext` and the cockpit compute a *derived* next action, but nothing remembers the *actual* last place the user was. "Resume where you left off" needs one small new store — which **auto-syncs to signed-in users for free** because the cloud-sync layer already enumerates every `hod:tool:*` key.

The recommendation below is mostly **reuse + one shared footer component + one tiny store**, with honest (non-premature) completion semantics.

Stack facts this design leans on:
- 14 stages / 22 steps, linear order. `flattenedSteps()` is the canonical order; `stepNeighbors()` already crosses stage boundaries.
- `useProgress` → `hod:progress:v1` (per-task checkboxes). `isStepComplete()` = all **non-optional** tasks ticked.
- `useStageTool(toolId)` → `hod:tool:<toolId>:v1`. Tool ids in use: `tour-scorecard, budget, comps, counter-offer, inspection, market, pre-offer-diligence, savings, financing, repair-request, clear-to-close` (plus more as tools ship).
- Cloud-sync (`readLocal`/`writeLocal` + `emitLocalChange`) snapshots `progress` and **every** `hod:tool:*` blob into `stageTools`, merges on sign-in, debounce-pushes to Supabase. **Any new `useStageTool` key rides this for free.**
- `STAGE_TOOLS` maps stage slug → tools (the order-resolution source of truth for "which step does this tool belong to").

---

## Part 1 — Consistent inter-step navigation

### The problem
Two different surfaces, two different levels of polish:
- **Step pages**: have prev/next + breadcrumb, but no progress indicator and no per-step completion signal. A user reading a step can't tell "am I 2 of 22, and is this one done?"
- **Tool pages**: a back-link to `/tools` only. No "back to your journey," no "next step." A tool like the **tour scorecard** is a terminus — the user finishes scoring and the journey thread is dropped.

### Recommended design

**A. New shared `ToolJourneyFooter` (the keystone).** One component, rendered by `ToolPageHeader` at the bottom of every tool page (so every tool gets it with zero per-tool edits — same pattern that made the back-link universal). It renders:

- **← Back to your journey** → resolves to the stage step that owns this tool.
- **Next: \<step title\> →** → the next step after the owning step, in `flattenedSteps()` order.

**Order-resolution rule** (pure, unit-testable, lives next to `STAGE_TOOLS` in `lib/journey/navigation.ts`):
1. The footer is keyed by the tool's `href` (e.g. `/tools/tour-scorecard`).
2. Find the **first stage** (in journey order) whose `STAGE_TOOLS` list contains that href — call it the *owning stage*. This mirrors the existing `toolsByStage()` dedupe ("show a tool under its first/most-relevant stage"), so a multi-stage tool resolves deterministically.
3. "Back to your journey" → the owning stage's **first step** page (`/journey/<stage>/<firstStep.slug>`); label includes the stage title.
4. "Next" → the **step after the owning stage's last step** in `flattenedSteps()`. If the owning stage is the final stage, "Next" becomes "Back to journey ✓".
5. If a tool isn't in any `STAGE_TOOLS` list, the footer degrades to a single "← Back to your journey" pointing at `/journey` (no dead-end, ever).

New helper: `journeyAnchorForTool(href): { backHref, backLabel, nextHref, nextLabel } | null`.

**B. Step pages gain a "where am I" progress header + completion chip.** A small new client component `StepProgressHeader` (because progress is in localStorage and the step page is currently a server component — wrap just this strip as a client island):
- "Step **N of 22** · Stage **X of 14**" derived from `flattenedSteps()` index.
- A status chip reflecting Part 2: **Not started / In progress / ✓ Complete**.
- A thin overall progress bar (reuse the bar markup already in `JourneyOverview`).

The existing prev/next footer on the step page **stays** — it already does the right thing. We only add the header strip.

### Flow
Scorecard → user finishes scoring → footer shows "← Back to Tour & Evaluate" + "Next: Draft the offer →" → one tap returns them to the journey thread. No terminus.

### Screen states
- **Tool footer**: default (back + next), final-stage (back + "Back to journey ✓"), unmapped tool (back-only).
- **Step header**: not-started / in-progress / complete chip; first step has no "prev"; last step's "next" becomes "Back to journey ✓" (already handled).

### IA placement
- Tool footer: bottom of every `/tools/*` page, inside `ToolPageHeader`'s shell, below the tool body and disclaimer.
- Step progress header: top of the `<article>` on the step page, under the breadcrumb, above the H1.

### Accessibility
- Footer is a `<nav aria-label="Journey navigation">`; prev/back is the first link, next is the visually-prominent one.
- **Focus management**: client-side route changes in Next App Router don't move focus by default — this is existing a11y debt visible on every prev/next today. Add a shared pattern: on step-page mount, move focus to the H1 (`tabIndex={-1}`, focus on mount) so keyboard/SR users land on the new step title rather than the top of `<body>`. Apply the same to the tool footer's "Next" target.
- **SR announcement**: the progress strip uses `aria-live="polite"` for the "Step N of 22 — \<status\>" text so screen-reader users hear where they are and whether the step is complete when it changes.
- **≥44px**: footer links must hit the 44px target. The cockpit already standardizes `min-h-[44px]`; reuse it. (Note: the step page's current `btn-primary`/`btn-secondary` prev-next links should be audited for 44px too — likely fine but verify.)
- Chips convey status with **icon + text**, never color alone (matches the cockpit's existing urgency-chip rule).

### Mobile
- Footer stacks vertically on small screens (back above next), full-width tap targets, sits above the fixed bottom tab bar — add `pb` so the footer isn't occluded by the tab bar's `env(safe-area-inset-bottom)`.
- The bottom tab bar's "Journey" tab is the persistent global escape hatch and already has `aria-current` — no change.

### Reuse vs. new
- **New**: `ToolJourneyFooter` component, `StepProgressHeader` client island, `journeyAnchorForTool()` helper.
- **Reuse**: `ToolPageHeader` (host the footer there), `flattenedSteps`/`stepNeighbors`/`STAGE_TOOLS`, progress-bar markup, cockpit's 44px/chip patterns.

### Size: **M**
(footer + helper is S; step progress header + the focus-management pattern across step/tool routes pushes it to M).

### Overlap with the Tour Scorecard review
The scorecard's missing "next step" link **is an instance of this** — it should be delivered by `ToolJourneyFooter`, not hand-rolled inside the scorecard. Coordinate so we don't ship two competing footers. The scorecard owning-stage resolves to `tour-and-evaluate`; "Next" → `make-an-offer / draft-the-offer`.

---

## Part 2 — Step-completion marking from entered data

### The problem
Today, completion is **100% manual checkboxes** (`StepChecklist` → `useProgress`). A user can pour an hour into the tour scorecard and the journey still says 0% for that step, because they never ticked the checklist. Conversely we must **not** auto-mark "complete" just because a tool was opened — that would be dishonest and could imply a deal step is "done" when it isn't (a UPL-adjacent overclaim).

### Recommended design — a three-state model, derived, honest

Define a derived `StepStatus = "not-started" | "in-progress" | "complete"` (pure function in `lib/journey/navigation.ts`, alongside `isStepComplete`):

- **complete** — keep the existing honest rule: **all non-optional tasks ticked** (`isStepComplete`). Tools never flip a step to complete. This is the only state that shows a hard ✓.
- **in-progress** — *either* (a) at least one task ticked but not all required, *or* (b) **a tool that maps to this step (via `STAGE_TOOLS`) has saved non-empty data**. This is the new signal: entering information into a tool earns "in-progress," not "complete."
- **not-started** — none of the above.

**"Non-empty tool data" rule** (kept deliberately conservative so opening a tool ≠ progress): a tool counts as "has data" when its `useStageTool` blob differs meaningfully from its `INITIAL` — e.g. scorecard `homes.length > 0`, budget has a non-zero input, inspection has ≥1 finding. Because each tool's shape differs, expose a tiny per-tool `hasData(value): boolean` predicate registered next to its `toolId` (a `TOOL_DATA_PREDICATES` map). Default fallback: deep-not-equal to `INITIAL`. This keeps the "honest" bar high and avoids a shallow "any key present" false-positive.

This is **distinct from the manual checkboxes**: checkboxes still drive *complete*; tool-data only ever drives *in-progress*. The two never conflict because complete strictly dominates.

### How completion is shown (consistent across three surfaces)
- **Journey overview** (`JourneyOverview`): already shows ✓ on complete stages — extend to a per-stage **tri-state pip** (empty / half / ✓) and, optionally, a small "in progress" label so a partially-worked stage reads differently from an untouched one.
- **Step pages**: the new `StepProgressHeader` chip (Part 1B): "Not started" / "In progress" / "✓ Complete."
- **Tools index** (`/tools`, grouped by stage via `toolsByStage`): a per-tool dot — ✓ when that tool has saved data — so a returning user sees which tools they've already populated. (Tool-level "has data," not step-level "complete.")

### Flow
User adds two homes to the scorecard → scorecard's `hasData` true → the `tour-and-evaluate` step shows **In progress** on the overview and step header, and the scorecard shows a "saved data" dot on `/tools` — **without** falsely claiming the step is done. Ticking the step's required checklist tasks is still what flips it to ✓ Complete.

### Screen states
not-started · in-progress (from tasks) · in-progress (from tool data) · complete. All four render the same chip vocabulary; the *source* of in-progress is invisible to the user (intentional — they just see "you've started this").

### IA placement
Status chips live where the user already looks for orientation: overview rows, step header, tools index rows.

### Accessibility
- Status is **text + icon** ("In progress" label beside a half-filled pip; "✓ Complete" beside a checkmark) — never the color of the pip alone.
- The step header chip is inside the `aria-live` strip from Part 1 so a state change is announced.
- Pips on the overview need an accessible name per row, e.g. `aria-label="Stage 4: Tour & Evaluate — in progress"`.

### Mobile
- The overview's right-side "done/total" column is already `hidden sm:block`; the tri-state pip must live in the **always-visible** left avatar so mobile users still get status. Reuse the existing 12×12 avatar slot.

### Reuse vs. new
- **New**: `stepStatus()` selector, `TOOL_DATA_PREDICATES` + default deep-compare, per-tool `hasData`, tri-state pip styling.
- **Reuse**: `isStepComplete`, `useProgress`, `useStageTool`, `journeyProgress`, `STAGE_TOOLS`, the existing ✓ avatar.

### UPL/FHA note
- Keep status copy as **process state**, never outcome/advice — "In progress" / "Complete" describe *the user's activity in the app*, not the deal. Do **not** word it as "Step done — you're cleared to…". The existing cockpit "contract governs" discipline is the right register.
- The scorecard already screens free-text notes for protected-class content (FHA). The completion signal reads only structural facts (counts/non-empty), so it introduces **no new FHA surface** — keep it that way (don't derive status from note *content*).

### Size: **M**
(`stepStatus` + overview/header/tools-index wiring is M; the per-tool `hasData` predicates are a handful of trivial S additions, one per tool).

---

## Part 3 — Continue where you left off

### The problem
`WhatsNext` and the cockpit compute a **derived** next action ("first incomplete step" / "nearest deadline"). That's good for "what *should* I do," but it's **not** "where *was* I." If a user was mid-way through the inspection logger and closes the tab, nothing returns them there — the app re-derives a possibly different "next" step. There is no persisted last position.

### Recommended design — a tiny last-position store, reusing the sync rails

**What gets stored.** A single new `useStageTool` blob, `toolId: "__last-position"` → key `hod:tool:__last-position:v1`. Chosen deliberately: **it auto-syncs to signed-in users across devices for free**, because `readStageTools()` already enumerates every `hod:tool:*` key into `stageTools`. No edits to `local-store.ts`, `merge.ts`, or `SyncData` shape.

Shape:
```
{ kind: "step" | "tool", href: string, label: string, stageOrder?: number,
  totalSteps?: number, updatedAt: number }
```
- Written on visiting any journey **step** page and any **tool** page (one `useEffect` in `StepProgressHeader` and in `ToolJourneyFooter`, both of which already render on those pages — so no new mount points).
- `label` is human copy for the resume button ("Resume: Inspection findings →").
- `updatedAt` lets merge-on-sign-in prefer the most recent position (last-write-wins, matching how the rest of sync resolves).

**Resume target precedence** (when both exist):
1. If a **persisted last position** exists and its target step is **not yet complete**, resume there (honor where they actually were).
2. If the last position's step **is** complete (they finished it), fall through to the **cockpit/`nextStep` computed next action** — resuming into a finished step is a dead feeling; advancing them is better.
3. No last position yet → computed next action (`nextStep` for journey-first users, cockpit for deal-active users) — i.e. today's behavior.

This makes "Resume" *explicit-memory-first, computed-fallback* — the explicit position wins unless it's stale (already done).

### Where it appears (IA)
- **Landing page (`/app/page.tsx`)**: a **"Resume where you left off → \<label\>"** card in the hero region for returning users (only renders client-side once the store hydrates and a position exists; otherwise the existing "Start the journey" CTA stands). Replaces nothing — it's additive above the value props.
- **Dashboard (`/dashboard`)**: surface the resume affordance **above** the `CockpitBand` (or as the cockpit's empty-state primary CTA, which today says "Pick up where you are" but links to `/journey` generically — wire it to the real last position).
- **Global affordance**: a compact "Resume" pill. Cleanest home is the `WhatsNext` strip — rename/extend it so when a persisted position exists it leads with **"Resume: \<label\>"** and falls back to its current "What's next" computed copy otherwise. (Avoids adding a competing strip.) On mobile, the bottom-tab "Journey" already returns you to the roadmap; the resume pill on the journey/landing pages covers "exact spot."

### Flow
Returning user lands on `/` → "Resume: Score your tours →" (their last position) → one tap back into the scorecard, focus moved to its heading. Signed in on a new device → after sign-in merge, the same resume target appears because `__last-position` synced.

### Screen states
- **No history** (first run): no resume card; show Start CTA. (Don't show an empty "Resume" — it's confusing.)
- **Has history, target incomplete**: "Resume: \<label\>."
- **Has history, target complete**: "Resume" silently advances to computed next (precedence rule 2).
- **Journey fully complete**: resume hides; `WhatsNext`'s existing 🎉 state shows.

### Accessibility
- Resume card is a single prominent link with a descriptive accessible name ("Resume where you left off: Inspection findings logger").
- On activation, apply the Part 1 focus-move pattern so the user lands on the destination's heading.
- ≥44px pill; icon + text.
- Hydration-guarded render (matches `WhatsNext`/cockpit `hydrated` gating) to avoid SSR flash and a wrong-then-right resume label.

### Mobile
- Resume card full-width on landing/dashboard; the global pill lives in the existing `WhatsNext` strip which already wraps. No new fixed UI (the bottom tab bar is full — don't add a 6th tab).

### Reuse vs. new
- **New**: `useLastPosition()` thin wrapper over `useStageTool("__last-position")`, a `resumeTarget(progress, lastPosition)` precedence helper, a `ResumeCard` component, two `useEffect` write-points.
- **Reuse**: the **entire** sync stack unchanged, `nextStep`, cockpit empty-state, `WhatsNext` shell, hydration-gating pattern.

### UPL/FHA note
- Resume copy is pure wayfinding ("where you left off") — no advice, no FHA surface. The stored `label` is a step/tool title we control; never store user free-text in the position blob.

### Size: **S–M**
(store + precedence helper + resume card is S; threading it into landing, dashboard, and the `WhatsNext` strip pushes to low-M. Zero sync work is what keeps it small.)

---

## What changes (consolidated)

| # | Change | New / Reuse | Size |
|---|--------|-------------|------|
| 1a | `ToolJourneyFooter` rendered by `ToolPageHeader` on every `/tools/*` page (back-to-journey + next-step) | New component | S |
| 1b | `journeyAnchorForTool(href)` order-resolution helper (owning stage = first `STAGE_TOOLS` match; next = step after owning stage) | New helper in `navigation.ts` | S |
| 1c | `StepProgressHeader` client island on step pages: "Step N of 22 · Stage X of 14" + status chip + thin bar | New (reuses bar markup) | S |
| 1d | Focus-move-to-heading pattern on step + tool route changes (fixes existing App-Router focus debt) | New shared pattern | S |
| 2a | `stepStatus()` tri-state selector (complete = all required tasks; in-progress = some tasks **or** mapped tool has data) | New selector | S |
| 2b | `TOOL_DATA_PREDICATES` / per-tool `hasData(value)` (default deep-≠-INITIAL); honest, opening ≠ progress | New, one trivial fn per tool | S–M |
| 2c | Show tri-state on journey overview (always-visible avatar pip), step header chip, and `/tools` index per-tool "saved" dot | Reuse/extend existing surfaces | M |
| 3a | `__last-position` store via `useStageTool` (auto-syncs through existing `stageTools`); written on step/tool visit | New store, **zero sync edits** | S |
| 3b | `resumeTarget()` precedence: explicit position (if incomplete) → else computed `nextStep`/cockpit | New helper | S |
| 3c | `ResumeCard` on landing + dashboard; "Resume:" lead in the `WhatsNext` strip; wire cockpit empty-state CTA to real position | New card + reuse | M |

**Rough total: M (one focused sprint).** The expensive-sounding parts (cross-device resume, completion-from-data) are cheap here because cloud-sync auto-captures any `hod:tool:*` key and the journey order/selectors already exist. The bulk of the value is the **shared tool footer** (kills every tool dead-end, including the scorecard) and the **honest tri-state completion**.

## Cross-team dependencies
- **Tour Scorecard review**: its "next step" link must be delivered by `ToolJourneyFooter` (1a/1b), not a bespoke footer. Single owner for the footer component. Scorecard's owning stage = `tour-and-evaluate`; next = `make-an-offer/draft-the-offer`.
- **Engineering**: confirm the step page can host a client island (`StepProgressHeader`) without de-opting the rest of the server-rendered page (it can — wrap only the strip).
- **Content/Legal**: sign off on status vocabulary ("In progress" / "Complete" as *app activity*, never deal/legal status) to stay clear of UPL overclaim.
