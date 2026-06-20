/**
 * Grounded, FHA-safe input projections for the S7-AI2 explainers (price band +
 * disclosure). Analogues of `buildSafeAiInput` / `buildSafeBudgetInput`.
 *
 * Both projections carry ONLY objective facts already produced by our pure
 * deterministic cores:
 *   - the price band → comp-anchored low/high/mid + market emphasis (no
 *     demographic field by construction; the model NARRATES a range, never a
 *     number);
 *   - the disclosure checklist → property-condition red-flag categories (about
 *     the PROPERTY, never the people; FHA).
 *
 * PURE — no network, no env, no React. Fully unit-testable.
 */

import type { PriceBand } from "@/lib/offer/suggested-price";
import type { DisclosureChecklist } from "@/lib/tools/disclosure-review";
import type {
  DisclosureExplainerInput,
  PriceBandExplainerInput,
  SafeDisclosureCategory,
  SafePriceBandInput,
} from "./types";

/**
 * Project a {@link PriceBand} into the grounded price-band explainer input. Only
 * the objective band facts are carried; the rationale lines are the deterministic
 * text the model must restate. PURE.
 */
export function buildPriceBandExplainerInput(
  band: PriceBand,
): PriceBandExplainerInput {
  const safeInput: SafePriceBandInput = {
    low: band.low,
    high: band.high,
    mid: band.mid,
    emphasis: band.emphasis,
    basis: { hasComps: band.basis.hasComps, hasMarket: band.basis.hasMarket },
    lowConfidence: band.lowConfidence,
  };
  return { safeInput, rationale: [...band.rationale] };
}

/**
 * Project a {@link DisclosureChecklist} into the grounded disclosure explainer
 * input. Carries only the property-condition categories (id/label/what-to-look-
 * for/ask-your-pro) — never anything about the neighborhood's people. PURE.
 */
export function buildDisclosureExplainerInput(
  checklist: DisclosureChecklist,
): DisclosureExplainerInput {
  const categories: SafeDisclosureCategory[] = checklist.categories.map((c) => ({
    id: c.id,
    label: c.label,
    whatToLookFor: c.whatToLookFor,
    askYourPro: c.askYourPro,
  }));
  return {
    regime: checklist.regime,
    formName: checklist.formName,
    intro: checklist.intro,
    caveatEmptorWarning: checklist.caveatEmptorWarning,
    categories,
  };
}
