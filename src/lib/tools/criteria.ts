/**
 * Needs-assessment / criteria worksheet (A7).
 *
 * A buyer consultation separates must-haves vs nice-to-haves vs deal-breakers so
 * the search stays disciplined and tours are scored against the buyer's OWN
 * criteria. This module is the PURE core: the typed buckets, the field catalog,
 * and `toScorecardRubric` — which maps the buyer's must/nice criteria into the
 * SHARED {@link ScorecardCriterion} shape the Tour Scorecard already consumes, so
 * the worksheet seeds the scorecard via a navigational hand-off (no cross-tool
 * storage mutation).
 *
 * Compliance (FHA — the big risk here, A7 is the highest FHA-leak P2 item):
 *  - Criteria are limited to OBJECTIVE, non-protected property/logistics
 *    attributes (beds/baths, commute, budget ceiling, condition, property type,
 *    timeline). The catalog NEVER offers demographic / "good schools as a steer"
 *    / "family-friendly" / safety proxies, and the tool only RECORDS the buyer's
 *    own objective filters — it never generates or recommends a criterion.
 *  - Any free-text the buyer types (custom criterion labels) is screened in the
 *    UI before it's persisted.
 *  - The budget ceiling stays THE BUYER'S number, never a recommended price (UPL).
 */

import type { ScorecardCriterion } from "@/lib/tools/tour-scorecard";

export type CriterionTier = "must" | "nice" | "deal-breaker";

export interface Criterion {
  id: string;
  /** Objective, property/logistics label. Free text is screened in the UI. */
  label: string;
  tier: CriterionTier;
}

/**
 * Suggested OBJECTIVE attributes the buyer can start from. These are property /
 * financial / logistics facts only — deliberately no neighborhood-desirability,
 * school-rating-as-value, "family-friendly", safety, or demographic proxies
 * (FHA). The buyer can add their own (screened) labels too.
 */
export interface SuggestedCriterion {
  id: string;
  label: string;
  /** Short, neutral helper. */
  hint?: string;
}

export const SUGGESTED_CRITERIA: readonly SuggestedCriterion[] = [
  { id: "beds", label: "Bedrooms", hint: "Minimum bedroom count you need" },
  { id: "baths", label: "Bathrooms", hint: "Minimum bathroom count" },
  {
    id: "commute",
    label: "Commute time",
    hint: "Drive/transit time to the places you go — a logistics fact",
  },
  {
    id: "budget-ceiling",
    label: "Budget ceiling",
    hint: "Your own maximum price — not a recommended offer",
  },
  {
    id: "condition",
    label: "Condition tolerance",
    hint: "Move-in ready vs. willing to renovate",
  },
  {
    id: "property-type",
    label: "Property type",
    hint: "Single-family, condo, townhome, etc.",
  },
  {
    id: "parking",
    label: "Parking / garage",
    hint: "Garage, off-street, or none",
  },
  {
    id: "outdoor",
    label: "Outdoor space",
    hint: "Yard, balcony, or none",
  },
  {
    id: "timeline",
    label: "Move-in timeline",
    hint: "When you need to be in",
  },
  {
    id: "single-level",
    label: "Single-level / accessibility",
    hint: "Stairs, step-free entry — a layout fact",
  },
] as const;

export interface CriteriaState {
  criteria: Criterion[];
}

/** Group the flat criteria list into the three tiers, preserving order. */
export function groupByTier(
  criteria: Criterion[],
): Record<CriterionTier, Criterion[]> {
  const groups: Record<CriterionTier, Criterion[]> = {
    must: [],
    nice: [],
    "deal-breaker": [],
  };
  for (const c of criteria) {
    if (c.tier in groups) groups[c.tier].push(c);
  }
  return groups;
}

/**
 * Map the buyer's worksheet into a Tour-Scorecard rubric (the SHARED
 * {@link ScorecardCriterion} shape). Must-haves weigh more than nice-to-haves so
 * the scorecard reflects what actually matters to the buyer.
 *
 * - Must-haves → weight 3.
 * - Nice-to-haves → weight 1.
 * - Deal-breakers are NOT rated rows (they're pass/fail, not 1–5), so they're
 *   excluded from the scored rubric — a deal-breaker isn't a gradient.
 * - Blank labels are skipped; an empty worksheet yields an empty (valid) rubric.
 */
export function toScorecardRubric(
  criteria: Criterion[],
): ScorecardCriterion[] {
  const rubric: ScorecardCriterion[] = [];
  for (const c of criteria) {
    if (c.tier === "deal-breaker") continue;
    const label = c.label.trim();
    if (!label) continue;
    rubric.push({
      id: c.id,
      label,
      weight: c.tier === "must" ? 3 : 1,
    });
  }
  return rubric;
}
