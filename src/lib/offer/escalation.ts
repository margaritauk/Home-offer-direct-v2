/**
 * Escalation-clause modeler (A3).
 *
 * PURE. Given the buyer's OWN numbers — their base offer, the beat-by increment,
 * their cap, and an ASSUMED competing offer — it computes the price the clause
 * would resolve to and surfaces the cap/risk. No React/IO.
 *
 * HARD UPL RULE: this models the arithmetic of the buyer's own inputs. It NEVER
 * suggests a cap, an increment, or any figure, and it never tells the buyer to
 * use an escalation clause. Drafting the clause is the practice of law — the UI
 * routes that to an attorney. Escalation clauses are disfavored/restricted in
 * some markets (e.g. TX: attorney-drafted/TREC-restricted; NC: NCREC
 * discourages), typically require proof of the competing offer, and any amount
 * above appraised value is non-financeable cash.
 *
 * Resulting price = min(competingOffer + increment, cap), floored at the base
 * (a competing offer at/below the base triggers no escalation).
 *
 * Sources (see docs/backlog/contributions/researcher.md, 2026-06-12):
 *  - Escalation legal-but-not-uniformly-endorsed; seller may reject — UpCounsel /
 *    Redfin (2026).
 *  - TX TREC-restricted/attorney-drafted — Texas REALTORS / Spyglass (2026).
 *  - NC NCREC discourages — NCREC bulletin (2026).
 */

export interface EscalationInputs {
  /** The buyer's starting (base) offer, in dollars. */
  base: number;
  /** The amount the buyer will beat a competing offer by, in dollars. */
  increment: number;
  /** The buyer's maximum (cap) price, in dollars. */
  cap: number;
  /** An ASSUMED competing offer to model against, in dollars. */
  competingOffer: number;
}

export interface EscalationModel {
  /** True when the inputs are coherent enough to compute a result. */
  valid: boolean;
  /**
   * Why the inputs are invalid, when `valid` is false (e.g. cap below base,
   * increment <= 0). Empty when valid.
   */
  errors: string[];
  /** The price the clause would resolve to, or null when invalid. */
  resultingPrice: number | null;
  /** True when the modeled price hit the cap (the competing offer pushed past it). */
  cappedOut: boolean;
  /** True when the competing offer is at/below the base — no escalation triggers. */
  noEscalation: boolean;
  /**
   * How much of the buyer's headroom (cap − base) the modeled price consumes,
   * 0–1, or null when invalid. Lets the UI show "you'd spend X of your range".
   */
  headroomUsedFraction: number | null;
}

function isMoney(n: number): boolean {
  return Number.isFinite(n) && n > 0;
}

/**
 * Model the escalation arithmetic of the buyer's own inputs. PURE.
 *
 * Validation (don't compute nonsense): cap must exceed the base and the
 * increment must be positive. Negative/NaN inputs are treated as invalid.
 */
export function illustrateEscalation(inputs: EscalationInputs): EscalationModel {
  const { base, increment, cap, competingOffer } = inputs;
  const errors: string[] = [];

  if (!isMoney(base)) {
    errors.push("Enter your base (starting) offer.");
  }
  if (!Number.isFinite(increment) || increment <= 0) {
    errors.push("The beat-by increment must be greater than $0.");
  }
  if (!isMoney(cap)) {
    errors.push("Enter your cap (maximum price).");
  }
  if (isMoney(base) && isMoney(cap) && cap < base) {
    errors.push("Your cap must be at least your base offer.");
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      resultingPrice: null,
      cappedOut: false,
      noEscalation: false,
      headroomUsedFraction: null,
    };
  }

  // A competing offer at/below the base doesn't move you off your base.
  const competing = Number.isFinite(competingOffer) ? competingOffer : 0;
  const noEscalation = competing <= base;

  // min(competing + increment, cap), never below the base.
  const escalated = competing + increment;
  const raw = noEscalation ? base : Math.min(escalated, cap);
  const resultingPrice = Math.max(base, Math.min(raw, cap));
  const cappedOut = !noEscalation && escalated >= cap;

  const headroom = cap - base;
  const headroomUsedFraction =
    headroom <= 0 ? 0 : (resultingPrice - base) / headroom;

  return {
    valid: true,
    errors: [],
    resultingPrice,
    cappedOut,
    noEscalation,
    headroomUsedFraction,
  };
}
