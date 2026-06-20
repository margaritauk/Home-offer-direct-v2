# Tour Scorecard redesign — integrate with home search

_Contributor: Product Designer (UX) · Tour Scorecard review · 2026-06-16_

Founder's ask, restated: _"You should be able to see the pictures and click into the details of a home, then add it to your scorecard or score it directly within the home; right now you either manually type the address or see a pictureless list in random order, so you can't tell what you're scoring."_

This review proposes how to wire the scorecard into the existing home-search surfaces so a scored entry is a **real, recognizable home** (photo placeholder + facts pulled from the linked listing) instead of a typed string in arbitrary order — and lets the buyer score a home from the place they're already looking at it.

---

## 1. The problem, grounded in the current code

What exists today (`src/components/tools/tour-scorecard.tsx`, `src/lib/tools/tour-scorecard.ts`):

- A `ScoredHome` carries only `{ id, label, ratings, notes }`. **`label` is a free-typed string** — no `listingId`, no price/beds/baths/sqft, no link back to a listing. So the scorecard is permanently amnesiac about _which_ home a row is.
- "Add a home" creates a blank row with an empty text input ("123 Maple St"). The `HomePicker` ("Add from search / showings") does exist, but on pick it calls `addHomeWithLabel(home.label)` — it **throws away everything but the label** (`MyHome` already carries `listingId` and `sqft`, both dropped on the floor).
- The picker itself (`src/components/homes/home-picker.tsx`) renders a **text-only list** — `home.label` + a `city, state · source` line. No photo, no price, no beds/baths. This is the "pictureless list" the founder means.
- The "Ranked by weighted score" section is good math (`rankHomes`) but the per-home **cards above it render in raw input order** (`value.homes.map`), which feels random as the list grows — only the summary list is sorted.
- There is **no entry point from search**: `ListingCard` and `/listings/[id]` have "Track showing" and "Start your offer," but nothing that says "add to scorecard" or "score this home." The only way in is to open the tool and retype the address.

So the three founder complaints map cleanly: **(a)** no picture → picker and cards are text-only; **(b)** random order → cards aren't sorted; **(c)** manual typing → no listing link, picker discards the link it had.

The fix is mostly **plumbing the listing link through** (`ScoredHome` gains an optional listing snapshot) plus two new entry points and a richer card. The scoring math, FHA screening, and `useStageTool` persistence are sound and stay.

---

## 2. Recommended option — "Linked homes, scored where you find them"

One model change unlocks all three directions: **a `ScoredHome` may carry a snapshot of the listing it was created from.** Extend `ScoredHome` (in `src/lib/tools/tour-scorecard.ts`) with an optional, facts-only block:

```ts
interface ScoredHome {
  id: string;
  label: string;                 // still the display fallback / manual entry
  listingId?: string;            // link back to the listing, when added from search
  snapshot?: {                   // facts copied at add-time (survives feed swap)
    address: string;
    city?: string; state?: string;
    price?: number;
    beds?: number; baths?: number; sqft?: number;
    propertyType?: PropertyType; // drives the placeholder image hue
  };
  ratings: Record<string, number>;
  notes?: string;
  tourPhotos?: TourPhoto[];      // buyer's OWN photos (see §6)
  addedAt?: string;              // ISO; enables "recency" sort
}
```

This mirrors the snapshot pattern already proven in `ShowingRecord` (it snapshots `address/city/state` at track time so the dashboard survives a feed swap). Facts-only by construction — no protected-class field, same posture as `MyHome` and `ShowingRecord`.

With the snapshot present, every screen has enough to **show the home, not a string**.

### The three integrations

**(a) From a listing → scorecard.** Add an `AddToScorecardButton` (client component, reads/writes the `tour-scorecard` `useStageTool` blob exactly like `useMyHomes` already does):

- On **`ListingCard`**: a small secondary affordance in the card footer next to the facts row — `+ Scorecard` / `✓ On scorecard` toggle. Because the card is a `<Link>` wrapping the whole tile, the button must `stopPropagation`/`preventDefault` so it doesn't navigate (same care `TrackShowingButton` doesn't need but the nested-in-Link case does). Tap target ≥44px.
- On **`/listings/[id]`** detail page: in the right-hand `aside`, directly under `TrackShowingButton`, a full-width `+ Add to scorecard` button, and once added, an **inline scoring panel** (the same `HomeCard` body — rubric radios + notes) so you can _score this home_ without leaving the page you're looking at. Adding pre-fills `listingId` + `snapshot` from the `Listing` already in scope on that page.

