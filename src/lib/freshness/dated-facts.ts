/**
 * Dated-fact freshness registry + sweep (S1-H2).
 *
 * Typed legal / market / tax facts that we present to buyers must carry a
 * `source` and an `asOf` date so a claim can't silently rot into UDAP exposure.
 * This module is the single registry of those facts plus the pure helpers the
 * `*.freshness.test.ts` asserts against:
 *
 *   - {@link isFreshnessComplete} — a fact has a non-empty `source` + valid `asOf`.
 *   - {@link isStale} — the fact's `asOf` is older than a staleness threshold.
 *   - {@link sweepFreshness} — classify every registered fact into ok / missing /
 *     stale, so CI fails the moment a dated fact is added without provenance.
 *
 * Pure, no I/O — fully unit-testable. UDAP: neutral presentation; we record the
 * source + date and nothing else.
 */

import { daysBetween, isValidDate } from "@/lib/deadlines";

/** Categories of fact we hold to the source + as-of bar. */
export type FactCategory = "legal" | "market" | "tax";

export interface DatedFact {
  /** Stable id, unique within the registry. */
  id: string;
  category: FactCategory;
  /** The claim itself, in neutral language. */
  claim: string;
  /** Human-readable source (e.g. "Consumer Financial Protection Bureau"). */
  source: string;
  /** As-of date the claim was last verified/published (YYYY-MM-DD). */
  asOf: string;
}

/**
 * Default staleness threshold (days). Past this, a dated fact is flagged for
 * re-verification even though it still carries a source + as-of. Chosen to force
 * an annual-ish review cadence (the H2 recurring sweep, roadmap S10).
 */
export const DEFAULT_STALENESS_DAYS = 540;

/**
 * The registry of dated facts we surface. EVERY entry MUST carry a real `source`
 * and a valid `asOf`; the freshness test fails the build otherwise. Keep claims
 * neutral and process-oriented (no editorializing, no directives).
 *
 * Seeded with the durable, sourced facts the app already relies on. New dated
 * legal/market/tax claims added anywhere in the product should register here so
 * the sweep keeps them honest.
 */
export const DATED_FACTS: readonly DatedFact[] = [
  {
    id: "cd-three-business-day-rule",
    category: "legal",
    claim:
      "Lenders must deliver the Closing Disclosure at least three business days before consummation.",
    source: "Consumer Financial Protection Bureau (TRID, 12 CFR §1026.19)",
    asOf: "2025-10-01",
  },
  {
    id: "earnest-money-typical-range",
    category: "market",
    claim:
      "Earnest money deposits commonly run about 1–3% of the purchase price, though the amount is negotiable and set by the contract.",
    source: "National Association of REALTORS® — buyer guidance",
    asOf: "2025-09-15",
  },
  {
    id: "buyer-broker-commission-negotiable",
    category: "legal",
    claim:
      "Real estate broker commissions are negotiable and are not set by law; the August 2024 NAR settlement changed how buyer-broker compensation is disclosed and offered.",
    source: "U.S. Dept. of Justice / NAR settlement (effective Aug 17, 2024)",
    asOf: "2025-08-17",
  },
  {
    id: "mortgage-interest-deduction-cap",
    category: "tax",
    claim:
      "Mortgage interest is generally deductible on up to $750,000 of acquisition debt for loans taken after Dec 15, 2017 (consult a tax professional for your situation).",
    source: "IRS Publication 936",
    asOf: "2025-01-31",
  },
];

/** A fact is freshness-complete when it carries a real source + a valid asOf. */
export function isFreshnessComplete(fact: DatedFact): boolean {
  return (
    typeof fact.source === "string" &&
    fact.source.trim().length > 0 &&
    typeof fact.asOf === "string" &&
    isValidDate(fact.asOf)
  );
}

/**
 * Whether a fact's `asOf` is older than `thresholdDays` before `todayISO`.
 * Returns `false` for a fact with an invalid/missing `asOf` (that's a
 * completeness failure, surfaced separately — not a staleness one).
 */
export function isStale(
  fact: DatedFact,
  todayISO: string,
  thresholdDays: number = DEFAULT_STALENESS_DAYS,
): boolean {
  if (!isValidDate(fact.asOf) || !isValidDate(todayISO)) return false;
  return daysBetween(fact.asOf, todayISO) > thresholdDays;
}

export interface FreshnessReport {
  /** Facts missing a source and/or a valid asOf. */
  missing: DatedFact[];
  /** Complete facts whose asOf is past the staleness threshold. */
  stale: DatedFact[];
  /** Complete and fresh facts. */
  ok: DatedFact[];
}

/**
 * Classify every fact in `facts` against the source/as-of bar + staleness
 * threshold. The freshness test asserts `missing` is empty (a hard CI failure)
 * and surfaces `stale` for the recurring review cadence.
 */
export function sweepFreshness(
  facts: readonly DatedFact[],
  todayISO: string,
  thresholdDays: number = DEFAULT_STALENESS_DAYS,
): FreshnessReport {
  const missing: DatedFact[] = [];
  const stale: DatedFact[] = [];
  const ok: DatedFact[] = [];

  for (const fact of facts) {
    if (!isFreshnessComplete(fact)) {
      missing.push(fact);
    } else if (isStale(fact, todayISO, thresholdDays)) {
      stale.push(fact);
    } else {
      ok.push(fact);
    }
  }

  return { missing, stale, ok };
}
