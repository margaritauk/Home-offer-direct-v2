/**
 * Savings + cash-to-close math for the unrepresented buyer.
 *
 * The core thesis (see docs/research/market-research.md): the buyer-side
 * commission (~2.5% of price) is no longer automatically yours — post the 2024
 * NAR settlement it's negotiated deal-by-deal. You only capture it if you get it
 * as a price reduction or a closing-cost credit. These pure functions quantify
 * that so the UI can make it tangible.
 */

export interface SavingsInput {
  /** Agreed/asking home price in dollars. */
  homePrice: number;
  /** Down payment as a percentage of price (e.g. 10 for 10%). */
  downPaymentPercent: number;
  /**
   * Buyer-side commission rate you're negotiating to capture, as a percent of
   * price (national avg ~2.5%). This is the amount potentially on the table.
   */
  buyerCommissionPercent: number;
  /**
   * Share of that commission you actually negotiate into a price cut or credit,
   * as a percent (0–100). 100 = you capture all of it; 0 = seller keeps it.
   */
  captureRatePercent: number;
  /** Estimated buyer closing costs as a percent of price (typically 2–5%). */
  closingCostPercent: number;
}

export interface SavingsResult {
  /** Total buyer-side commission that is theoretically negotiable, in dollars. */
  negotiableCommission: number;
  /** Dollars you actually capture given the capture rate. */
  capturedSavings: number;
  /** Down payment in dollars. */
  downPayment: number;
  /** Loan amount (price minus down payment). */
  loanAmount: number;
  /** Estimated closing costs in dollars. */
  closingCosts: number;
  /**
   * Cash needed at closing BEFORE applying captured savings:
   * down payment + closing costs.
   */
  cashToCloseBefore: number;
  /** Cash needed at closing AFTER applying captured savings as a credit. */
  cashToCloseAfter: number;
}

function clampPercent(n: number): number {
  if (Number.isNaN(n) || n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

function safePrice(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function calculateSavings(input: SavingsInput): SavingsResult {
  const homePrice = safePrice(input.homePrice);
  const downPct = clampPercent(input.downPaymentPercent);
  const commissionPct = clampPercent(input.buyerCommissionPercent);
  const capturePct = clampPercent(input.captureRatePercent);
  const closingPct = clampPercent(input.closingCostPercent);

  const downPayment = homePrice * (downPct / 100);
  const loanAmount = homePrice - downPayment;
  const closingCosts = homePrice * (closingPct / 100);

  const negotiableCommission = homePrice * (commissionPct / 100);
  const capturedSavings = negotiableCommission * (capturePct / 100);

  const cashToCloseBefore = downPayment + closingCosts;
  // Captured savings can't reduce cash-to-close below zero.
  const cashToCloseAfter = Math.max(0, cashToCloseBefore - capturedSavings);

  return {
    negotiableCommission,
    capturedSavings,
    downPayment,
    loanAmount,
    closingCosts,
    cashToCloseBefore,
    cashToCloseAfter,
  };
}

export function formatUSD(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}
