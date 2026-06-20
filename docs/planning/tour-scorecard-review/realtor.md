# Tour Scorecard — Buyer's-Agent Review

_Contributor: Buyer's Agent Advisor · Tour Scorecard review · 2026-06-16_

## The real workflow this tool has to fit

Here is how I actually run a buying day with a client, and the gap the founder is pointing at.

We tour four to seven homes in a few hours. The houses blur together by the third
one — "wait, was the dark kitchen the one with the new roof, or the one on the
busy street?" The way a good agent solves this is **at the door, not that
evening**: the moment we walk out, the client snaps three or four phone photos
(the thing they loved, the thing that worried them, the street view) and I jot
the address, the price, and a one-line condition note. That evening we lay the
homes side by side — photos, facts, notes, and a consistent score — and the
shortlist falls out almost on its own.

The current tool breaks at the most important moment. A scored entry is a
free-typed label, seven 1–5 sliders, and a notes box. There is **no photo, no
price, no beds/baths/sqft, no address structure** — so by the time the client
sits down to compare, the entries are indistinguishable and they cannot remember
which house "#2 — 4.1/5" actually was. The `HomePicker` only ever pulls a
**label** (`addHomeWithLabel(home.label)` in `tour-scorecard.tsx:49`), throwing
away the `listingId`, `sqft`, `city`, `state` that `MyHome` already carries. And
on the home itself — the listing detail page and the listing card — there is no
"score this / add to scorecard" button at all, so the only path in is to retype
an address. That is exactly backwards from how buyers experience homes: they see
the home, *then* they want to score it.

So the founder's instinct is right, and it's the single highest-leverage change:
**make the scored entry self-explanatory by carrying the home's facts and the
buyer's own photos, and let the buyer score from the home they're looking at.**

Everything below is a scoring AID, not advice (UPL), and stays on objective
property facts — never neighborhood-desirability, "family-friendly," school-as-
value, or any protected-class proxy (FHA). The existing `screenText` on notes and
the disclaimer stay exactly as they are.

---

## Prioritized recommendations

### P0 — Carry the home's facts onto the scored entry (kill the pictureless label)

**What.** Extend `ScoredHome` beyond `{ label, ratings, notes }` to snapshot the
property facts a buyer compares on: `address`, `city`, `state`, `price`, `beds`,
`baths`, `sqft`, `propertyType`, and an optional `listingId`. When a home comes
in via the picker or from a listing, copy those facts in; when added manually,
let the buyer fill the few that matter (address + price + beds/baths/sqft).

**Why.** These five-or-six facts are the spine of every side-by-side an agent
does. Price and sqft together give the buyer **price-per-sqft**, which is how you
sanity-check whether a home is dear or a deal — show it on the card (the listing
detail already computes `price / sqft`). Without these, a "4.1/5" is unanchored:
a 4.1 on a $480k 3/2 and a 4.1 on a $310k 2/1 are not the same decision, and the
buyer can't see why. The data is already sitting in `MyHome` and the `Listing`
model — we're just discarding it at the picker boundary today.

**How it threads the picker.** Change `HomePicker.onPick` consumption so the
scorecard takes the whole `MyHome` (it already gets the object — line 80 just
reads `.label`). `MyHome` carries `sqft`, `city`, `state`, `listingId`; pull
those through. Where the picked home maps to a real listing (`listingId`),
hydrate the rest (`price`, `beds`, `baths`, `propertyType`) from the listing so
the entry is fully populated without retyping.

---

### P0 — Buyer-uploaded tour photos per entry

**What.** Let each scored home hold a small set of buyer-taken photos (thumbnails
shown on the card, tap to enlarge). Store as object URLs / data URLs in the
existing localStorage tool blob, with a sensible cap (e.g. 6 photos) and a clear
"your photos" label.

**Why.** This is the feature that makes the evening comparison work, and given we
have **no MLS image license** (placeholders only — `listing-image.tsx`), buyer
photos are not a compromise, they're the *correct* source: they're what the buyer
actually saw and reacted to, captured at the showing. A photo of "the cramped
kitchen" or "the water stain in the basement" is worth more to the decision than
any stock exterior shot. This is also the honest way to have pictures at all
without licensing risk.

