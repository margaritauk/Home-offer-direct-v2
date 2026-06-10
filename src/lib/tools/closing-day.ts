/**
 * Closing-day checklist + cash-to-close math (issue #121, Wave C / C3).
 *
 * Two pieces, both deliberately simple + pure so the UI stays thin and the
 * math is fully unit-testable:
 *  - `STANDARD_CLOSING_DAY_ITEMS`: the standard "bring this / do this" checklist
 *    a self-serve buyer works on closing day.
 *  - `cashToClose`: the at-the-table cash figure = down payment + closing costs
 *    − lender credit − seller credit − earnest money already paid.
 *
 * GUARDRAIL (#121): this is EDUCATION + an ESTIMATE, not the official figure.
 * The buyer's closer/lender produces the authoritative cash-to-close on the
 * Closing Disclosure; the UI labels it as such. e-signature / RON is OUT OF
 * SCOPE here (gated to #45/#46) — there is no signing logic in this module.
 */

/**
 * The standard closing-day checklist. Stable ids so a buyer's checked state
 * survives label edits / future additions (matched by id in the UI).
 */
export const STANDARD_CLOSING_DAY_ITEMS = [
  {
    id: "photo-id",
    label:
      "Bring a current, unexpired government photo ID (e.g. driver's license or passport) for every buyer signing.",
  },
  {
    id: "funds",
    label:
      "Bring certified / cashier's funds — or complete your wire in advance, verifying the instructions by phone first on an independently confirmed number.",
  },
  {
    id: "insurance",
    label:
      "Bring proof of homeowner's insurance; the first year's premium is often paid at or before closing.",
  },
  {
    id: "walkthrough",
    label:
      "Complete your final walkthrough before you sit down to sign, and confirm any negotiated repairs were done.",
  },
  {
    id: "contract",
    label: "Bring your signed contract plus any addenda or amendments.",
  },
  {
    id: "reread-cd",
    label:
      "Re-read your Closing Disclosure and compare the final figures against what you reviewed earlier.",
  },
  {
    id: "questions",
    label:
      "Bring a written list of questions for the closer so nothing gets glossed over at the table.",
  },
  {
    id: "no-new-credit",
    label:
      "Don't open new credit or make big purchases before closing — it can change your loan approval.",
  },
] as const satisfies readonly { id: string; label: string }[];

/** Inputs to `cashToClose`, all in dollars. */
export interface CashToCloseInput {
  /** Down payment due at closing. */
  downPayment: number;
  /** Buyer closing costs (lender, title, escrow, prepaids, etc.). */
  closingCosts: number;
  /** Lender credit reducing what you owe (a credit, so subtracted). */
  lenderCredit: number;
  /** Seller credit / concession reducing what you owe (subtracted). */
  sellerCredit: number;
  /** Earnest money you've already deposited (subtracted — already paid). */
  earnestMoneyPaid: number;
}

/** Result of `cashToClose`: the total plus the normalized line items echoed. */
export interface CashToCloseResult extends CashToCloseInput {
  /**
   * Estimated cash due at the table, floored at 0:
   * downPayment + closingCosts − lenderCredit − sellerCredit − earnestMoneyPaid.
   */
  total: number;
}

/**
 * Coerce a money input to a safe, non-negative, finite number. Non-finite
 * (NaN/Infinity) and negative inputs are treated as 0 — defensive against bad
 * UI state without surprising the buyer with negative line items.
 */
function money(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Compute the estimated cash-to-close. PURE — no React, no storage.
 *
 * Every line item is normalized via `money()` (non-finite/negative → 0) and
 * echoed back so the UI can render the exact breakdown that produced the total.
 * The total is floored at 0: credits + earnest money exceeding the gross can't
 * produce a negative "you owe" figure (any overage is settled separately).
 */
export function cashToClose(input: CashToCloseInput): CashToCloseResult {
  const downPayment = money(input.downPayment);
  const closingCosts = money(input.closingCosts);
  const lenderCredit = money(input.lenderCredit);
  const sellerCredit = money(input.sellerCredit);
  const earnestMoneyPaid = money(input.earnestMoneyPaid);

  const total = Math.max(
    0,
    downPayment +
      closingCosts -
      lenderCredit -
      sellerCredit -
      earnestMoneyPaid,
  );

  return {
    downPayment,
    closingCosts,
    lenderCredit,
    sellerCredit,
    earnestMoneyPaid,
    total,
  };
}
