/**
 * Domain sanity nudges (issue #151, Sprint A3) — "looks unusually high/low"
 * checks for the budget and savings calculators.
 *
 * These are pure, defensive guards that look at a tool's inputs and surface a
 * short "double-check this" note when a value lands outside a plausible range.
 *
 * HARD GUARDRAIL: EDUCATION, never advice (estimates-not-advice). Every message
 * is framed as "double-check" / "treat as best case" — never "you should". We
 * only ever flag a value as worth re-confirming; we never recommend a number.
 *
 * No I/O, no React, no network. Returns `[]` for clean inputs.
 */

import type { PitiInput, AffordabilityInput } from "../budget";
import type { SavingsInput } from "../savings";

/** Tone vocabulary reused from the budget explainer / INSIGHT_TONES styling. */
export type SanityTone = "info" | "good" | "watch";

export interface SanityNote {
  id: string;
  tone: SanityTone;
  message: string;
}

// ---------------------------------------------------------------------------
// Thresholds (documented; shared so tests can reference the intent)
// ---------------------------------------------------------------------------

/** PMI annual rate above this (%) is unusually high — real rates run ~0.46–1.5%. */
const PMI_RATE_MAX_PCT = 2;
/** Property tax above this share of price/yr is unusually high (effective rates ~0.3–2.5%). */
const PROP_TAX_PRICE_SHARE_MAX = 0.05; // 5% of price per year
/** Plausible mortgage interest-rate band; outside this is worth a double-check. */
const RATE_MIN_PCT = 2;
const RATE_MAX_PCT = 9;
/** Down payment at/above 100% of price means a cash purchase / no loan. */
const DOWN_PCT_FULL = 100;

/** Buyer-side commission above this (%) is above the typical ~2.5–3% band. */
const BUYER_COMMISSION_MAX_PCT = 3.5;
/** Plausible buyer closing-cost band (% of price). */
const CLOSING_COST_MIN_PCT = 2;
const CLOSING_COST_MAX_PCT = 5;
/** Capture rate at this value (%) is the best-case ceiling. */
const CAPTURE_RATE_FULL_PCT = 100;

function isNum(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

// ---------------------------------------------------------------------------
// Budget sanity
// ---------------------------------------------------------------------------

/**
 * Sanity-check a budget calculator's inputs.
 *
 * In payment mode the down payment is a percent (`piti.downPct`) and property
 * tax is annual dollars (`piti.propTaxYr`). In affordability mode the down
 * payment is fixed dollars and property tax is a rate — pass those via the
 * optional `affordability` arg so we compare like-for-like.
 *
 * Every note is a "watch" — a thing worth re-confirming, never a recommendation.
 */
export function budgetSanity(
  piti: PitiInput,
  affordability?: AffordabilityInput,
): SanityNote[] {
  const notes: SanityNote[] = [];

  // 1) Down payment ≥ price (no loan / data-entry slip).
  if (affordability) {
    // Affordability mode: down payment is fixed dollars. Flag when it meets or
    // exceeds a plausible price. We don't know the solved price here, so use the
    // raw home price the payment side carries as the comparison anchor when it's
    // positive; otherwise fall back to flagging only the percent path below.
    const price = isNum(piti.price) ? piti.price : 0;
    if (price > 0 && isNum(affordability.downPayment) && affordability.downPayment >= price) {
      notes.push({
        id: "down-ge-price",
        tone: "watch",
        message:
          "Your down payment is as large as the home price — double-check it, since that would mean buying with no loan.",
      });
    }
  } else if (isNum(piti.downPct) && piti.downPct >= DOWN_PCT_FULL) {
    notes.push({
      id: "down-ge-price",
      tone: "watch",
      message:
        "A 100% down payment means an all-cash purchase with no loan — double-check that's what you intended.",
    });
  }

  // 2) PMI rate above ~2%/yr is unusually high (typical ~0.46–1.5%).
  if (isNum(piti.pmiRatePct) && piti.pmiRatePct > PMI_RATE_MAX_PCT) {
    notes.push({
      id: "pmi-high",
      tone: "watch",
      message:
        "That PMI rate looks unusually high — double-check it, since most conventional PMI runs around 0.5–1.5% a year.",
    });
  }

  // 3) Property tax above ~5% of price per year is unusually high.
  if (affordability) {
    // Affordability mode carries a tax RATE directly.
    if (
      isNum(affordability.propTaxRatePct) &&
      affordability.propTaxRatePct / 100 > PROP_TAX_PRICE_SHARE_MAX
    ) {
      notes.push({
        id: "tax-high",
        tone: "watch",
        message:
          "That property-tax rate looks unusually high — double-check it, since most areas land well under 5% of price a year.",
      });
    }
  } else if (
    isNum(piti.price) &&
    piti.price > 0 &&
    isNum(piti.propTaxYr) &&
    piti.propTaxYr / piti.price > PROP_TAX_PRICE_SHARE_MAX
  ) {
    notes.push({
      id: "tax-high",
      tone: "watch",
      message:
        "Your property tax is more than 5% of the home price per year — double-check it, since that's unusually high for most areas.",
    });
  }

  // 4) Interest rate outside a plausible 2–9% band (too low or too high).
  // In affordability mode the rate lives on the affordability input; in payment
  // mode it lives on the piti input. Prefer the mode's own source.
  const ratePct = affordability && isNum(affordability.ratePct)
    ? affordability.ratePct
    : piti.ratePct;
  if (isNum(ratePct) && (ratePct < RATE_MIN_PCT || ratePct > RATE_MAX_PCT)) {
    notes.push({
      id: "rate-band",
      tone: "watch",
      message:
        ratePct < RATE_MIN_PCT
          ? "That interest rate looks unusually low — double-check it against a current rate quote."
          : "That interest rate looks unusually high — double-check it against a current rate quote.",
    });
  }

  return notes;
}

// ---------------------------------------------------------------------------
// Savings sanity
// ---------------------------------------------------------------------------

/**
 * Sanity-check the savings calculator's inputs. Notes are framed as best-case /
 * double-check, never advice.
 */
export function savingsSanity(input: SavingsInput): SanityNote[] {
  const notes: SanityNote[] = [];

  // 1) Capturing 100% of the buyer-side commission is a best case, not a default.
  if (isNum(input.captureRatePercent) && input.captureRatePercent >= CAPTURE_RATE_FULL_PCT) {
    notes.push({
      id: "capture-full",
      tone: "watch",
      message:
        "Sellers rarely concede the full buyer-side commission — treat this as a best case.",
    });
  }

  // 2) Buyer-side commission above ~3.5% is above the typical band.
  if (isNum(input.buyerCommissionPercent) && input.buyerCommissionPercent > BUYER_COMMISSION_MAX_PCT) {
    notes.push({
      id: "commission-high",
      tone: "watch",
      message:
        "That's above the typical ~2.5–3% buyer-side commission — double-check the number on the table.",
    });
  }

  // 3) Closing costs outside ~2–5% of price are worth a second look.
  if (
    isNum(input.closingCostPercent) &&
    (input.closingCostPercent < CLOSING_COST_MIN_PCT ||
      input.closingCostPercent > CLOSING_COST_MAX_PCT)
  ) {
    notes.push({
      id: "closing-band",
      tone: "watch",
      message:
        input.closingCostPercent < CLOSING_COST_MIN_PCT
          ? "Buyer closing costs usually run about 2–5% of price — this looks low, so double-check it."
          : "Buyer closing costs usually run about 2–5% of price — this looks high, so double-check it.",
    });
  }

  return notes;
}
