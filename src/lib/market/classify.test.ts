import { describe, expect, it } from "vitest";
import { classifyMarket } from "./classify";
import type { MarketStats } from "./types";

const base: MarketStats = { source: "manual" };

describe("classifyMarket — bands", () => {
  it("reads a hot seller's market (DOM 9, list-to-sale 102%, MoS 1.2)", () => {
    const read = classifyMarket({
      ...base,
      daysOnMarket: 9,
      listToSaleRatio: 102,
      monthsOfSupply: 1.2,
    });
    expect(read.band).toBe("strong-seller");
    expect(read.headline).toMatch(/seller/i);
    expect(read.signalCount).toBe(3);
    expect(read.lowConfidence).toBe(false);
  });

  it("reads a buyer's market (DOM 120, list-to-sale 94%, MoS 9)", () => {
    const read = classifyMarket({
      ...base,
      daysOnMarket: 120,
      listToSaleRatio: 94,
      monthsOfSupply: 9,
    });
    expect(read.band).toBe("strong-buyer");
    expect(read.headline).toMatch(/buyer/i);
  });

  it("reads a balanced market (MoS 5, list-to-sale 99%, DOM 30)", () => {
    const read = classifyMarket({
      ...base,
      monthsOfSupply: 5,
      listToSaleRatio: 99,
      daysOnMarket: 30,
    });
    expect(read.band).toBe("balanced");
  });
});

describe("classifyMarket — months-of-supply boundary cases (primary signal)", () => {
  // Test MoS in isolation (weight dominates a single-signal read), asserting the
  // side each cutoff falls on, just-below and just-above.
  const mos = (v: number) =>
    classifyMarket({ ...base, monthsOfSupply: v }).factors[0].lean;

  it("MoS 2.9 (just below 3) leans seller", () => {
    expect(mos(2.9)).toBe("seller");
  });
  it("MoS 3.0 (at 3) leans seller", () => {
    expect(mos(3.0)).toBe("seller");
  });
  it("MoS 4.0 (at 4) is balanced", () => {
    expect(mos(4.0)).toBe("balanced");
  });
  it("MoS 6.0 (at 6) is still balanced", () => {
    expect(mos(6.0)).toBe("balanced");
  });
  it("MoS 6.1 (just above 6) leans buyer", () => {
    expect(mos(6.1)).toBe("buyer");
  });
});

describe("classifyMarket — list-to-sale boundary cases", () => {
  const lts = (v: number) =>
    classifyMarket({ ...base, listToSaleRatio: v }).factors[0].lean;

  it("list-to-sale exactly 100.0% is balanced (not seller)", () => {
    expect(lts(100.0)).toBe("balanced");
  });
  it("list-to-sale 100.1% (just above) leans seller", () => {
    expect(lts(100.1)).toBe("seller");
  });
  it("list-to-sale 98% (at the balanced floor) is balanced", () => {
    expect(lts(98)).toBe("balanced");
  });
  it("list-to-sale 97.9% (just below) leans buyer", () => {
    expect(lts(97.9)).toBe("buyer");
  });
});

describe("classifyMarket — DOM relative cutoffs", () => {
  const dom = (v: number) =>
    classifyMarket({ ...base, daysOnMarket: v }, { localNorm: 30 }).factors[0]
      .lean;

  it("DOM 15 (half the norm) leans seller", () => {
    expect(dom(15)).toBe("seller");
  });
  it("DOM 16 (just above half) is balanced", () => {
    expect(dom(16)).toBe("balanced");
  });
  it("DOM 45 (1.5x norm) is balanced", () => {
    expect(dom(45)).toBe("balanced");
  });
  it("DOM 46 (just above 1.5x) leans buyer", () => {
    expect(dom(46)).toBe("buyer");
  });
});

describe("classifyMarket — partial / empty / invalid", () => {
  it("classifies on a single signal without NaN, flagged low-confidence", () => {
    const read = classifyMarket({ ...base, daysOnMarket: 8 });
    expect(read.band).not.toBe("unknown");
    expect(read.signalCount).toBe(1);
    expect(read.lowConfidence).toBe(true);
    expect(JSON.stringify(read)).not.toMatch(/NaN/);
  });

  it("all-empty input → unknown / neutral, no crash", () => {
    const read = classifyMarket(base);
    expect(read.band).toBe("unknown");
    expect(read.signalCount).toBe(0);
    expect(read.factors).toEqual([]);
    expect(read.lowConfidence).toBe(true);
  });

  it("null/undefined input → unknown, no crash", () => {
    expect(classifyMarket(null).band).toBe("unknown");
    expect(classifyMarket(undefined).band).toBe("unknown");
  });

  it("NaN / Infinity signals are ignored (treated as absent)", () => {
    const read = classifyMarket({
      ...base,
      monthsOfSupply: NaN,
      listToSaleRatio: Infinity,
      daysOnMarket: -Infinity,
    });
    expect(read.band).toBe("unknown");
    expect(read.signalCount).toBe(0);
  });

  it("negative months-of-supply is clamped, not propagated", () => {
    const read = classifyMarket({ ...base, monthsOfSupply: -5 });
    // Clamped to 0 → very tight → strong-seller lean.
    expect(read.factors[0].display).toMatch(/^0 mo$/);
    expect(read.factors[0].lean).toBe("seller");
  });
});

describe("classifyMarket — compliance (UPL/FHA)", () => {
  it("no factor 'meaning' contains an imperative price directive", () => {
    const read = classifyMarket({
      ...base,
      daysOnMarket: 9,
      listToSaleRatio: 102,
      monthsOfSupply: 1.2,
      priceTrendPct: 4,
    });
    const text = read.factors.map((f) => f.meaning).join(" ");
    expect(text).not.toMatch(/offer (above|over|at) ask/i);
    expect(text).not.toMatch(/you should offer/i);
    expect(text).not.toMatch(/\boffer \$/i);
  });

  it("always carries a 'snapshot, conditions move' caveat", () => {
    const read = classifyMarket({ ...base, monthsOfSupply: 5 });
    expect(read.caveats.join(" ")).toMatch(/snapshot/i);
  });

  it("carries no school/demographic/desirability framing", () => {
    const read = classifyMarket({
      ...base,
      monthsOfSupply: 2,
      daysOnMarket: 10,
    });
    const text = JSON.stringify(read).toLowerCase();
    expect(text).not.toMatch(/school|demographic|good neighborhood|family-friendly|safe/);
  });
});
