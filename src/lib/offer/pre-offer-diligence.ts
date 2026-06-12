/**
 * Pre-offer due-diligence (I3, bundled with A2).
 *
 * Light, FHA-neutral fields an agent pulls before offering: last-sold
 * price/date, price-change history, days-on-market / CDOM, prior listings, tax
 * assessment, and (manual, labeled UNVERIFIED) seller motivation. PURE
 * summarizer — facts in, neutral summary out; partial fields degrade gracefully.
 *
 * Compliance:
 *   - FHA: "why selling" is free text that must be SCREENED before it reaches
 *     AI/templates (the component does this). Distinguishes recorded FACT from
 *     INFERENCE (motivation) — motivation is always labeled unverified.
 *   - UPL: facts only; tax assessment ≠ market value is stated; no directive.
 */

export interface PreOfferDiligence {
  /** Last recorded sale price (dollars). */
  lastSoldPrice?: number;
  /** Last recorded sale date (display/ISO string). */
  lastSoldDate?: string;
  /** Number of price changes observed on the current listing. */
  priceChangeCount?: number;
  /** Days on market (use cumulative/CDOM where available). */
  daysOnMarket?: number;
  /** Count of prior (expired/withdrawn) listings. */
  priorListings?: number;
  /** Tax-assessed value (dollars) — NOT market value. */
  taxAssessment?: number;
  /** Manual, unverified note on why the seller is selling (free text). */
  sellerMotivation?: string;
}

export interface DiligenceLine {
  id: string;
  label: string;
  value: string;
  /** Whether this is a recorded fact or an unverified inference. */
  kind: "fact" | "inference";
  /** Optional neutral note (e.g. the tax-assessment caveat). */
  note?: string;
}

export interface DiligenceSummary {
  lines: DiligenceLine[];
  /** True when nothing was provided. */
  empty: boolean;
  /**
   * A neutral nudge on where in the suggested band this context might point —
   * framed as a trade-off, never a directive. Empty when no relevant signal.
   */
  bandNudge?: string;
}

function isFiniteNum(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function fmtMoney(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

/**
 * Summarize the diligence fields into neutral lines. PURE. Missing fields are
 * simply skipped (graceful partial summary). The seller-motivation line is
 * always tagged as an unverified inference.
 *
 * The `sellerMotivation` is rendered VERBATIM here for the summary; callers MUST
 * screen it with `screenText` before it reaches any AI/template surface.
 */
export function summarizeDiligence(
  d: PreOfferDiligence | null | undefined,
): DiligenceSummary {
  const data = d ?? {};
  const lines: DiligenceLine[] = [];

  if (isFiniteNum(data.lastSoldPrice) && data.lastSoldPrice > 0) {
    lines.push({
      id: "last-sold",
      label: "Last sold",
      value: data.lastSoldDate
        ? `${fmtMoney(data.lastSoldPrice)} on ${data.lastSoldDate}`
        : fmtMoney(data.lastSoldPrice),
      kind: "fact",
      note: "Sale prices aren't public in non-disclosure states, so this may be unavailable.",
    });
  }

  if (isFiniteNum(data.daysOnMarket) && data.daysOnMarket >= 0) {
    lines.push({
      id: "dom",
      label: "Days on market",
      value: `${Math.round(data.daysOnMarket)} days`,
      kind: "fact",
      note: "A relist can reset this — check cumulative days (CDOM) where you can.",
    });
  }

  if (isFiniteNum(data.priceChangeCount) && data.priceChangeCount > 0) {
    lines.push({
      id: "price-changes",
      label: "Price changes",
      value: `${Math.round(data.priceChangeCount)} on this listing`,
      kind: "fact",
    });
  }

  if (isFiniteNum(data.priorListings) && data.priorListings > 0) {
    lines.push({
      id: "prior-listings",
      label: "Prior listings",
      value: `${Math.round(data.priorListings)} (expired/withdrawn)`,
      kind: "fact",
    });
  }

  if (isFiniteNum(data.taxAssessment) && data.taxAssessment > 0) {
    lines.push({
      id: "tax-assessment",
      label: "Tax assessment",
      value: fmtMoney(data.taxAssessment),
      kind: "fact",
      note: "Tax-assessed value is not market value — assessments lag and use a different methodology.",
    });
  }

  const motivation = data.sellerMotivation?.trim();
  if (motivation) {
    lines.push({
      id: "seller-motivation",
      label: "Seller motivation (unverified)",
      value: motivation,
      kind: "inference",
      note: "Often hearsay — treat as unverified, never as fact.",
    });
  }

  // A neutral nudge: longer DOM and/or price cuts tend to give buyers leverage.
  let bandNudge: string | undefined;
  const longDom = isFiniteNum(data.daysOnMarket) && data.daysOnMarket > 60;
  const hasCuts =
    isFiniteNum(data.priceChangeCount) && data.priceChangeCount > 0;
  if (longDom || hasCuts) {
    bandNudge =
      "Longer time on market and price cuts often signal more room to negotiate — context for where in your suggested range you might come in. You decide.";
  }

  return { lines, empty: lines.length === 0, bandNudge };
}
