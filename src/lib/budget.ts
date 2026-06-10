/**
 * Pure budget / affordability math engine for the Budget Wizard.
 *
 * This is the single source of truth for the monthly-payment (PITI), DTI, and
 * "how much house can I afford" math that the interactive calculator, the Excel
 * export, and the AI grounding layer all share. See
 * docs/research/budget-wizard-research.md (Area 1).
 *
 * HARD GUARDRAIL: the AI layer (#57) NEVER computes — all arithmetic lives here
 * in deterministic, pure functions (no I/O, no React, no network). These produce
 * ESTIMATES for education only, not financial/lending advice.
 *
 * Conventions mirror src/lib/savings.ts: defensive math, percentages passed as
 * whole numbers (e.g. 28 for 28%), dollars otherwise.
 */

// ---------------------------------------------------------------------------
// Named constants (exported so UI and tests share them)
// ---------------------------------------------------------------------------

/**
 * Default annual PMI rate as a percent of the loan amount (~0.5%/yr is a
 * mid-range conventional estimate; real rates run ~0.46%–1.5% by credit score).
 */
export const DEFAULT_PMI_RATE_PCT = 0.5;

/** LTV (loan-to-value, %) above which PMI applies, i.e. down payment < 20%. */
export const PMI_LTV_THRESHOLD_PCT = 80;

/** Standard conventional front-end (housing) DTI cap, as a percent of income. */
export const DEFAULT_FRONT_CAP_PCT = 28;

/** Standard conventional back-end (total debt) DTI cap, as a percent of income. */
export const DEFAULT_BACK_CAP_PCT = 36;

/** Allowed higher back-end DTI cap (common Qualified-Mortgage ceiling). */
export const HIGH_BACK_CAP_PCT = 43;

// ---------------------------------------------------------------------------
// Defensive helpers (same spirit as savings.ts)
// ---------------------------------------------------------------------------

