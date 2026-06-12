/**
 * "What should I offer?" price-band bridge (A2).
 *
 * PURE function composing the existing comps fair-value estimate (low/mid/high)
 * with the A1 market read into a SUGGESTED PRICE BAND + reasoning. No new data
 * source. No React/IO.
 *
 * HARD UPL RULE (this is the most directive-prone feature in the product):
 *   - Output is a RANGE with rationale, NEVER a single directive number.
 *   - It is COMP-ANCHORED — the band is the comps fair-value range, not the
 *     asking price. The market read only sets where to EMPHASIZE within it.
 *   - It never tells the buyer to "offer $X"; the buyer types their own number.
 *   - Missing comps → NO band (we don't fabricate a number from market alone).
 *
 * Compliance (FHA): rationale cites price/market facts only.
 */

import type { CompsEstimate } from "@/lib/tools/comps";
import type { MarketBand, MarketRead } from "@/lib/market/types";

/** Where in the comp range the market read suggests buyers tend to cluster. */
export type BandEmphasis = "lower" | "middle" | "upper" | "none";

export interface PriceBand {
  /** Low end of the comp-anchored band (dollars), or null when no comps. */
  low: number | null;
  /** High end of the comp-anchored band (dollars), or null when no comps. */
  high: number | null;
  /** Comps midpoint, carried for transparency, or null. */
  mid: number | null;
  /** Where the market read leans within the band. */
  emphasis: BandEmphasis;
  /** Plain-English reasoning lines — facts + trade-offs, never a directive. */
  rationale: string[];
  /** Which inputs were present, so the UI can prompt for what's missing. */
  basis: { hasComps: boolean; hasMarket: boolean };
  /** True when comps are thin/weak — confidence drops, and we say so. */
  lowConfidence: boolean;
}

/** Inputs to the bridge. All optional so it degrades gracefully. */
export interface SuggestPriceBandInput {
  compsEstimate?: CompsEstimate | null;
  marketRead?: MarketRead | null;
  /** The list/asking price, for an explicit "value ≠ asking" note only. */
  listPrice?: number | null;
}

function isFiniteNum(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/** Order a possibly-inverted low/high pair. */
function orderRange(a: number, b: number): [number, number] {
  return a <= b ? [a, b] : [b, a];
}

/** Map a market band to where buyers tend to cluster within the comp range. */
function emphasisForBand(band: MarketBand | undefined): BandEmphasis {
  switch (band) {
    case "strong-seller":
    case "seller":
      return "upper";
    case "buyer":
    case "strong-buyer":
      return "lower";
    case "balanced":
      return "middle";
    default:
      return "none";
  }
}

const EMPHASIS_NOTE: Record<Exclude<BandEmphasis, "none">, string> = {
  upper:
    "Market read leans to a seller's market, so competitive offers in conditions like these tend to land near the top of (or above) the comp range. Going above comps for a financed purchase can open an appraisal gap — weigh the cash consequence.",
  lower:
    "Market read leans to a buyer's market, so buyers here often have room to come in toward the lower-to-middle of the comp range and negotiate.",
  middle:
    "Market read looks balanced, so the middle of the comp range is a common starting reference — neither side has a strong structural edge.",
};

/**
 * Compose comps + market into a comp-anchored suggested band. PURE.
 *
 * - No comps (or no usable estimate) → no band; a single "add comps" prompt.
 *   We never fabricate a number from the market read alone.
 * - Comps but no market → comps-only band with a neutral "add a market read"
 *   nudge; emphasis "none".
 * - Inverted/zero-width comp ranges are normalized defensively.
 */
export function suggestPriceBand(input: SuggestPriceBandInput): PriceBand {
  const est = input.compsEstimate ?? null;
  const read = input.marketRead ?? null;

  const lowRaw = est?.estimatedLow;
  const highRaw = est?.estimatedHigh;
  const midRaw = est?.estimatedMid;

  const hasComps =
    !!est &&
    (est.usableCount ?? 0) > 0 &&
    isFiniteNum(lowRaw) &&
    isFiniteNum(highRaw);
  const hasMarket = !!read && read.band !== "unknown";

  // No comps → no band. (UPL: don't manufacture a price from market alone.)
  if (!hasComps) {
    const rationale = [
      "Add comparable sales to see a suggested range — this band is anchored to comps, not to the asking price.",
    ];
    if (hasMarket && read) {
      rationale.push(
        `Market read: ${read.headline.toLowerCase()}. Once you add comps, we'll show where buyers in this market tend to come in within the range.`,
      );
    }
    return {
      low: null,
      high: null,
      mid: null,
      emphasis: "none",
      rationale,
      basis: { hasComps: false, hasMarket },
      lowConfidence: true,
    };
  }

  const [low, high] = orderRange(lowRaw as number, highRaw as number);
  const mid = isFiniteNum(midRaw) ? (midRaw as number) : (low + high) / 2;

  const rationale: string[] = [];
  rationale.push(
    `Similar homes support roughly ${fmtMoney(low)}–${fmtMoney(high)} (from your comps, not the asking price).`,
  );

  const emphasis = hasMarket ? emphasisForBand(read?.band) : "none";
  if (emphasis !== "none") {
    rationale.push(EMPHASIS_NOTE[emphasis]);
  } else {
    rationale.push(
      "Add a market read (buyer's vs. seller's) to sharpen where in this range buyers here tend to come in.",
    );
  }

  // List price is a CONTEXT note only — never the anchor.
  if (isFiniteNum(input.listPrice) && input.listPrice! > 0) {
    const lp = input.listPrice as number;
    if (lp > high) {
      rationale.push(
        `Heads up: the asking price (${fmtMoney(lp)}) sits above what your comps support — the list price isn't the same as value.`,
      );
    } else if (lp < low) {
      rationale.push(
        `Note: the asking price (${fmtMoney(lp)}) is below what your comps support, which can draw competition.`,
      );
    }
  }

  // Confidence: a thin or zero-width comp set lowers confidence.
  const lowConfidence =
    (est?.usableCount ?? 0) < 3 || high - low <= 0;
  if (lowConfidence) {
    rationale.push(
      "Confidence is limited — your comp set is thin or tightly clustered, so treat this as a rough reference and add stronger comps if you can.",
    );
  }

  rationale.push(
    "This is a range to inform your own number — you decide what to offer, and contract terms should be reviewed with your attorney.",
  );

  return {
    low,
    high,
    mid,
    emphasis,
    rationale,
    basis: { hasComps: true, hasMarket },
    lowConfidence,
  };
}

/** Compact USD formatting for rationale strings. */
function fmtMoney(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}
