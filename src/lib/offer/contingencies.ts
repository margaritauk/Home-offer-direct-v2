/**
 * The five standard purchase-offer contingencies (issue #13).
 *
 * Each entry is purely EDUCATIONAL: what the contingency protects, its typical
 * window, and the risk of waiving it. Per the UPL guardrail (#17) we describe
 * trade-offs only — we never recommend WHICH contingencies a buyer should
 * include or waive.
 *
 * See docs/research/offer-wizard-and-showings-research.md §1.1 / §1.3.
 */

export type ContingencyId =
  | "inspection"
  | "appraisal"
  | "financing"
  | "sale-of-home"
  | "title";

export interface ContingencyInfo {
  id: ContingencyId;
  label: string;
  /** What this contingency protects you from. */
  protects: string;
  /** A common window for this contingency, for context only. */
  typicalWindow: string;
  /** The neutral, non-advisory description of what waiving it risks. */
  riskOfWaiving: string;
  /** Default window in calendar days from the under-contract date. */
  defaultDays: number;
}

export const CONTINGENCIES: ContingencyInfo[] = [
  {
    id: "inspection",
    label: "Inspection contingency",
    protects:
      "Lets you have the home professionally inspected and renegotiate, request repairs, or walk away (recovering your earnest money) if material defects turn up.",
    typicalWindow: "Often 7–14 days from acceptance.",
    riskOfWaiving:
      "Waiving it means accepting the home's condition sight-unseen by a pro — undiscovered defects become your problem with no contractual remedy.",
    defaultDays: 10,
  },
  {
    id: "appraisal",
    label: "Appraisal contingency",
    protects:
      "Protects you if the home appraises below the contract price; lenders finance to the appraised value, not your higher offer.",
    typicalWindow: "Often 14–21 days from acceptance.",
    riskOfWaiving:
      "Waiving it means you commit to covering any gap between the appraised value and the price in cash, however large it turns out to be.",
    defaultDays: 17,
  },
  {
    id: "financing",
    label: "Financing contingency",
    protects:
      "Protects your earnest money if your mortgage falls through and you can't secure the loan you planned on.",
    typicalWindow: "Often 17–21 days from acceptance.",
    riskOfWaiving:
      "Waiving it means you risk forfeiting your earnest money if your loan is denied after you're under contract.",
    defaultDays: 21,
  },
  {
    id: "sale-of-home",
    label: "Sale-of-home contingency",
    protects:
      "Conditions your purchase on first selling your current home, so you're not committed to two mortgages.",
    typicalWindow: "Varies widely; often 30–60 days.",
    riskOfWaiving:
      "Including it can weaken your offer competitively; leaving it out means you're committed even if your current home hasn't sold.",
    defaultDays: 45,
  },
  {
    id: "title",
    label: "Title contingency",
    protects:
      "Ensures the seller can deliver clear, marketable title and lets you raise objections to liens or defects found in the title commitment.",
    typicalWindow: "Often 10–14 days from acceptance.",
    riskOfWaiving:
      "Waiving it means accepting whatever title issues exist without a contractual path to object before closing.",
    defaultDays: 14,
  },
];

/** Look up a single contingency's educational info by id. */
export function getContingency(id: ContingencyId): ContingencyInfo | undefined {
  return CONTINGENCIES.find((c) => c.id === id);
}

/** Map of contingency id -> default days, handy for building default offers. */
export function defaultContingencyDays(): Record<ContingencyId, number> {
  return CONTINGENCIES.reduce(
    (acc, c) => {
      acc[c.id] = c.defaultDays;
      return acc;
    },
    {} as Record<ContingencyId, number>,
  );
}