/** Clamp a percentage into [0, 100]; non-finite/NaN/negative → 0. */
function clampPercent(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

/** A finite, non-negative number or 0. */
function safeNonNegative(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// ---------------------------------------------------------------------------
// #52 — core engine
// ---------------------------------------------------------------------------

/**
 * Standard fully-amortized monthly principal + interest payment.
 *
 *   M = P · r · (1 + r)^n / ((1 + r)^n − 1)
 *
 * where r = monthly rate (annualRatePct / 12 / 100), n = termMonths.
 *
 * Guardrails:
 * - annualRatePct === 0 (or any non-positive rate) → straight-line P/n.
 * - non-positive principal or term → 0.
 *
 * @param principal      Loan amount in dollars.
 * @param annualRatePct  Annual interest rate as a percent (e.g. 6 for 6%).
 * @param termMonths     Total number of monthly payments (e.g. 360 for 30yr).
 */
export function monthlyPI(
  principal: number,
  annualRatePct: number,
  termMonths: number,
): number {
  const p = safeNonNegative(principal);
  const n = safeNonNegative(termMonths);
  if (p === 0 || n === 0) return 0;

  // Zero (or invalid/negative) rate → no interest, straight-line payoff.
  if (!Number.isFinite(annualRatePct) || annualRatePct <= 0) {
    return p / n;
  }

  const r = annualRatePct / 12 / 100;
  const pow = Math.pow(1 + r, n);
  return (p * r * pow) / (pow - 1);
}

/** Inputs to {@link monthlyPITI}. Percentages are whole numbers; rest are dollars. */
export interface PitiInput {
  /** Home price in dollars. */
  price: number;
  /** Down payment as a percent of price (e.g. 20 for 20%). */
  downPct: number;
  /** Annual interest rate as a percent (e.g. 6 for 6%). */
  ratePct: number;
  /** Loan term in years (e.g. 30). */
  termYears: number;
  /** Annual property tax in dollars. */
  propTaxYr: number;
  /** Annual homeowners insurance in dollars. */
  insuranceYr: number;
  /** Monthly HOA dues in dollars. */
  hoaMo: number;
  /** Annual PMI rate as a percent of the loan amount (e.g. 0.5 for 0.5%). */
  pmiRatePct: number;
}

/** Stacked monthly payment breakdown plus loan facts. All dollars except ltv (%). */
export interface PitiBreakdown {
  /** Monthly principal + interest. */
  pi: number;
  /** Monthly property tax. */
  tax: number;
  /** Monthly homeowners insurance. */
  insurance: number;
  /** Monthly HOA dues. */
  hoa: number;
  /** Monthly PMI (0 when down payment ≥ 20% / LTV ≤ 80%). */
  pmi: number;
  /** Sum of all of the above — the full monthly PITI(+PMI+HOA) figure. */
  total: number;
  /** Loan amount in dollars (price − down payment). */
  loanAmount: number;
  /** Loan-to-value ratio as a percent (loanAmount / price * 100). */
  ltv: number;
}

/**
 * Full monthly PITI breakdown (Principal, Interest, Taxes, Insurance) plus PMI
 * and HOA.
 *
 * PMI is auto-added when the down payment is < 20% (i.e. LTV > 80%) and dropped
 * to 0 once the down payment reaches 20% (LTV ≤ 80%):
 *   pmi = loanAmount * (pmiRatePct / 100) / 12   when LTV > 80%, else 0.
 */
export function monthlyPITI(input: PitiInput): PitiBreakdown {
  const price = safeNonNegative(input.price);
  const downPct = clampPercent(input.downPct);
  const termMonths = safeNonNegative(input.termYears) * 12;

  const loanAmount = price * (1 - downPct / 100);
  const ltv = price > 0 ? (loanAmount / price) * 100 : 0;

  const pi = monthlyPI(loanAmount, input.ratePct, termMonths);
  const tax = safeNonNegative(input.propTaxYr) / 12;
  const insurance = safeNonNegative(input.insuranceYr) / 12;
  const hoa = safeNonNegative(input.hoaMo);

  // PMI applies only while LTV exceeds the 80% threshold (down payment < 20%).
  // It is dropped to 0 once down ≥ 20%.
  const pmi =
    ltv > PMI_LTV_THRESHOLD_PCT
      ? (loanAmount * (safeNonNegative(input.pmiRatePct) / 100)) / 12
      : 0;

  const total = pi + tax + insurance + hoa + pmi;

  return { pi, tax, insurance, hoa, pmi, total, loanAmount, ltv };
}

// ---------------------------------------------------------------------------
// DTI helpers
//
// Ratios are returned as FRACTIONS (e.g. 0.28 means 28%), not percentages.
// Divide-by-zero (gross income ≤ 0) returns 0 — chosen over Infinity so callers
// can render/compare a finite value safely (an income of 0 means "no budget",
// which 0 represents cleanly here).
// ---------------------------------------------------------------------------

/**
 * Front-end (housing) DTI ratio = housing payment / gross monthly income.
 * @returns a fraction (e.g. 0.28). 0 if income ≤ 0.
 */
export function frontEndRatio(
  housingMonthly: number,
  grossMonthlyIncome: number,
): number {
  const income = safeNonNegative(grossMonthlyIncome);
  if (income === 0) return 0;
  return safeNonNegative(housingMonthly) / income;
}

/**
 * Back-end (total debt) DTI ratio = (housing + other debts) / gross income.
 * @returns a fraction (e.g. 0.36). 0 if income ≤ 0.
 */
export function backEndRatio(
  housingMonthly: number,
  otherDebtsMonthly: number,
  grossMonthlyIncome: number,
): number {
  const income = safeNonNegative(grossMonthlyIncome);
  if (income === 0) return 0;
  return (
    (safeNonNegative(housingMonthly) + safeNonNegative(otherDebtsMonthly)) /
    income
  );
}

// ---------------------------------------------------------------------------
// #53 — affordability solver ("how much house can I afford")
// ---------------------------------------------------------------------------

/** Inputs to {@link maxAffordablePrice}. Percentages whole; rest dollars. */
export interface AffordabilityInput {
  /** Gross monthly income in dollars. */
  grossMonthlyIncome: number;
  /** Existing monthly debt payments (cars, cards, student loans) in dollars. */
  monthlyDebts: number;
  /** Down payment in DOLLARS (fixed cash the buyer brings). */
  downPayment: number;
  /** Annual interest rate as a percent (e.g. 6 for 6%). */
  ratePct: number;
  /** Loan term in years (e.g. 30). */
  termYears: number;
  /** Property tax rate as a percent of price PER YEAR (e.g. 1.1 for 1.1%/yr). */
  propTaxRatePct: number;
  /** Annual homeowners insurance in dollars. */
  insuranceYr: number;
  /** Monthly HOA dues in dollars. */
  hoaMo: number;
  /** Annual PMI rate as a percent of the loan amount (e.g. 0.5). */
  pmiRatePct: number;
  /** Front-end (housing) DTI cap as a percent. Default 28. */
  frontCapPct?: number;
  /** Back-end (total debt) DTI cap as a percent. Default 36 (43 allowed). */
  backCapPct?: number;
}

/** Result of the affordability solve. */
export interface AffordabilityResult {
  /** Max affordable home price in dollars. */
  maxPrice: number;
  /** Max loan amount = maxPrice − downPayment, floored at 0. */
  maxLoan: number;
  /** Which DTI cap binds: "front" if the front cap is the lower, else "back". */
  bindingConstraint: "front" | "back";
  /** Full PITI breakdown at the solved price. */
  piti: PitiBreakdown;
}

/** Upper bound for the binary search on price (dollars). */
const PRICE_SEARCH_CEILING = 50_000_000;
/** Iterations for the binary search (~50 converges to well under a dollar). */
const PRICE_SEARCH_ITERATIONS = 60;

/**
 * Solve for the maximum affordable home price.
 *
 * Approach:
 * 1. Housing-payment cap = min(frontCap·income, backCap·income − debts). The
 *    "front" side binds when frontCap·income is the lower; otherwise "back".
 * 2. Because the full PITI (taxes & insurance scale with price, PMI depends on
 *    LTV which depends on the price-relative down payment) is monotonically
 *    increasing in price, we BINARY-SEARCH price in [0, ceiling]. At each step
 *    we compute the real PITI via monthlyPITI — deriving downPct from the fixed
 *    downPayment dollars (downPct = downPayment/price * 100) — and keep the
 *    largest price whose PITI fits the cap. This is deterministic and avoids the
 *    fragile closed-form circularity of inverting amortization while taxes/PMI
 *    also move with price.
 *
 * Edge cases: income ≤ 0 → maxPrice 0; cap ≤ 0 (debts exceed the back cap) →
 * maxPrice 0.
 */
export function maxAffordablePrice(
  input: AffordabilityInput,
): AffordabilityResult {
  const income = safeNonNegative(input.grossMonthlyIncome);
  const debts = safeNonNegative(input.monthlyDebts);
  const downPayment = safeNonNegative(input.downPayment);
  const frontCapPct = clampPercent(input.frontCapPct ?? DEFAULT_FRONT_CAP_PCT);
  const backCapPct = clampPercent(input.backCapPct ?? DEFAULT_BACK_CAP_PCT);

  const frontCapDollars = (frontCapPct / 100) * income;
  const backCapDollars = (backCapPct / 100) * income - debts;

  // Binding constraint: "front" when the front cap is the lower (or equal) side.
  const bindingConstraint: "front" | "back" =
    frontCapDollars <= backCapDollars ? "front" : "back";

  // The housing payment cap is the lower of the two (and never negative).
  const housingCap = Math.min(frontCapDollars, backCapDollars);

  // Build a PITI breakdown for a candidate price using the FIXED down-payment
  // dollars (converted to a percent of that price; capped at 100%).
  const pitiAt = (price: number): PitiBreakdown => {
    const downPct = price > 0 ? Math.min(100, (downPayment / price) * 100) : 100;
    return monthlyPITI({
      price,
      downPct,
      ratePct: input.ratePct,
      termYears: input.termYears,
      propTaxYr: price * (safeNonNegative(input.propTaxRatePct) / 100),
      insuranceYr: input.insuranceYr,
      hoaMo: input.hoaMo,
      pmiRatePct: input.pmiRatePct,
    });
  };

  // No budget at all → price 0.
  if (income === 0 || housingCap <= 0) {
    return {
      maxPrice: 0,
      maxLoan: 0,
      bindingConstraint,
      piti: pitiAt(0),
    };
  }

  // Binary search for the largest price whose PITI total fits the housing cap.
  let lo = 0;
  let hi = PRICE_SEARCH_CEILING;
  for (let i = 0; i < PRICE_SEARCH_ITERATIONS; i++) {
    const mid = (lo + hi) / 2;
    if (pitiAt(mid).total <= housingCap) {
      lo = mid; // affordable — push the floor up
    } else {
      hi = mid; // too expensive — pull the ceiling down
    }
  }

  // lo is the largest known-affordable price; round to whole dollars.
  const maxPrice = Math.floor(lo);
  const maxLoan = Math.max(0, maxPrice - downPayment);

  return {
    maxPrice,
    maxLoan,
    bindingConstraint,
    piti: pitiAt(maxPrice),
  };
}
