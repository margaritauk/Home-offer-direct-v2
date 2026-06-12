/**
 * Market-conditions classifier (A1 / ADR-013).
 *
 * PURE function: {@link MarketStats} in → {@link MarketRead} out. No React, no
 * I/O. This is the single source of truth for the buyer-vs-seller read; A2, I3,
 * and J4 consume the SAME read (never re-classify).
 *
 * Thresholds (sourced — see docs/backlog/contributions/researcher.md §A1):
 *   - Months of supply (PRIMARY, most-citable): <3 very tight (strong-seller),
 *     <4 seller, 4–6 balanced, >6 buyer, >8 strongly buyer. NAR-derived
 *     absorption-rate convention (Redfin / Opendoor / HomeLight).
 *   - List-to-sale ratio (sale ÷ list, %): >100 = above ask (seller), 98–100
 *     balanced, <97 buyers under ask. Relative signal.
 *   - Days on market: read RELATIVE to a typical local norm (~30 days assumed
 *     when no local baseline is supplied); single-digit = hot, long/rising =
 *     cooling. No hard national cutoff — kept soft.
 *   - Price trend (% change): rising = seller-leaning, flat = balanced, falling
 *     = buyer-leaning. Read WITH months-of-supply, weighted lightest.
 *
 * Compliance: each factor's `meaning` is a trade-off ("competition is high;
 * negotiating room shrinks"), never "offer above ask" (UPL). Metrics are
 * transactional only (FHA).
 */

import type {
  MarketBand,
  MarketFactor,
  MarketRead,
  MarketStats,
} from "./types";

