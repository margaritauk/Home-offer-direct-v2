# UX continuity & usability — consolidated recommendation

_Owner: Product Owner · UX usability recommendation · 2026-06-16_

This consolidates four founder-requested usability improvements into one prioritized,
buildable recommendation, in the same DoR/DoD, story, and gate→unblock format the pod already
builds off in [`groomed-backlog-10-sprints.md`](./groomed-backlog-10-sprints.md). It synthesizes —
it does not re-derive — these review docs; read them for full depth:

- Tour Scorecard ↔ search — UX: [`tour-scorecard-review/ux.md`](./tour-scorecard-review/ux.md)
- Tour Scorecard ↔ search — Buyer's-Agent: [`tour-scorecard-review/realtor.md`](./tour-scorecard-review/realtor.md)
- Journey navigation / completion / resume — UX: [`journey-navigation-review/ux.md`](./journey-navigation-review/ux.md)

Items 3 (one-tap contact-the-listing-agent) and 4 (universal location autocomplete) have no
separate review doc; they are scoped here from the orchestrator's research findings.

---

## Executive summary

Four asks, one theme: **make the buyer-facing surfaces recognize the home, the place, and the
path the buyer is on** — instead of free-typed strings, pictureless lists, dead-end tools, and
segmented location boxes. None of the four needs a vendor key or a legal sign-off to ship: the
location box defaults to **Photon (komoot), keyless/free**; the listing-agent contact block reads
RentCast fields **already fetched** by the connector; the scorecard and journey work are pure
client/lib plumbing over shipped stores. **All four are gate-free / buildable-now.**

The highest leverage is in **three shared primitives built once** so the four items don't
duplicate work:

