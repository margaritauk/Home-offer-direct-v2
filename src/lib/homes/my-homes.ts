/**
 * Shared "my homes" aggregator (issue #112).
 *
 * The buyer's home-centric tools (comps, tour scorecard, compare, under-contract
 * trackers) all ask the user to name a specific home. Instead of re-typing the
 * address every time, this module merges the candidate homes the buyer already
 * has in the app — from **home search (listings)**, **tracked showings**, and
 * the **tour scorecard** — into one deduped {@link MyHome} list a reusable
 * picker can render.
 *
 * This is the PURE core: no React, no storage. It takes already-read source data
 * and returns the merged list, so the merge/dedupe logic is unit-testable in
 * isolation (the {@link useMyHomes} hook does the reading).
 *
 * GUARDRAIL (FHA, #112): a {@link MyHome} carries only address/transaction facts
 * (label, city, state, sqft, ids). Nothing here collects or infers a
 * protected-class signal. Labels that originate from free text (e.g. scorecard
 * home labels) are screened upstream before they reach the tools that persist
 * them; the aggregator itself only passes through factual fields.
 */

/** Where a candidate home came from, for labeling in the picker. */
export type HomeSource = "Home search" | "Your showings" | "Tour scorecard";

/** A candidate home the buyer can pick into a tool. Facts only. */
export interface MyHome {
  /** Stable, deduped key (listing id, or a normalized-address slug). */
  key: string;
  /** Display label — the street address or the home's free-text label. */
  label: string;
  /** Street address line, when known. */
  address?: string;
  city?: string;
  /** Two-letter state code, uppercase, when known. */
  state?: string;
  /** The originating listing id, when this home maps to a real listing. */
  listingId?: string;
  /** Living area in sqft, when the source carries it (listings do). */
  sqft?: number;
  /** Which source surfaced this home. */
  source: HomeSource;
}

/** A listing-shaped source row (subset of the listings `Listing` model). */
export interface ListingSource {
  id: string;
  address: string;
  city?: string;
  state?: string;
  sqft?: number;
}

/** A tracked-showing-shaped source row (subset of `ShowingRecord`). */
export interface ShowingSource {
  listingId: string;
  address: string;
  city?: string;
  state?: string;
}

/** A tour-scorecard home (just a label — the scorecard stores no address). */
export interface ScorecardSource {
  /** The scorecard home's own id. */
  id: string;
  /** Free-text label the buyer typed (often an address). */
  label: string;
}

/** The three raw source collections the aggregator merges. */
export interface HomeSources {
  listings?: ListingSource[];
  showings?: ShowingSource[];
  scorecard?: ScorecardSource[];
}

/**
 * Normalize an address for dedupe: lowercased, punctuation stripped, whitespace
 * collapsed. Used as the dedupe key when there's no listing id to dedupe on, so
 * "123 Maple St." and "123 maple st" collapse to one home.
 */
export function normalizeAddress(value: string | undefined): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The dedupe key for a candidate: prefer the listing id (most reliable), else a
 * normalized-address slug. Empty when neither is usable.
 */
function dedupeKey(opts: {
  listingId?: string;
  address?: string;
  label?: string;
}): string {
  if (opts.listingId) return `listing:${opts.listingId}`;
  const addr = normalizeAddress(opts.address ?? opts.label);
  return addr ? `addr:${addr}` : "";
}

/**
 * Merge candidate homes from listings + showings + tour-scorecard into a single
 * deduped {@link MyHome} list.
 *
 * Dedupe rule: by listing id first, else by normalized address. When two sources
 * describe the same home, the richer/earlier one wins for the factual fields but
 * we KEEP the most specific source label in priority order: a listing (real
 * address + sqft) beats a showing, which beats a bare scorecard label. The
 * source label reflects the winning source so the picker can show provenance.
 *
 * Order of the result: listings first, then showings, then scorecard-only homes,
 * preserving each source's input order — a stable, predictable picker list.
 */
export function aggregateHomes(sources: HomeSources): MyHome[] {
  const byKey = new Map<string, MyHome>();
  /**
   * Cross-source address index: maps a normalized address to the key already in
   * the map. Lets a listing (keyed `listing:l1`) dedupe against a scorecard home
   * (keyed `addr:...`) when they describe the same address.
   */
  const addrToKey = new Map<string, string>();

  const upsert = (candidate: MyHome) => {
    if (!candidate.key) return; // unusable (no id, no address/label)
    const addr = normalizeAddress(candidate.address ?? candidate.label);
    // Resolve to an existing row by exact key OR by matching normalized address.
    const resolvedKey =
      (byKey.has(candidate.key) && candidate.key) ||
      (addr ? addrToKey.get(addr) : undefined);
    const existing = resolvedKey ? byKey.get(resolvedKey) : undefined;
    if (!existing) {
      byKey.set(candidate.key, candidate);
      if (addr) addrToKey.set(addr, candidate.key);
      return;
    }
    // Merge: fill any field the existing row is missing, but don't downgrade.
    // Existing (earlier, higher-priority) source, key & label win.
    byKey.set(existing.key, {
      ...existing,
      address: existing.address ?? candidate.address,
      city: existing.city ?? candidate.city,
      state: existing.state ?? candidate.state,
      listingId: existing.listingId ?? candidate.listingId,
      sqft: existing.sqft ?? candidate.sqft,
    });
  };

  // 1) Listings — richest source (real address, city/state, sqft).
  for (const l of sources.listings ?? []) {
    const key = dedupeKey({ listingId: l.id, address: l.address });
    upsert({
      key,
      label: l.address,
      address: l.address,
      city: l.city,
      state: l.state ? l.state.toUpperCase() : undefined,
      listingId: l.id,
      sqft: l.sqft,
      source: "Home search",
    });
  }

  // 2) Tracked showings — address snapshot, keyed by their listing id.
  for (const s of sources.showings ?? []) {
    const key = dedupeKey({ listingId: s.listingId, address: s.address });
    upsert({
      key,
      label: s.address,
      address: s.address,
      city: s.city,
      state: s.state ? s.state.toUpperCase() : undefined,
      listingId: s.listingId,
      source: "Your showings",
    });
  }

  // 3) Tour-scorecard homes — label only (no address fields to dedupe on
  //    beyond the label itself).
  for (const h of sources.scorecard ?? []) {
    const label = h.label?.trim();
    if (!label) continue;
    const key = dedupeKey({ label });
    upsert({
      key,
      label,
      source: "Tour scorecard",
    });
  }

  return [...byKey.values()];
}
