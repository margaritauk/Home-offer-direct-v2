/**
 * Deterministic (no-AI) comp ranker (issue #127).
 *
 * Given a subject home and a set of candidate sales, pick and rank the best
 * comparables WITHOUT any LLM. The scoring is intentionally simple and
 * transparent: closeness in size first, then recency, then distance. The top N
 * are mapped to the existing {@link Comp} shape with a simple size-based dollar
 * adjustment so the existing comps math ({@link compsEstimate}) can roll them up
 * into a fair-value range.
 *
 * PURE & DETERMINISTIC: no I/O, no randomness, no Date.now(). The same inputs
 * always produce the same output. Empty/garbage candidates → [].
 *
 * HONESTY GUARDRAIL: this ranker does not invent sales — it only orders and
 * adjusts the candidates it is handed. When a candidate is flagged `sample`
 * (illustrative, not a real sale), the produced comp's label carries a
 * "(sample)" marker so the provenance survives into the worksheet rows.
 */

import type { CandidateSale, CompsSubject } from "./comps-source";
import type { Comp } from "./comps";

export interface RankCompsOptions {
  /** How many comps to keep. Defaults to 4. */
  limit?: number;
}

const DEFAULT_LIMIT = 4;

function isUsableSqft(n: number | undefined): n is number {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

/** Parse a candidate sale date to a sortable epoch; unknown/invalid → -Infinity. */
function saleEpoch(saleDate: string | undefined): number {
  if (!saleDate) return -Infinity;
  const t = new Date(saleDate).getTime();
  return Number.isFinite(t) ? t : -Infinity;
}

/**
 * Rank candidate sales and map the top N to {@link Comp}s.
 *
 * Ordering (ascending "cost" — lower is better):
 *   1. absolute sqft difference from the subject (primary),
 *   2. recency (more recent sale wins),
 *   3. distance from the subject (closer wins),
 *   4. id (stable tiebreak so the result is fully deterministic).
 *
 * Each kept candidate gets a SIZE-BASED adjustment: the comp is adjusted by its
 * own implied $/sqft times how much LARGER it is than the subject. A comp bigger
 * than the subject is treated as *superior* (positive adjustment, consistent
 * with the worksheet's "+ if superior" convention), so its implied value is
 * brought down toward the subject's size; a smaller comp gets a negative
 * adjustment. When the subject sqft is unknown, the adjustment is 0.
 */
export function rankComps(
  subject: CompsSubject,
  candidates: CandidateSale[],
  opts?: RankCompsOptions,
): Comp[] {
  if (!Array.isArray(candidates) || candidates.length === 0) return [];

  const limit =
    typeof opts?.limit === "number" && Number.isFinite(opts.limit) && opts.limit > 0
      ? Math.floor(opts.limit)
      : DEFAULT_LIMIT;

  const subjectSqft = isUsableSqft(subject.sqft) ? subject.sqft : null;

  // Only rank candidates that have a usable sqft and price — without those they
  // can't contribute to the size-based comparison or the downstream math.
  const usable = candidates.filter(
    (c) => isUsableSqft(c.sqft) && Number.isFinite(c.salePrice) && c.salePrice > 0,
  );
  if (usable.length === 0) return [];

  const ranked = [...usable].sort((a, b) => {
    const sqftA = subjectSqft === null ? 0 : Math.abs(a.sqft - subjectSqft);
    const sqftB = subjectSqft === null ? 0 : Math.abs(b.sqft - subjectSqft);
    if (sqftA !== sqftB) return sqftA - sqftB;

    const recencyA = saleEpoch(a.saleDate);
    const recencyB = saleEpoch(b.saleDate);
    if (recencyA !== recencyB) return recencyB - recencyA; // more recent first

    const distA = Number.isFinite(a.distanceMiles ?? NaN)
      ? (a.distanceMiles as number)
      : Infinity;
    const distB = Number.isFinite(b.distanceMiles ?? NaN)
      ? (b.distanceMiles as number)
      : Infinity;
    if (distA !== distB) return distA - distB;

    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  return ranked.slice(0, limit).map((c) => toComp(c, subjectSqft));
}

function toComp(c: CandidateSale, subjectSqft: number | null): Comp {
  const pricePerSqft = c.salePrice / c.sqft;
  // Size-based adjustment: value of the sqft difference at the comp's implied
  // $/sqft. Positive when the comp is larger (superior) than the subject.
  const adjustment =
    subjectSqft === null
      ? 0
      : Math.round((c.sqft - subjectSqft) * pricePerSqft);

  const base = c.address || c.id;
  const label = c.sample ? `${base} (sample)` : base;

  return {
    id: c.id,
    label,
    salePrice: c.salePrice,
    sqft: c.sqft,
    adjustment,
  };
}