1. **`ToolJourneyFooter`** (+ `journeyAnchorForTool` helper) — the single owner of every tool's
   "back to journey / next step" link. The scorecard's "next step" must come from this footer,
   **not** a bespoke one (the #1↔#2 single-owner dependency).
2. **`LocationSearchBox`** (+ a new `geocode` provider seam) — one accessible ARIA-combobox that
   replaces every segmented location input, including the scorecard's add-home and manual-add-showing
   (the #1↔#4 dependency: the scorecard picker reuses the same box).
3. **Snapshot-on-`MyHome` widening** — carry `price/beds/baths/propertyType` through
   `MyHome`/`ListingSource` so the scorecard snapshot, the picker rows, and the contact-agent block
   all draw from one widened model.

Recommended shape: a focused **"UX continuity & usability" sprint pair (S0a / S0b)** slotted
**ahead of S1**, because it is gate-free, it removes friction on surfaces every later sprint builds
on, and it ships the shared footer the scorecard review is already blocked on. Sequencing detail in
the last section.

**Location-box input-variant set (decided, recorded here):** `zip · full address · city · state ·
county`, plus a **"Use my current location"** action. **Neighborhood is deliberately excluded**
(FHA: neighborhood-name typeahead is a steering vector; geography only). County is included because
Photon returns it cleanly and several state/tax surfaces are county-scoped.

---

## Conventions (inherited)

Priority (P0/P1/P2, `-gate` suffix), estimate scale (S/M/L/XL), the user-story format, **DoR**, and
**DoD** are exactly as defined in [`groomed-backlog-10-sprints.md` §1](./groomed-backlog-10-sprints.md).
In particular DoD #4 (gated features proven CI-green default-OFF) and DoD #5 (compliance is an
asserting test, not a comment) apply to every story below. Compliance shorthand: 🟡 UPL · 🟦 FHA ·
🟧 UDAP.

---

## Item 1 — Tour Scorecard ↔ search integration

> **As a buyer, I want** to see a home's photo and facts and add or score it from the place I'm
> already looking at it, **so that** my scorecard holds recognizable homes — not free-typed strings
> in random order — the way a buyer's agent lays homes side by side at the comparison table.

- **Priority:** P0 — it is the founder's headline ask and the highest-leverage scorecard change.
- **Estimate:** **L** (split-able: a P0 phase-1 `M` = model widen + picker + `addHome`, then a
  phase-2 `M` = from-search entry points + inline scoring + tour photos + sort).
- **Dependencies:**
  - **#1↔#2 (footer single-owner):** the scorecard's "next step" link is delivered by
    `ToolJourneyFooter` (Item 2), not hand-rolled. Owning stage = `tour-and-evaluate`; next =
    `make-an-offer/draft-the-offer`.
  - **#1↔#4 (picker reuses the box):** the manual-entry path in the add-home picker uses
    `LocationSearchBox` (Item 4), not a bare address `<input>`, so a manually-added home resolves to
    structured `city/state/zip` for the snapshot.
  - Shared **snapshot-on-`MyHome` widening** (build-once primitive #3): widen `MyHome` +
    `ListingSource` to carry `price/beds/baths/propertyType` so picker rows + snapshots have facts.
- **Acceptance criteria:**
  - `ScoredHome` (`src/lib/tools/tour-scorecard.ts`) gains optional `listingId`, facts-only
    `snapshot` (`address/city/state/price/beds/baths/sqft/propertyType`), `tourPhotos[]`, `addedAt` —
    pure module, scoring math untouched, a doc line stating facts/buyer-content only (no
    protected-class field), mirroring the `ShowingRecord` snapshot posture.
  - `HomePicker` (`src/components/homes/home-picker.tsx`) renders **photo + facts rows** (reuse
    `ListingImage` + the `ListingCard` fact line) for the "Home search" source; manual-entry fallback
    stays and keeps `screenText` screening. On pick it returns the **whole `MyHome`** — the scorecard
    stores `listingId` + `snapshot` + `addedAt` (`addHomeWithLabel(home.label)` → `addHome(home)`);
    the link is no longer discarded.
  - New `AddToScorecardButton` on **`ListingCard`** (footer, `preventDefault`/`stopPropagation`
    inside the wrapping `<Link>`, ≥44px, toggle `+ Scorecard` / `✓ On scorecard`) and on
    **`/listings/[id]`** (in the `aside`, under `TrackShowingButton`), pre-filled from the in-scope
    `Listing`. Once added on the detail page, an **inline scoring panel** (the redesigned `HomeCard`
    body — native-radio rubric + screened notes) lets the buyer score without leaving the page.
  - Dedupe via the existing `aggregateHomes` key (`listingId` then normalized address): adding a home
    already on the card is idempotent (offer to jump to the existing entry, never duplicate).
  - The scorecard's rendered **cards are sorted** (default `rankHomes`, highest weighted first;
    unrated last) with a `Sort` `<select>` (By score / Recently added via `addedAt`); the sorted
    region is `aria-live="polite"`/`aria-busy`.
  - **Tour photos** per home: `<input type="file" accept="image/*" capture="environment" multiple>`,
    client-side canvas downscale (~1280px longest edge, JPEG ~0.7) which **drops EXIF/GPS** as a side
    effect (called out, not "optimized away"), cap ~4–6 with a clear message, optional caption run
    through `screenText` like notes, ≥44px delete, "Your photo" provenance tag; placeholder demoted
    when a buyer photo is present.
  - States: linked / manual / tour-photo header; empty (picker open + deep link to `/listings`);
    loading until `hydrated`; quota-error inline `DisclaimerBanner` ("Couldn't save to this device.").
- **Test plan (layered):**
  - **Unit (Vitest):** `ScoredHome` snapshot round-trip + `addedAt`; `addHome(MyHome)` maps
    listingId/snapshot (no label-only reduction); `rankHomes` card-sort incl. unrated-last and
    recently-added; `aggregateHomes` dedupe idempotency; photo downscale produces a smaller data URL
    and EXIF is absent; caption + manual-address `screenText` blocks a steering phrase (~14–18).
  - **Component (RTL):** picker renders photo+facts rows and returns full `MyHome`;
    `AddToScorecardButton` toggles and does **not** navigate inside the Link (`preventDefault`);
    inline scoring panel renders on the detail page; sort select reorders; empty/loading/quota states;
    "Your photo" tag + "Sample photo" badge never co-present on the same image (~8–10).
  - **E2E (Playwright):** from `/listings/[id]`, Add to scorecard → score → `/tools/tour-scorecard`
    shows the home with facts; footer "Next" lands on the offer step (Item 2) (~2).
- **Impl notes (real paths):** `src/lib/tools/tour-scorecard.ts` (model + math); `src/lib/homes/my-homes.ts`
  + `src/hooks/use-my-homes.ts` (widen `MyHome`/`ListingSource`); `src/components/homes/home-picker.tsx`;
  `src/components/tools/tour-scorecard.tsx` (`HomeCard` redesign, sort, tour photos); new
  `AddToScorecardButton` used on `src/components/listings/*` `ListingCard` and `src/app/listings/[id]/page.tsx`;
  new `TourPhotos` sub-component. Reuse `ListingImage`, `useStageTool` (`hydrated`/Undo),
  `aggregateHomes`/`rankHomes`/`scoreHome`, `screenText`, `ToolDisclaimer`, the `ListingsBrowser` sort
  idiom. **Photo upload is net-new** (no existing file-upload pattern) — keep it small, localStorage-only.
- **Gate → unblock:** **none.** No MLS image license (placeholders + buyer photos only), no vendor key,
  no new table — pure client/lib over shipped `useStageTool`. Buildable now.
- **Compliance:** 🟡 UPL — "scoring aid," "compare," never "best home"/"pick this one"; button copy
  `+ Add to scorecard`, not directive. 🟦 FHA — rubric stays objective property facts; **notes AND photo
  captions both route through `screenText`**; photos are of the building, never people. 🟧 UDAP — keep
  the "Sample photo" badge on placeholders; tag buyer photos "Your photo" so the two are never confused.

---

## Item 2 — Journey navigation / completion / resume

> **As a buyer, I want** to always see where I am in the journey, have my work show as in-progress
> from the data I entered, and resume exactly where I left off, **so that** I never hit a dead-end
> tool or lose my place — the continuity an agent gives me.

- **Priority:** P0 — the shared `ToolJourneyFooter` kills every tool dead-end (scorecard included) and
  is the dependency the scorecard review is blocked on.
- **Estimate:** **L** (footer + helper `S`; `StepProgressHeader` + focus-management pattern `M`;
  tri-state completion across 3 surfaces `M`; last-position store + `ResumeCard` `S–M`).
- **Dependencies:** shipped only — `flattenedSteps`/`stepNeighbors`/`STAGE_TOOLS`,
  `useProgress`/`isStepComplete`, `useStageTool`, the cloud-sync rails (which enumerate every
  `hod:tool:*` key, so the new `__last-position` store auto-syncs with **zero** sync edits). **#1↔#2:**
  Item 1's "next step" link is an instance of this footer — single owner here.
- **Acceptance criteria:**
  - **`ToolJourneyFooter`** rendered by `ToolPageHeader` on every `/tools/*` page: "← Back to your
    journey" (owning-stage first step) + "Next: <step> →". Owning stage = first `STAGE_TOOLS` match
    (mirrors `toolsByStage()` dedupe); final stage → "Back to journey ✓"; unmapped tool degrades to a
    single back-link to `/journey` (no dead-end ever). New pure helper
    `journeyAnchorForTool(href): { backHref, backLabel, nextHref, nextLabel } | null` next to
    `STAGE_TOOLS` in `lib/journey/navigation.ts`.
  - **`StepProgressHeader`** client island on step pages: "Step N of 22 · Stage X of 14" + tri-state
    chip + thin progress bar (reuse `JourneyOverview` bar markup).
  - **Tri-state `stepStatus()`** (pure): **complete** = all non-optional tasks ticked (`isStepComplete`
    — tools never flip complete); **in-progress** = some tasks ticked **or** a `STAGE_TOOLS`-mapped tool
    has non-empty data; **not-started** otherwise. Per-tool `hasData(value)` predicate registry
    (`TOOL_DATA_PREDICATES`, default deep-≠-`INITIAL`; e.g. scorecard `homes.length > 0`). Shown on
    journey overview (always-visible avatar pip), step header chip, and `/tools` index per-tool dot —
    each **icon + text**, never color alone.
  - **Focus-on-nav a11y fix:** on step/tool route change, move focus to the destination H1
    (`tabIndex={-1}`), a shared pattern; progress strip is `aria-live="polite"`.
  - **Resume:** `__last-position` blob via `useStageTool("__last-position")` written on step/tool
    visit; `resumeTarget(progress, lastPosition)` precedence — explicit position if its step is
    incomplete, else computed `nextStep`/cockpit; `ResumeCard` on landing + dashboard and a "Resume:"
    lead in the `WhatsNext` strip; hydration-gated; never stores user free-text in the position blob.
- **Test plan (layered):**
  - **Unit:** `journeyAnchorForTool` owning-stage resolution incl. multi-stage, final-stage, unmapped;
    `stepStatus` truth table (complete dominates; tool-data → in-progress only); `hasData` per-tool
    incl. default deep-compare; `resumeTarget` precedence incl. stale-complete fallthrough (~16–20).
  - **Component:** footer renders back+next / final / back-only; tri-state chip vocabulary on all three
    surfaces; `StepProgressHeader` "N of 22"; `ResumeCard` shows/hides on history presence; focus lands
    on H1 after nav (~8).
  - **E2E:** add 2 homes to scorecard → `tour-and-evaluate` reads "In progress" on overview + header
    and a saved dot on `/tools`, **without** flipping to Complete; close + reland on `/` → "Resume:
    Score your tours →" returns to the scorecard (~2).
- **Impl notes (real paths):** `src/lib/journey/navigation.ts` (`journeyAnchorForTool`, `stepStatus`,
  `TOOL_DATA_PREDICATES`); new `ToolJourneyFooter` hosted by `ToolPageHeader`; `StepProgressHeader`
  client island on the step page (wrap only the strip; rest stays server-rendered); `useLastPosition`
  thin wrapper + `resumeTarget` + `ResumeCard`; wire into `app/page.tsx`, `/dashboard` (above
  `CockpitBand`), and the `WhatsNext` strip. Reuse the entire sync stack unchanged.
- **Gate → unblock:** **none.** New `useStageTool` key rides cloud-sync for free; no table, no flag, no
  key. Buildable now.
- **Compliance:** 🟡 UPL — status copy is **app activity** ("In progress"/"Complete"), never deal/legal
  status ("you're cleared to…"). 🟦 FHA — completion reads structural facts (counts/non-empty) only, never
  note content; resume `label` is an app-controlled step/tool title, never user free-text.

---

## Item 3 — One-tap contact the listing agent to book a showing

> **As a buyer, I want** one tap to call, email, or draft a showing request to the listing agent on
> a home I'm looking at, **so that** I can book a showing myself — without a buyer's agent — knowing
> exactly who I'm contacting and that they work for the seller.

- **Priority:** P1 — high-value self-service unlock; rides data already fetched. Builds after the
  shared `MyHome`/`Listing` widening lands with Item 1.
- **Estimate:** **M** — connector field-mapping (`S`) + a contact block on detail + card with the
  message-composer prefill (`M`).
- **Dependencies:** RentCast connector (`src/lib/listings/source-rentcast.ts`); the existing FHA-safe
  `MessageComposer` (`src/components/showings/message-composer.tsx`) — already takes `initialValues`
  (`agentName`, `address`, `mlsNumber`, …) and `initialTemplateId`, so the prefill is a props pass-through,
  not a rebuild. Soft overlap with Item 1's `Listing`-on-detail surface.
- **Acceptance criteria:**
  - The `Listing` type (`src/lib/listings/types.ts`) gains an optional facts-only
    `listingAgent?: { name?; phone?; email?; website? }` and `listingOffice?: { name?; phone?; email?;
    website? }`. `mapRentCastListings` maps RentCast's `listingAgent`/`listingOffice` into them; absent
    fields stay `undefined`, never fabricated (mirrors the existing lat/lng "real or undefined" rule).
  - A **"Contact the listing agent to book a showing"** block on `/listings/[id]` (in the `aside`,
    near `TrackShowingButton`) and a compact affordance on `ListingCard`, rendering only when RentCast
    is enabled **and** the data exists; otherwise a graceful fallback to the existing manual
    `MessageComposer` path (no broken/empty block). SimplyRETS is the noted production fallback source.
  - Affordances: **tap-to-call** (`tel:`), **email** (`mailto:`), and **"Draft my showing request"** →
    opens `MessageComposer` pre-filled with the agent name + property address + MLS#, using the existing
    showing-request template. ≥44px targets.
  - An honest **source/verify label** ("Listing-agent contact from RentCast — verify before sending")
    and the existing **agency reminder** that the listing agent works for the seller (reuse the
    composer's amber agency-coaching block; do not soften it).
- **Test plan (layered):**
  - **Unit:** `mapRentCastListings` maps `listingAgent`/`listingOffice` (full, partial, absent →
    `undefined`, never fabricated); never throws on garbage; `tel:`/`mailto:` href builders sanitize the
    phone/email; composer prefill builder fills agentName/address/mlsNumber (~8–10).
  - **Component:** contact block renders when data present + RentCast enabled; **hidden/fallback** when
    data absent or RentCast disabled (mandatory default-OFF/gated case per DoD #4); "Draft my showing
    request" opens the composer with prefilled values; agency reminder + source label present (~6).
  - **E2E:** detail page with a fixtured agent-bearing listing shows the block and the call/email/draft
    actions; a sample (`isSample`/no-agent) listing shows the manual fallback (~1–2).
- **Impl notes (real paths):** `src/lib/listings/types.ts` (extend `Listing`);
  `src/lib/listings/source-rentcast.ts` (`mapRentCastListings` agent/office mapping — research-confirmed
  the sale response already includes `listingAgent`/`listingOffice` with name + phone/email/website);
  new contact block component used by `src/app/listings/[id]/page.tsx` and `ListingCard`; reuse
  `MessageComposer` `initialValues`/`initialTemplateId`; gate visibility on the same enabled-source check
  the listings UI already uses (and respect `isRentCastDisabled()`).
- **Gate → unblock:** **none.** The `listingAgent`/`listingOffice` fields are part of the sale-listings
  response the connector **already fetches**; no new endpoint, key, or call. Renders only when present and
  RentCast is enabled — graceful manual fallback otherwise.
- **Compliance:** 🟡 UPL — "book a showing"/"contact the agent" is logistics, never advice on price or
  terms; no directive copy. 🟦 FHA — only the existing property/transaction composer fields are offered;
  no protected-class inputs, no love-letter; the prefill carries agent/address/MLS# only. 🟧 UDAP — honest
  source/verify label (data may be stale), and the agency reminder that the listing agent represents the
  seller stays prominent (no implied buyer-side representation).

---

## Item 4 — Universal location-autocomplete box

> **As a buyer, I want** one smart location box that autocompletes a ZIP, full address, city, state,
> or county (or uses my current location) everywhere I search or add a home, **so that** I stop
> wrestling with segmented mode-switch inputs and always resolve to a real place.

- **Priority:** P1 — broad UX uplift and a reusable primitive; the scorecard add-home and
  manual-add-showing both consume it (#1↔#4). Ships gate-free on a keyless default.
- **Estimate:** **L** — the `geocode` seam + Photon impl (`M`), the accessible ARIA-combobox
  `LocationSearchBox` (`M`), and replacing the segmented inputs everywhere (`M`).
- **Dependencies:** reuse `useGeolocation` (`src/hooks/use-geolocation.ts`) for "Use my current
  location"; resolve into the existing `LocationValue` slice
  (`src/components/search/location-selector.tsx`) so search/distance keep working unchanged. **#1↔#4:**
  the scorecard add-home picker's manual path uses this box.
- **Input-variant set (decided / recorded):** **`zip · full address · city · state · county`** + a
  **"Use my current location"** action. **Neighborhood is excluded by design** (FHA steering vector).
  County is included (Photon returns it; county-scoped tax/state surfaces use it). Variants are derived
  from each suggestion's type — there is **no manual mode toggle** (that's the segmented-input problem
  we're removing); a single box typeahead returns mixed-type suggestions, each tagged with its kind.
- **Acceptance criteria:**
  - A new swappable **`geocode` provider seam** mirroring the RentCast/AI seams: a `GeocodeProvider`
    contract (`suggest(query)`, `resolve(suggestion)` → `{ lat, lng, zip?, city?, state?, county? }`),
    a **`PhotonGeocodeProvider`** default (keyless komoot Photon, debounced typeahead), and a
    `getGeocodeProvider()` switch reading `process.env` (`GEOCODE_SOURCE`, default `photon`) with a
    `GEOCODE_DISABLED` kill switch. Production swap to **Radar** or **Geoapify** (key) is one new
    `source-*.ts` + one `GEOCODE_SOURCE` value — nothing downstream changes.
  - **`LocationSearchBox`** — an accessible **ARIA combobox** (`role="combobox"` +
    `aria-expanded`/`aria-controls`/`aria-activedescendant`, listbox with `role="option"`, full
    arrow-key/Enter/Escape operation, debounced input, `aria-live` result count, ≥44px). Each suggestion
    shows its kind label (ZIP / Address / City / State / County). A "Use my current location" button
    reuses `useGeolocation` and resolves coords into the slice.
  - Picking a suggestion resolves to the existing **`LocationValue`** shape (`lat/lng/zip/city/state`,
    plus `county` carried where consumed) so RentCast search + `annotateDistance` keep working.
  - **Replaces the segmented inputs everywhere:** `src/components/search/location-selector.tsx`,
    `src/components/showings/manual-add-showing.tsx`, and the scorecard add-home path. The old
    mode-tablist + per-mode inputs are removed in favor of the single box (the `LocationValue` model
    stays the integration contract).
  - States: idle / typing (debounced spinner) / results / no-results ("No match — try a ZIP or city") /
    provider-error (graceful: keep the box usable, allow free-text/current-location); never crashes.
- **Test plan (layered):**
  - **Unit:** Photon response → suggestion mapper (each variant kind; absent fields undefined; garbage →
    `[]`, never throws); `resolve` → `LocationValue` (lat/lng/zip/city/state/county); seam gating
    (default photon / source+key swap / `GEOCODE_DISABLED` kill switch — mandatory default-OFF/gated
    case); debounce util (~12–16).
  - **Component (RTL):** combobox keyboard nav (Up/Down/Enter/Escape, `aria-activedescendant`); selecting
    a suggestion calls `onChange` with the resolved slice; "Use my current location" resolves coords;
    no-results + provider-error states; variant kind labels render (~8).
  - **E2E:** type a city in the search box → pick → results load for that location; current-location
    button path (geolocation mocked) (~2). Regression: the search/manual-add-showing/scorecard flows
    still produce a valid `LocationValue` and RentCast distance sort still works.
- **Impl notes (real paths):** new `src/lib/geocode/` seam (`provider.ts` contract +
  `getGeocodeProvider`, `source-photon.ts`, a `geocode-flag.ts` kill switch mirroring
  `src/lib/rentcast-flag.ts`); new `LocationSearchBox` component; rework
  `src/components/search/location-selector.tsx` to wrap/replace with the box (keep exporting
  `LocationValue`/`LocationMode` for back-compat where imported); update
  `src/components/showings/manual-add-showing.tsx` and the scorecard add-home path. Reuse `useGeolocation`,
  `getStateOptions`, the `.field` focus-ring class.
- **Gate → unblock:** **none.** Default impl is **Photon (komoot), keyless/free** — ships gate-free, no
  key. Production swap to Radar/Geoapify (key) is one source file behind `GEOCODE_SOURCE`, default-OFF.
- **Compliance:** 🟦 FHA — **geography only**; no neighborhood-name typeahead, no demographic or "good
  schools" proxy in suggestions or labels (assert the suggestion set is geographic kinds only). 🟧 UDAP —
  the box resolves to real coordinates/places; never invents a location. 🟡 UPL — pure wayfinding input,
  no advice.

---

## Build-once shared primitives (do not duplicate)

| Primitive | Built in | Reused by | Single owner |
|---|---|---|---|
| `ToolJourneyFooter` + `journeyAnchorForTool` | Item 2 | Item 1's "next step" link | **Item 2** — scorecard must consume, not hand-roll |
| `LocationSearchBox` + `geocode` seam (Photon) | Item 4 | Item 1 add-home manual path, search, manual-add-showing | **Item 4** |
| `MyHome`/`ListingSource` widening (price/beds/baths/propertyType) + `Listing` snapshot fields | Item 1 | Item 1 picker+snapshot, Item 3 contact block (reads `Listing`) | **Item 1** |
| Focus-on-route-change a11y pattern | Item 2 | every step/tool route incl. scorecard entry | **Item 2** |

Building these once is what keeps the bundle at two sprints rather than four item-shaped efforts that
each re-implement a footer, a location box, and a model widen.

---

## Recommended sequencing / bundle

These four are **not** in the current 10-sprint roadmap. Because all four are **gate-free and
buildable-now**, and because the shared footer is a dependency the already-groomed Tour Scorecard work
is blocked on, the recommendation is to bundle them as a **"UX continuity & usability" sprint pair,
slotted ahead of S1** (or run as an S0 pair in parallel with S1's gate-free pure work — S1 itself
carries no gate either, so there is no contention for a clearance).

**S0a — Shared primitives + the two P0 surfaces (footer-first):**
1. **Item 2** first — `journeyAnchorForTool` + `ToolJourneyFooter` + `StepProgressHeader` + focus
   pattern. This unblocks the scorecard's "next step" and removes every tool dead-end immediately.
2. **Item 1 phase-1** in parallel — `MyHome`/`Listing` widening + redesigned picker + `addHome`
   (the snapshot model + the build-once widening). Consumes the footer from step 1.
3. **Item 4 seam + box** can start in parallel (it has no dependency on 1/2) so its `LocationSearchBox`
   is ready for Item 1's manual add-home path.

**S0b — Entry points, completion/resume, and the swap-in:**
4. **Item 1 phase-2** — from-search `AddToScorecardButton` (card + detail), inline scoring, tour photos,
   card sort.
5. **Item 2** completion tri-state across the three surfaces + last-position/resume.
6. **Item 4** replaces the segmented inputs everywhere (search, manual-add-showing, scorecard add-home).
7. **Item 3** — RentCast `listingAgent`/`listingOffice` mapping + the contact-the-agent block (lands
   after the `Listing`/detail surface from Item 1 phase-2 is in place).

**Slotting relative to the 10-sprint roadmap:** place the S0 pair **before S1**. Rationale: (a) gate-free,
so it doesn't wait on any clearance and doesn't disturb the founder-decision/legal register; (b) it pays
down friction on `/listings`, `/tools/*`, and the journey spine that **every** later sprint's surfaces sit
on; (c) it delivers the shared `ToolJourneyFooter` that the groomed Tour Scorecard reviews already assume.
If pod capacity can't absorb a full pair before S1, ship **S0a before S1** (footer + scorecard phase-1 +
location box) and fold **S0b** as a fast-follow alongside S1's pure work — both halves stay gate-free.

**One-line bundle summary:** two gate-free sprints, footer-first, three primitives built once, slotted
ahead of S1 — turning pictureless lists, dead-end tools, and segmented location boxes into recognizable
homes, a continuous path, and one smart place-search the whole product reuses.
