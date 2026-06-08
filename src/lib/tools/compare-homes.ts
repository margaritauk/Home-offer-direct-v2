/**
 * Compare-homes row derivation (issue #97).
 *
 * Given 2–4 homes (sourced from listings and/or tracked showings) the buyer
 * picks, derive a side-by-side facts table: price, $/sqft, beds/baths, sqft,
 * days on market, and the buyer's own tour score (#94) when present. We also
 * flag the "best value per row" where it's meaningful — lowest price, lowest
 * $/sqft, fewest days on market, highest tour score.
 *
 * GUARDRAIL (FHA, #97): facts only, NO steering. The derived rows carry only
 * transaction/property facts plus the buyer's own private tour score. There is
 * no neighborhood "desirability", school, or demographic field, and "best
 * value" is a transparent numeric min/max on facts the buyer entered — never a
 * recommendation about where someone should or shouldn't live.
 */

/** The minimal home facts the comparison needs, from a listing or a showing. */
export interface ComparableHome {
  id: string;
  /** Address/label. Facts only. */
  label: string;
  /** Optional city/state for display. */
  location?: string;
  price?: number;
  sqft?: number;
  beds?: number;
  baths?: number;
  daysOnMarket?: number;
  /** The buyer's weighted tour score (0–5) from #94, if scored. */
  tourScore?: number;
}

/** A metric we render as a comparison row, and how "best" is defined. */
export type CompareMetric =
  | "price"
  | "pricePerSqft"
  | "beds"
  | "baths"
  | "sqft"
  | "daysOnMarket"
  | "tourScore";

/** Whether the "best value" for a metric is the lowest or highest number. */
const METRIC_DIRECTION: Record<CompareMetric, "min" | "max"> = {
  price: "min",
  pricePerSqft: "min",
  beds: "max",
  baths: "max",
  sqft: "max",
  daysOnMarket: "min",
  tourScore: "max",
};

export interface DerivedHome extends ComparableHome {
  /** price / sqft, or null when either is missing. */
  pricePerSqft: number | null;
}

export interface CompareRow {
  metric: CompareMetric;
  label: string;
  /** Per-home value for this metric, aligned to the homes array order. */
  values: (number | null)[];
  /**
   * Index(es) of the home(s) holding the best value for this row, or empty when
   * the row isn't meaningfully comparable (all blank, or all equal).
   */
  bestIndexes: number[];
}

const ROW_LABELS: Record<CompareMetric, string> = {
  price: "List price",
  pricePerSqft: "$ / sqft",
  beds: "Beds",
  baths: "Baths",
  sqft: "Square feet",
  daysOnMarket: "Days on market",
  tourScore: "My tour score",
};

/** The metric rows we render, in display order. */
export const COMPARE_METRICS: CompareMetric[] = [
  "price",
  "pricePerSqft",
  "beds",
  "baths",
  "sqft",
  "daysOnMarket",
  "tourScore",
];

function deriveOne(home: ComparableHome): DerivedHome {
  const price = Number.isFinite(home.price) ? home.price : undefined;
  const sqft = Number.isFinite(home.sqft) ? home.sqft : undefined;
  const pricePerSqft =
    typeof price === "number" && typeof sqft === "number" && sqft > 0
      ? price / sqft
      : null;
  return { ...home, pricePerSqft };
}

function valueFor(home: DerivedHome, metric: CompareMetric): number | null {
  const raw =
    metric === "pricePerSqft"
      ? home.pricePerSqft
      : (home[metric as keyof ComparableHome] as number | undefined);
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

/**
 * Build the comparison: derive $/sqft for each home, then one row per metric
 * with each home's value and the index(es) of the best value. A row's best is
 * only flagged when at least two homes have a value AND they aren't all equal —
 * so we never imply a "winner" where the facts are identical or absent.
 */
export function buildComparison(homes: ComparableHome[]): {
  homes: DerivedHome[];
  rows: CompareRow[];
} {
  const derived = homes.map(deriveOne);

  const rows: CompareRow[] = COMPARE_METRICS.map((metric) => {
    const values = derived.map((h) => valueFor(h, metric));
    const present = values.filter((v): v is number => v !== null);

    let bestIndexes: number[] = [];
    const allEqual = present.length > 0 && present.every((v) => v === present[0]);
    if (present.length >= 2 && !allEqual) {
      const target =
        METRIC_DIRECTION[metric] === "min"
          ? Math.min(...present)
          : Math.max(...present);
      bestIndexes = values
        .map((v, i) => (v === target ? i : -1))
        .filter((i) => i >= 0);
    }

    return { metric, label: ROW_LABELS[metric], values, bestIndexes };
  });

  return { homes: derived, rows };
}
