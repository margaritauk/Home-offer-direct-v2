import { describe, expect, it } from "vitest";
import { suggestPriceBand } from "./suggested-price";
import type { CompsEstimate } from "@/lib/tools/comps";
import { classifyMarket } from "@/lib/market/classify";
import type { MarketStats } from "@/lib/market/types";

/** Minimal comps estimate factory. */
function comps(
  low: number | null,
  mid: number | null,
  high: number | null,
  usableCount = 4,
): CompsEstimate {
  return {
    comps: [],
    usableCount,
    avgPricePerSqft: mid,
    minPricePerSqft: low,
    maxPricePerSqft: high,
    estimatedLow: low,
    estimatedMid: mid,
    estimatedHigh: high,
  };
}

const sellerMarket = classifyMarket({
  source: "manual",
  monthsOfSupply: 1.5,
  listToSaleRatio: 103,
  daysOnMarket: 8,
} satisfies MarketStats);

const buyerMarket = classifyMarket({
  source: "manual",
  monthsOfSupply: 9,
  listToSaleRatio: 94,
  daysOnMarket: 120,
} satisfies MarketStats);

describe("suggestPriceBand", () => {
  it("seller market emphasizes the upper end of the comp range", () => {
    const band = suggestPriceBand({
      compsEstimate: comps(380000, 395000, 410000),
      marketRead: sellerMarket,
    });
    expect(band.low).toBe(380000);
    expect(band.high).toBe(410000);
    expect(band.emphasis).toBe("upper");
    expect(band.rationale.join(" ")).toMatch(/seller/i);
    expect(band.basis).toEqual({ hasComps: true, hasMarket: true });
  });

  it("buyer market emphasizes the lower/middle of the range", () => {
    const band = suggestPriceBand({
      compsEstimate: comps(380000, 395000, 410000),
      marketRead: buyerMarket,
    });
    expect(band.emphasis).toBe("lower");
    expect(band.rationale.join(" ")).toMatch(/buyer/i);
  });

  it("normalizes an inverted comp range (low > high)", () => {
    const band = suggestPriceBand({
      compsEstimate: comps(410000, 395000, 380000),
      marketRead: sellerMarket,
    });
    expect(band.low).toBe(380000);
    expect(band.high).toBe(410000);
  });

  it("handles a single-comp / zero-width band and flags low confidence", () => {
    const band = suggestPriceBand({
      compsEstimate: comps(400000, 400000, 400000, 1),
      marketRead: buyerMarket,
    });
    expect(band.low).toBe(400000);
    expect(band.high).toBe(400000);
    expect(band.lowConfidence).toBe(true);
  });

  it("missing market read → comps-only band, emphasis none, neutral nudge", () => {
    const band = suggestPriceBand({
      compsEstimate: comps(380000, 395000, 410000),
      marketRead: null,
    });
    expect(band.low).toBe(380000);
    expect(band.emphasis).toBe("none");
    expect(band.basis.hasMarket).toBe(false);
    expect(band.rationale.join(" ")).toMatch(/add a market read/i);
  });

  it("missing comps → NO band (does not fabricate a number)", () => {
    const band = suggestPriceBand({
      compsEstimate: null,
      marketRead: sellerMarket,
    });
    expect(band.low).toBeNull();
    expect(band.high).toBeNull();
    expect(band.mid).toBeNull();
    expect(band.basis.hasComps).toBe(false);
    expect(band.rationale.join(" ")).toMatch(/add comparable sales/i);
  });

  it("empty comps estimate (usableCount 0) → NO band", () => {
    const band = suggestPriceBand({
      compsEstimate: comps(null, null, null, 0),
    });
    expect(band.low).toBeNull();
  });

  it("notes when the asking price sits above comp-supported value (list ≠ value)", () => {
    const band = suggestPriceBand({
      compsEstimate: comps(380000, 395000, 410000),
      marketRead: sellerMarket,
      listPrice: 450000,
    });
    expect(band.rationale.join(" ")).toMatch(/asking price.*above/i);
  });
});

describe("suggestPriceBand — UPL compliance", () => {
  it("emits a {low, high, rationale} shape with no single 'offer $X' directive", () => {
    const band = suggestPriceBand({
      compsEstimate: comps(380000, 395000, 410000),
      marketRead: sellerMarket,
    });
    const text = band.rationale.join(" ");
    expect(band).toHaveProperty("low");
    expect(band).toHaveProperty("high");
    expect(band).toHaveProperty("rationale");
    // No directive single number.
    expect(text).not.toMatch(/you should offer/i);
    expect(text).not.toMatch(/offer exactly/i);
    expect(text).not.toMatch(/we recommend offering/i);
  });

  it("keeps an 'attorney review' line on the rationale (contract surface)", () => {
    const band = suggestPriceBand({
      compsEstimate: comps(380000, 395000, 410000),
      marketRead: sellerMarket,
    });
    expect(band.rationale.join(" ")).toMatch(/attorney/i);
  });

  it("cross-links the appraisal-gap cash consequence in a seller market", () => {
    const band = suggestPriceBand({
      compsEstimate: comps(380000, 395000, 410000),
      marketRead: sellerMarket,
    });
    expect(band.rationale.join(" ")).toMatch(/appraisal gap/i);
  });
});