**Guardrail.** Photos are of the **building and the property**, never of people —
add one line of helper copy to that effect, consistent with the FHA framing on
the tour checklist ("about the building, never who lives there"). No screening
pipeline exists for images, so keep the helper text explicit and keep photos
local to the buyer's device (they already are).

---

### P0 — Score the home you're standing in (mobile entry point on listing detail + card)

**What.** Add an "Add to scorecard" / "Score this home" control on the listing
detail page (`/listings/[id]`, alongside the existing `TrackShowingButton`) and
optionally on the `ListingCard`. It creates a scorecard entry pre-filled with
that listing's facts (address/price/beds/baths/sqft/type/listingId), then drops
the buyer straight into scoring it.

**Why.** This is the integration the founder asked for, stated as a workflow: see
photos → click into details → add it to the scorecard or score it directly. The
"track this showing" button already proves the pattern (per-listing action that
writes to a buyer tool). The scorecard is *more* time-sensitive than tracking,
because scoring and the condition note want to happen at the door while it's
fresh — so the entry point belongs on the home, and the experience has to be
mobile-friendly (the 1–5 radios and a photo upload are both thumb-friendly
already; just make sure the entry point is reachable from the detail page on a
phone).

**Dedupe.** `aggregateHomes` already dedupes by `listingId` then normalized
address, so scoring a listing that's also a tracked showing should resolve to one
home, not two. Re-use that key so "add to scorecard" on a home already on the
card is idempotent (offer to jump to the existing entry rather than duplicate).

---

### P1 — Flag deal-breaker failures from the A7 needs-assessment

**What.** The A7 worksheet (`criteria.ts`) already separates **must / nice /
deal-breaker** and already seeds the scorecard rubric via `toScorecardRubric`
(must→3, nice→1, deal-breakers deliberately excluded because they're pass/fail,
not a 1–5 gradient). Close the loop on the deal-breakers: let the buyer mark, per
scored home, whether each deal-breaker is **met or violated**, and when one is
violated, **flag the entry** ("⚠ Fails a deal-breaker: no off-street parking")
and visually separate it from the ranked list.

**Why.** A weighted score hides a fatal flaw. A house can score 4.3 and still be
on a road the buyer told me they will not live on, or be a walk-up when they need
step-free access. An agent's job at the comparison table is to say "that one's
out, regardless of the number" — the deal-breaker is a gate, not a weight. Right
now `toScorecardRubric` correctly drops deal-breakers from the math, but nothing
**surfaces** them on the scored home, so the gate is invisible. Don't fold them
into the score (that would dilute a hard constraint into a soft one); show them as
a separate pass/fail flag that overrides the ranking visually.

**Guardrail.** The A7 catalog is already FHA-clean (objective property/logistics
only). Keep deal-breakers pulling from that same catalog — never let a free-typed
deal-breaker bypass `screenText`.

---

### P1 — Add a structured condition / red-flag prompt (don't rely on free-text memory)

**What.** Alongside the open notes box, offer the **objective tour-checklist
criteria that already exist** — `TOUR_CHECKLIST_CRITERIA` in `showing-scripts.ts`
(water/moisture, foundation & structure, major-systems age, windows/doors, etc.,
all `weight: 3`). Let the buyer flag any of these as a concern on the entry, and
carry that flag onto the comparison card.