/** A finite, real number — guards NaN/Infinity/garbage. */
function isFiniteNum(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/** A per-signal lean carries a numeric score so we can average across signals. */
type Lean = MarketFactor["lean"];

/** Map a lean to a signed score: buyer −1 … seller +1 (strong = ±2). */
const SCORE: Record<"strong-buyer" | "buyer" | "balanced" | "seller" | "strong-seller", number> =
  {
    "strong-buyer": -2,
    buyer: -1,
    balanced: 0,
    seller: 1,
    "strong-seller": 2,
  };

interface SignalResult {
  factor: MarketFactor;
  /** Signed score for averaging (omitted for unknown signals). */
  score?: number;
  /** Relative weight in the blend (months-of-supply leads). */
  weight: number;
}

/** Months of supply — the primary signal (weight 3). */
function monthsOfSupplySignal(mos: number | undefined): SignalResult | null {
  if (!isFiniteNum(mos)) return null;
  const value = Math.max(0, mos); // clamp negatives — supply can't be < 0
  let key: keyof typeof SCORE;
  let meaning: string;
  if (value < 3) {
    key = "strong-seller";
    meaning =
      "Very little inventory for the demand — homes move fast and competition tends to be intense, so the room buyers usually have to negotiate is thin.";
  } else if (value < 4) {
    key = "seller";
    meaning =
      "Inventory is on the tight side, which generally favors sellers and shrinks buyer negotiating room.";
  } else if (value <= 6) {
    key = "balanced";
    meaning =
      "Inventory is in the range many consider balanced — neither side has a strong structural edge from supply alone.";
  } else if (value <= 8) {
    key = "buyer";
    meaning =
      "There's more inventory than buyers are absorbing, which tends to give buyers more negotiating room and time to decide.";
  } else {
    key = "strong-buyer";
    meaning =
      "Inventory is well above what's selling, which typically gives buyers meaningful leverage on price and terms.";
  }
  return {
    factor: {
      id: "months-of-supply",
      label: "Months of supply",
      display: `${trimNum(value)} mo`,
      lean: leanOf(key),
      meaning,
    },
    score: SCORE[key],
    weight: 3,
  };
}

/** List-to-sale ratio (%) — relative competitiveness signal (weight 2). */
function listToSaleSignal(ratio: number | undefined): SignalResult | null {
  if (!isFiniteNum(ratio)) return null;
  const value = Math.max(0, ratio);
  let key: keyof typeof SCORE;
  let meaning: string;
  if (value > 100) {
    key = "seller";
    meaning =
      "Homes here are closing above asking, a sign of competition — buyers often face less room to negotiate under list.";
  } else if (value >= 98) {
    key = "balanced";
    meaning =
      "Homes are closing right around asking, which generally points to a balanced footing on price.";
  } else {
    key = "buyer";
    meaning =
      "Homes are closing below asking, which tends to mean buyers have room to negotiate under list.";
  }
  return {
    factor: {
      id: "list-to-sale",
      label: "List-to-sale ratio",
      display: `${trimNum(value)}%`,
      lean: leanOf(key),
      meaning,
    },
    score: SCORE[key],
    weight: 2,
  };
}

/**
 * Days on market vs a local norm — relative signal (weight 2). Without a local
 * baseline we read against a soft ~30-day reference and keep the language
 * relative, not absolute.
 */
function daysOnMarketSignal(
  dom: number | undefined,
  localNorm = 30,
): SignalResult | null {
  if (!isFiniteNum(dom)) return null;
  const value = Math.max(0, dom);
  const norm = isFiniteNum(localNorm) && localNorm > 0 ? localNorm : 30;
  let key: keyof typeof SCORE;
  let meaning: string;
  if (value <= norm * 0.5) {
    key = "seller";
    meaning =
      "Listings are going under contract quickly relative to a typical month — fast markets usually compress the time and leverage buyers have.";
  } else if (value <= norm * 1.5) {
    key = "balanced";
    meaning =
      "Time-on-market looks close to a typical pace, so it isn't pointing strongly either way on its own.";
  } else {
    key = "buyer";
    meaning =
      "Listings are sitting longer than a typical month, which often gives buyers more negotiating leverage. (A low number can also be a fresh relist — check cumulative days where you can.)";
  }
  return {
    factor: {
      id: "days-on-market",
      label: "Days on market",
      display: `${trimNum(value)} days`,
      lean: leanOf(key),
      meaning,
    },
    score: SCORE[key],
    weight: 2,
  };
}

/** Price trend (% change) — directional signal, weighted lightest (weight 1). */
function priceTrendSignal(pct: number | undefined): SignalResult | null {
  if (!isFiniteNum(pct)) return null;
  let key: keyof typeof SCORE;
  let meaning: string;
  if (pct > 1) {
    key = "seller";
    meaning =
      "Prices have been rising recently, which tends to accompany demand outpacing supply — read it alongside inventory, not alone.";
  } else if (pct >= -1) {
    key = "balanced";
    meaning =
      "Prices have been roughly flat lately, which on its own points to a balanced footing.";
  } else {
    key = "buyer";
    meaning =
      "Prices have softened recently, which alongside higher inventory tends to favor buyers — though watch for seasonality.";
  }
  const sign = pct > 0 ? "+" : "";
  return {
    factor: {
      id: "price-trend",
      label: "Price trend",
      display: `${sign}${trimNum(pct)}%`,
      lean: leanOf(key),
      meaning,
    },
    score: SCORE[key],
    weight: 1,
  };
}

/** Trim trailing ".0" for clean display while keeping one decimal otherwise. */
function trimNum(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function leanOf(key: keyof typeof SCORE): Lean {
  if (key === "seller" || key === "strong-seller") return "seller";
  if (key === "buyer" || key === "strong-buyer") return "buyer";
  return "balanced";
}

/**
 * Map a blended weighted score to the overall {@link MarketBand}.
 *
 * The "strong" cutoff is ±1.4 so that a market where the primary signal is
 * extreme and the others agree (e.g. MoS 1.2 + above-ask + single-digit DOM,
 * which averages ~1.43) reads as strongly-skewed, while a single moderate
 * signal stays in the plain buyer/seller band.
 */
function bandFromScore(score: number): Exclude<MarketBand, "unknown"> {
  if (score <= -1.4) return "strong-buyer";
  if (score < -0.4) return "buyer";
  if (score <= 0.4) return "balanced";
  if (score < 1.4) return "seller";
  return "strong-seller";
}

const BAND_HEADLINE: Record<Exclude<MarketBand, "unknown">, string> = {
  "strong-buyer": "Strongly a buyer's market",
  buyer: "Leans toward a buyer's market",
  balanced: "A balanced market",
  seller: "Leans toward a seller's market",
  "strong-seller": "Strongly a seller's market",
};

/**
 * Classify market stats into a buyer/balanced/seller read with plain-English,
 * trade-off-framed rationale. PURE.
 *
 * - All-empty / no usable signal → band "unknown", low confidence, no crash.
 * - Partial inputs classify on what's available (no NaN leaks).
 * - Negative / NaN values are clamped or ignored, never propagated.
 * - A single weak signal is flagged low-confidence.
 *
 * @param stats neutral market facts (transactional only).
 * @param opts.localNorm optional local DOM baseline; defaults to ~30 days.
 */
export function classifyMarket(
  stats: MarketStats | null | undefined,
  opts: { localNorm?: number } = {},
): MarketRead {
  const s = stats ?? ({ source: "manual" } as MarketStats);

  const signals: SignalResult[] = [
    monthsOfSupplySignal(s.monthsOfSupply),
    listToSaleSignal(s.listToSaleRatio),
    daysOnMarketSignal(s.daysOnMarket, opts.localNorm),
    priceTrendSignal(s.priceTrendPct),
  ].filter((x): x is SignalResult => x !== null);

  const factors = signals.map((x) => x.factor);
  const signalCount = signals.length;

  const caveats: string[] = [
    "This is a snapshot — market conditions move, so re-check before you rely on it.",
  ];

  if (signalCount === 0) {
    return {
      band: "unknown",
      headline: "Not enough data yet to read the market",
      factors,
      caveats: [
        "Enter or pull the market signals above to see a read.",
        ...caveats,
      ],
      signalCount: 0,
      lowConfidence: true,
    };
  }

  // Weighted average of the signed signal scores.
  let weighted = 0;
  let totalWeight = 0;
  for (const sig of signals) {
    if (typeof sig.score === "number") {
      weighted += sig.score * sig.weight;
      totalWeight += sig.weight;
    }
  }
  const avg = totalWeight > 0 ? weighted / totalWeight : 0;
  const band = bandFromScore(avg);

  // Confidence: months-of-supply is the primary, most-citable signal. A read
  // built from a single signal (especially a non-primary one) is low-confidence.
  const hasMos = signals.some((x) => x.factor.id === "months-of-supply");
  const lowConfidence = signalCount < 2 || (signalCount < 3 && !hasMos);
  if (lowConfidence) {
    caveats.unshift(
      "Low confidence — this read is based on limited data; thin or single-signal markets can mislead.",
    );
  }
  if (!hasMos) {
    caveats.push(
      "Months of supply (the most citable signal) isn't filled in — adding it sharpens the read.",
    );
  }

  return {
    band,
    headline: BAND_HEADLINE[band],
    factors,
    caveats,
    signalCount,
    lowConfidence,
  };
}