This is the "score it directly within the home" the founder asked for: the detail page becomes a place to score, not just to view.

**(b) From the scorecard → an embedded mini home-browser.** Replace the text-only `HomePicker` list (when its source is "Home search") with **photo + facts rows** that reuse `ListingImage` and the `ListingCard` fact line. Concretely, the "Add a home" flow gets three tabs that already exist (`Home search · Your showings · Tour scorecard`) but the rows render:

```
[ ListingImage   ]  $525,000
[ 5:3 placeholder]  123 Maple St · Austin, TX
[ "Sample photo" ]  3 bd · 2 ba · 1,840 sqft · Single-family   [ Add ]
```

The manual-entry fallback stays (a home not in any source), and its free text stays screened via `screenText` — unchanged. This turns the bare picker into the "embedded mini browser with photo + key facts" the brief calls for, while reusing the existing aggregation (`useMyHomes` → `aggregateHomes`).

> **Plumbing note:** `useMyHomes`/`aggregateHomes` today pass through `sqft` but **not** `price/beds/baths/propertyType`. Widen `MyHome` and `ListingSource` to carry those (they're all facts the `Listing` already has) so the picker rows and the snapshot have something to show. Showings-sourced and scorecard-sourced homes simply have fewer facts — render what's present, gracefully (see states below).

**(c) Inline scoring from within a home.** Two surfaces:
- Detail page panel (above).
- **Card-expand on the scorecard itself**: a scored home's card shows its photo + facts as a header, with the rubric below (this is just the redesigned `HomeCard`, §5). No separate "scoring screen" needed.

### IA placement

No new top-bar anchor (the 5-anchor IA is fixed). The scorecard stays a per-stage tool at `/tools/tour-scorecard` reached via Tools ▾. The new entry points **attach to existing Search-Homes surfaces** (card + detail), which is exactly the "deep-link from the relevant surface, don't add a tab" rule. Cross-link both ways: the detail-page button links to `/tools/tour-scorecard` ("View scorecard"), and the scorecard card's photo/address links back to `/listings/[listingId]` when `listingId` is set.

---

## 3. Make a scorecard entry self-explanatory — card layout + states

Redesigned **`HomeCard`** (replaces the text-input header in `tour-scorecard.tsx`):

```
┌──────────────────────────────────────────────────────────┐
│ ┌────────────┐  $525,000                       weighted   │
│ │ ListingImg │  123 Maple St                     4.2/5    │
│ │  (5:3)     │  Austin, TX · 3 bd 2 ba 1,840 sqft  #1     │
│ │ Sample     │  [ View listing ]            [ Remove ]    │
│ └────────────┘                                            │
│ ── rubric (7 native radios, 1–5 each) ────────────────────│
│ Location      ( 1 2 3 4 5 )                                │
│ Condition     ( 1 2 3 4 5 )   … (unchanged rubric)         │
│ ── Notes (facts only) ─────────────────────────────────── │
│ [ textarea, screened on blur ]                            │
│ ── Your tour photos (§6) ──────────────────────────────── │
│ [ + Add photos ]  [thumb] [thumb]                         │
└──────────────────────────────────────────────────────────┘
```

The header pulls **photo + price/beds/baths/sqft from `snapshot`** so the buyer instantly recognizes the home — that's the whole point. The per-criterion radios, weights math, and the screened notes textarea are kept verbatim from the current implementation.

**Header by state:**
- **Linked (added from search):** placeholder image (hue seeded by `listingId`, "Sample photo" badge), full facts, `View listing` link. The typed-`<input>` is gone; address is read-only text.
- **Manual (typed address, no listing):** generic house placeholder (no listing id → seed on `id`), **address remains an editable `<input>`** (the only place typing still makes sense), facts row hidden or shown as "Add details — not linked to a listing." No `View listing` link.
- **Tour photos present:** the buyer's first own photo becomes the header thumbnail, with the placeholder demoted — _their_ photo is the real picture (see §6). Add a small "Your photo" tag so provenance is honest.

**Empty state:** keep the current friendly card but make it actionable — _"No homes yet. Add one from your search, your showings, or type an address."_ with the picker open by default and a deep link to `/listings`.

**Loading:** render `Loading your scorecard…` until `hydrated` (current behavior; keep). The picker rows reuse the search skeleton idea (gray pulse card) while `useMyHomes` is `!hydrated`.

**Error:** the tool is localStorage-only, so the realistic failure is a corrupt blob — `useStageTool` already falls back to `INITIAL` on parse error. For the inline-from-detail flow, if writing the blob throws (quota), show a quiet inline `DisclaimerBanner`: _"Couldn't save to this device."_ (no data loss path beyond that). No network error surface needed.

---

## 4. The photo reality — design honestly + buyer's own photos

We do **not** license MLS images (`ListingImage` is a deterministic SVG placeholder with a "Sample photo" badge, and both the search browser and detail page already say so). The redesign must not pretend otherwise:

- **Reuse `ListingImage`** everywhere a home appears (picker rows, scorecard header). It already carries the "Sample photo" badge and a real `aria-label` (`"{type} sample image"`). Do not fake a photo.
- **The real differentiator: the buyer attaches their own tour photos.** When you're standing in the house, the photos that matter are the ones _you_ took — the cramped kitchen, the water stain, the great light at 4pm. Let the buyer attach them per scored home (`tourPhotos`), and when present, **promote the buyer's photo to the card header** and demote the placeholder. This flips the weakness (no MLS photos) into the product's honest strength: a scorecard full of _your_ evidence.

**Tour-photo capture spec:**
- `<input type="file" accept="image/*" capture="environment" multiple>` — `capture="environment"` opens the rear camera on mobile, which is the actual use case (scoring on your phone at the house). Note: no existing file-upload pattern in the app, so this is net-new; keep it small.
- Read via `FileReader` to a data URL, **downscale client-side** (canvas, longest edge ~1280px, JPEG ~0.7) before storing — `useStageTool` persists to localStorage, which is ~5MB; full-res phone photos would blow the quota fast. Store maybe 4–6 thumbnails max per home, with a clear cap message.
- **Strip/ignore EXIF** when re-encoding through canvas (the downscale already drops it). Important: phone photos carry **GPS + timestamp EXIF**; we don't want to silently persist the buyer's location trail. Re-encoding via canvas drops EXIF as a side effect — call this out so it isn't "optimized away."
- Each thumbnail: `alt` defaults to the home's address + "tour photo N"; allow an optional **caption** (free text → **run through `screenText`**, same as notes — a caption like "the nursery" or "wheelchair ramp" could leak protected-class/familial-status signal, so it must be screened exactly like the notes field).
- Delete affordance per photo (≥44px), confirm via the existing Undo pattern is overkill — a simple remove is fine since they can re-add.

**A11y + mobile (you're scoring on your phone at the house):**
- The rubric **already uses native radio inputs** (`role="radiogroup"` wrapping real `<input type="radio">`) — keep them; this satisfies the a11y-debt rule "never ship a custom radiogroup that isn't arrow-key operable." Do **not** regress to custom buttons.
- All new tap targets (Add-to-scorecard button, photo add/remove, picker rows) **≥44px** (`min-h-[44px]`).
- Don't encode rank/score in color alone — `#1` and the numeric `weighted/5` are text already; keep them.
- Card stacks single-column on mobile; the photo header goes full-width above the facts on narrow screens.
- Give every new input the shared `.field` focus ring (no bare browser default), per the a11y debt list.

---

## 5. Ordering — replace "random" with a meaningful sort

Today the **cards** render in input order while only the summary is ranked. Fix: sort the cards too, with a small control. Default to **weighted score, highest first** (reuse `rankHomes` — it already sorts stably and pushes unrated homes to the end). Add a `Sort` `<select>` mirroring the search browser's pattern (same component idiom as `ListingsBrowser`'s sort):

- **By score (default)** — `rankHomes` order; shows the `#rank` badge on each card.
- **Recently added** — needs the new `addedAt` timestamp; newest first. This is the natural order while you're actively touring.
- **By status** — _only if_ we link status from showings (a linked home can borrow its `ShowingStatus`); otherwise omit for now to avoid scope creep.

Unrated homes sort last under "score" (they have weighted 0), which is the right behavior — a half-filled tour shouldn't bury the homes you actually rated. Keep the existing "Ranked by weighted score" summary section; with the cards now sorted it becomes a compact recap rather than the only place ranking is visible. Mark the sorted region `aria-live="polite"`/`aria-busy` consistent with the search results bar so re-ordering is announced.

---

## 6. What changes — concrete list

**Model (`src/lib/tools/tour-scorecard.ts`):**
- Add optional `listingId`, `snapshot` (facts-only), `tourPhotos`, `addedAt` to `ScoredHome`. Pure module; math untouched. Add a doc line that `snapshot`/`tourPhotos` carry facts/buyer-captured content only — no protected-class fields (FHA posture, matching the existing header).

**Aggregation (`src/lib/homes/my-homes.ts` + `src/hooks/use-my-homes.ts`):**
- Widen `MyHome` + `ListingSource` to carry `price/beds/baths/propertyType` (facts the `Listing` already has) so picker rows + snapshots can render them. Listings populate them; showings/scorecard sources leave them undefined.

**Picker (`src/components/homes/home-picker.tsx`):**
- Render photo + facts rows (reuse `ListingImage` + the `ListingCard` fact line) instead of the text-only list. Return the full `MyHome` on pick (don't reduce to a label).
- Keep the manual-entry fallback and its `screenText` screening **unchanged**.

**Scorecard (`src/components/tools/tour-scorecard.tsx`):**
- `addHomeWithLabel(home.label)` → `addHome(home)` that stores `listingId` + `snapshot` + `addedAt` from the picked `MyHome` (stop discarding the link).
- Redesign `HomeCard` header: photo + price/beds/baths/sqft + `View listing` link (linked) / editable address input (manual). Keep rubric radios + screened notes verbatim.
- Sort the rendered cards (default by `rankHomes`), add a Sort select; mark the list `aria-live`.
- Add the tour-photos sub-section (capture, downscale, screened captions, delete).

**New components:**
- `AddToScorecardButton` — used on `ListingCard` (footer, `preventDefault` inside the Link) and `/listings/[id]` (aside). Toggles on/off; reads/writes the `tour-scorecard` blob.
- Detail-page inline scoring panel — reuse the redesigned `HomeCard` body, pre-filled from the in-scope `Listing`.
- `TourPhotos` sub-component (capture + thumbnails + screened caption).

**Reuse, don't rebuild:** `ListingImage`, `useStageTool` (`hydrated`/Undo), `useMyHomes`/`aggregateHomes`, `rankHomes`/`scoreHome`, `screenText`, `ToolDisclaimer`, native-radio rubric, the search browser's Sort `<select>` idiom, `ToolPageHeader`.

**Copy / legal (load-bearing):**
- Keep `ToolDisclaimer` as-is — _"A scoring aid, not advice. Rate only property and transaction facts… Free-text notes are screened…"_ (quiet gray, correct tier for an estimate tool — do not escalate to amber/loud).
- **FHA:** rubric criteria stay objective property facts (they already are); **notes AND new photo captions both go through `screenText`** — the free-text screening must remain, now extended to captions. No "good for families / near a church / quiet retiree street" prompts anywhere.
- **UPL:** ranking/score copy stays "compare," "scoring aid," never "best home" / "you should buy." No directive language on the new buttons — `+ Add to scorecard`, not "Pick this one."
- **Photo honesty (UDAP):** keep the "Sample photo" badge on placeholders; tag the buyer's own photos "Your photo" so the two are never confused.

---

## Alternatives considered

**Alt A — Picker-only fix (smaller).** Just give `HomePicker` photos + facts and stop discarding `listingId`/`snapshot`; skip the from-search entry points and inline-on-detail scoring. Lands items (b) and (2)+(4) and most of the founder's pain, but **misses "score it directly within the home"** — you'd still go to the tool to score. Good as a phase-1 slice if the from-search buttons need more time; recommend shipping the picker + model change first, then the detail-page entry point.

**Alt B — Scorecard reads showings as the home source of truth.** Instead of snapshotting onto `ScoredHome`, derive scored homes from tracked showings (which already snapshot address + carry a `rating`). Tighter data model, but it **forces every scored home to first be a tracked showing**, adds a coupling the buyer didn't ask for, and a manual/quick "score a home I saw at an open house" gets awkward. The snapshot-on-`ScoredHome` approach keeps the scorecard self-contained (matching how `useStageTool` tools are independent blobs) while still _allowing_ a link. Not recommended as the primary.