**Why.** Condition is where buyers get hurt, and it's the hardest thing to
remember after five houses. The free-text "notes" box is good for color, but a
buyer won't reliably free-recall to check for water stains or a sloping floor.
These prompts already exist, are already FHA-safe ("about the building, never who
lives there"), and already share the `ScorecardCriterion` type — wiring them into
the scorecard entry is mostly plumbing, and `toScorecardSeed()` is already there
to do it. A flagged red-flag should show on the card next to the score, the same
way the deal-breaker flag does, because "scored 4.0 but has a possible foundation
issue" is the kind of thing that changes the offer.

---

### P1 — Make the ranked list show the facts, not just a label and a number

**What.** Today the ranked section (`tour-scorecard.tsx:112-136`) renders
`#rank · label · X.X/5`. Once the entry carries facts and photos, the comparison
view should show, per home: lead photo (buyer's), address, price, beds/baths/sqft,
price-per-sqft, the weighted score, and any deal-breaker / red-flag flags. Ideally
a side-by-side column layout for the top few, since that's literally how the
evening comparison happens.

**Why.** The ranking is the payoff moment and it's currently the least
informative view in the tool. A buyer deciding between their top two homes needs
to *see* them next to each other — photo, price, the score, and the caveats — not
read two labels. This is the difference between "a list that sorts" and "a tool
that helps me choose." (There is already a `compare-homes.tsx` component in the
repo — worth checking whether the side-by-side belongs there or here, to avoid
two divergent comparison views.)

---

### P2 — Validate / lightly revise the rubric and weights

The current default rubric (`DEFAULT_CRITERIA`) is **sound and FHA-clean** — keep
it as the fallback. From a buyer-agent lens:

- **Weights are reasonable.** Location 3, Condition 3, Price-vs-value 3 as the top
  tier matches what actually drives buyer decisions; Layout 2 and Commute 2 in the
  middle, Light 1 and Outdoor 1 as tie-breakers is right. No change needed to the
  numbers.
- **Let the A7 worksheet override the defaults when present.** The hand-off
  already exists (`toScorecardRubric`). When the buyer has done the needs
  assessment, the scorecard should score against *their* must/nice criteria, not
  the generic seven — that's the whole point of the consultation. Make that the
  rubric when it exists, falling back to `DEFAULT_CRITERIA` when it doesn't.
- **Don't over-engineer the rubric.** Resist adding "school quality,"
  "neighborhood desirability," or "safety" as criteria — they're the classic FHA
  steering proxies and the A7 doc already (correctly) refuses them. Condition,
  layout, price-value, light, outdoor, commute, location-as-convenience are the
  right objective set.
- **Minor:** consider splitting "Condition" so the *structural/systems* red-flags
  (P1 above) are a separate pass/fail signal from the cosmetic "move-in ready vs.
  needs work" score — a buyer happily renovating a dated kitchen still needs to
  know about the cracked foundation. The red-flag prompt handles this without
  touching the weighted rubric.

---

## What must be on a scored entry (the checklist)

For the tool to genuinely replace what I do at the comparison table, each entry
needs:

1. **Address** (structured, not just a free label) — so the buyer knows which house.
2. **The buyer's own tour photos** — the memory anchor; our only licit image source.
3. **Price + beds + baths + sqft + price-per-sqft** — the comparison spine.
4. **Property type** — a condo at 4.0 and a single-family at 4.0 aren't the same choice.
5. **Condition / red-flag flags** (from the existing tour checklist) — where buyers get hurt.
6. **Deal-breaker pass/fail** (from A7) — the gate that overrides the score.
7. **The weighted score + the screened free-text note** — already present; keep.

Items 1–6 are the gap. Items 1, 3, 4 are already in the data we throw away at the
picker; 5 and 6 already exist as FHA-clean modules waiting to be wired in; 2 is
the buyer-photo upload. None of this requires an MLS image license, none of it
crosses UPL (it organizes and scores facts; it never tells the buyer which home
to buy or what to offer), and all free text stays screened.

---

## Compliance recap (must hold)

- **UPL:** stays a scoring aid. The tool ranks the buyer's *own* ratings of facts;
  it never recommends a home or an offer. Keep the existing disclaimer.
- **FHA:** criteria, red-flags, and deal-breakers all stay on objective property
  facts (the A7 catalog and tour checklist are already clean). Photos are of the
  building, never people. Free-text notes and any free-typed criterion labels stay
  screened via `screenText`.
- **No MLS photos:** buyer-uploaded tour photos are the right and only call —
  treat them as a feature, not a workaround.
