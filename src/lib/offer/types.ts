/**
 * The offer domain model for the Offer Creation Wizard.
 *
 * This captures the terms of a residential purchase offer as an EDITABLE
 * WORKSHEET — never a binding contract (see the UPL guardrail, issue #17). The
 * model is intentionally plain data so the term-sheet, deadline, and persistence
 * helpers can stay pure and fully unit-testable.
 *
 * See docs/research/offer-wizard-and-showings-research.md §1.1 for the anatomy
 * of a purchase offer this model is modeled on.
 */

import type { ContingencyId } from "./contingencies";

/** Loan/financing type the buyer plans to use. */
export type FinancingType = "conventional" | "fha" | "va" | "cash";

/**
 * Who the buyer is asking to cover closing costs. A worksheet preference only;
 * actual allocation varies by state custom and is negotiable.
 */
export type ClosingCostPreference = "buyer-pays" | "seller-credit" | "split";

/**
 * How the buyer wants to frame the commission-savings / seller-concession ask
 * (issue #14). Post-NAR the unpaid buyer-side commission can be asked for as a
 * price reduction or a closing-cost credit — it is never automatic.
 */
export type ConcessionType = "price-reduction" | "closing-credit" | "none";

/** State of a single contingency on the offer. */
export interface ContingencySelection {
  /** Whether the buyer is keeping this contingency in the offer. */
  included: boolean;
  /** Window in calendar days from the under-contract date. */
  days: number;
}

/** The commission-savings / seller-concession ask (issue #14). */
export interface ConcessionAsk {
  type: ConcessionType;
  /**
   * Percent of the purchase price the buyer is asking for (e.g. 2.5). Mirrors
   * the buyer-side commission that is now negotiable. Ignored when type is
   * "none".
   */
  percent: number;
}

export interface Offer {
  /** Purchase price in dollars. */
  price: number;
  /** Earnest money deposit amount — either a flat dollar figure or a percent. */
  earnestMoney: number;
  /** When true, `earnestMoney` is a percent of price; otherwise a dollar figure. */
  isPercent: boolean;
  financingType: FinancingType;
  /** Down payment as a percent of price (e.g. 10 for 10%). */
  downPaymentPercent: number;
  /** Target closing date (YYYY-MM-DD). */
  closingDate: string;
  /** Plain-English possession arrangement (e.g. "At closing"). */
  possession: string;
  /** Fixtures / personal property the buyer expects to convey. */
  fixturesIncluded: string;
  /** Items the buyer is explicitly excluding from the sale. */
  fixturesExcluded: string;
  closingCostPreference: ClosingCostPreference;
  /** Per-contingency selections (issue #13). Keyed by ContingencyId. */
  contingencies: Record<ContingencyId, ContingencySelection>;
  concession: ConcessionAsk;
  /** ISO timestamp of the last write; refreshed on every persisted change. */
  updatedAt: string;
}
