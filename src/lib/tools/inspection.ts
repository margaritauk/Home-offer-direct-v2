/**
 * Inspection findings logger + scheduler math (issue #105).
 *
 * After the home inspection the buyer logs each finding with a severity, an
 * estimated repair cost, and what they want to do about it. This module rolls
 * the findings up into counts by severity and a total estimated cost, and flags
 * the safety/major items that deserve attention.
 *
 * IMPORTANT (guardrail, #105): this is NOT a substitute for a licensed
 * inspector. Severity and cost are the buyer's own estimates; the UI labels it
 * as decision-support, facts only.
 *
 * It is also the upstream source for the repair-request builder (#106), which
 * reads the same `hod:tool:inspection:v1` storage key.
 */

export type Severity = "minor" | "moderate" | "major" | "safety";

export const SEVERITIES: readonly Severity[] = [
  "minor",
  "moderate",
  "major",
  "safety",
] as const;

export type FindingDecision =
  | "request-repair"
  | "request-credit"
  | "accept"
  | "consider-walking";

export interface Finding {
  id: string;
  /** The item/system inspected (e.g. "Roof", "Water heater"). Facts only. */
  item: string;
  severity: Severity;
  /** Buyer's estimated cost to address, in dollars. */
  estCost: number;
  decision: FindingDecision;
  /** Free-text notes — screened for protected-class signals in the UI. */
  notes?: string;
}

export interface FindingsSummary {
  /** Total number of findings logged. */
  total: number;
  /** Count of findings at each severity. */
  countsBySeverity: Record<Severity, number>;
  /** Sum of estimated costs across all findings (invalid costs treated as 0). */
  totalEstCost: number;
  /** True when at least one major or safety finding exists. */
  hasMajorOrSafety: boolean;
  /** Count of major + safety findings (the ones to flag). */
  flaggedCount: number;
}

function safeCost(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Roll up findings into counts by severity and a total estimated cost, and flag
 * whether any major/safety items are present. Pure — returns zeroed counts for
 * an empty list rather than throwing, so the UI can show an empty state.
 */
export function summarizeFindings(findings: Finding[]): FindingsSummary {
  const countsBySeverity: Record<Severity, number> = {
    minor: 0,
    moderate: 0,
    major: 0,
    safety: 0,
  };

  let totalEstCost = 0;
  for (const f of findings) {
    if (SEVERITIES.includes(f.severity)) countsBySeverity[f.severity] += 1;
    totalEstCost += safeCost(f.estCost);
  }

  const flaggedCount = countsBySeverity.major + countsBySeverity.safety;

  return {
    total: findings.length,
    countsBySeverity,
    totalEstCost,
    hasMajorOrSafety: flaggedCount > 0,
    flaggedCount,
  };
}
