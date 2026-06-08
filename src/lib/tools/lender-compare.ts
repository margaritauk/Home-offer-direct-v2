/**
 * Lender comparison math (issue #96).
 *
 * The buyer transcribes quotes from their OWN Loan Estimates — rate, points,
 * lender fees, estimated monthly P&I, and APR — and this module normalizes them
 * into a single "total cost over N months" so the lowest *overall* deal stands
 * out, not just the lowest rate.
 *
 * GUARDRAIL (SAFE Act, #96): this is education, NOT lending advice, and it
 * NEVER generates or presents a rate as an offer. Every number here is
 * user-entered from a real Loan Estimate; this module only arithmetic on the
 * buyer's own inputs. The UI frames it as "compare your own quotes."
 */

export interface LenderQuote {
  id: string;
  /** Lender name as the buyer labels it. Facts only. */
  name: string;
  /** The loan amount the quote is for (drives points cost). */
  loanAmount: number;
  /** Interest rate as a percent (e.g. 6.5). Display only — informational. */
  ratePercent: number;
  /** Discount/origination points as a percent of the loan (e.g. 1 = 1 point). */
  points: number;
  /** Flat lender fees in dollars (origination, underwriting, etc.). */
  lenderFees: number;
  /** Estimated monthly principal & interest from the Loan Estimate. */
  monthlyPI: number;
  /** APR as a percent, from the Loan Estimate. Display only. */
  aprPercent: number;
}

export interface LenderCostResult extends LenderQuote {
  /** Dollar cost of points = loanAmount × points%. */
  pointsCost: number;
  /** Upfront cost = pointsCost + lenderFees. */
  upfrontCost: number;
  /** monthlyPI × horizon months. */
  paymentsOverHorizon: number;
  /** upfrontCost + paymentsOverHorizon. The comparison metric. */
  totalCost: number;
  /** True when this row is the lowest total cost over the horizon. */
  isLowest: boolean;
}

function num(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function months(horizon: number): number {
  return Number.isFinite(horizon) && horizon > 0 ? Math.floor(horizon) : 0;
}

/**
 * Compute one quote's total cost over a horizon (in months): upfront points +
 * lender fees, plus monthly P&I × months. Pure arithmetic on user inputs.
 */
export function lenderTotalCost(
  quote: LenderQuote,
  horizonMonths: number,
): Omit<LenderCostResult, "isLowest"> {
  const pointsCost = num(quote.loanAmount) * (num(quote.points) / 100);
  const upfrontCost = pointsCost + num(quote.lenderFees);
  const paymentsOverHorizon = num(quote.monthlyPI) * months(horizonMonths);
  const totalCost = upfrontCost + paymentsOverHorizon;
  return {
    ...quote,
    pointsCost,
    upfrontCost,
    paymentsOverHorizon,
    totalCost,
  };
}

/**
 * Compare all quotes over the horizon and flag the lowest total cost. Returns
 * the rows in their input order (the UI renders a stable table); `isLowest`
 * marks the cheapest. With no quotes, returns an empty list. Ties: the first
 * quote at the minimum is flagged.
 */
export function compareLenders(
  quotes: LenderQuote[],
  horizonMonths: number,
): LenderCostResult[] {
  const rows = quotes.map((q) => lenderTotalCost(q, horizonMonths));
  if (rows.length === 0) return [];

  let lowestId: string | null = null;
  let lowest = Number.POSITIVE_INFINITY;
  for (const r of rows) {
    if (r.totalCost < lowest) {
      lowest = r.totalCost;
      lowestId = r.id;
    }
  }

  return rows.map((r) => ({ ...r, isLowest: r.id === lowestId }));
}
