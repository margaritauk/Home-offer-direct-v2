import { describe, expect, it } from "vitest";
import { compareLenders, lenderTotalCost, type LenderQuote } from "./lender-compare";

const quote: LenderQuote = {
  id: "a",
  name: "Lender A",
  loanAmount: 300_000,
  ratePercent: 6.5,
  points: 1,
  lenderFees: 2_000,
  monthlyPI: 1_896,
  aprPercent: 6.7,
};

describe("lenderTotalCost", () => {
  it("computes points cost as a percent of the loan", () => {
    const r = lenderTotalCost(quote, 60);
    expect(r.pointsCost).toBe(3_000); // 1% of 300k
  });

  it("sums upfront cost from points + fees", () => {
    const r = lenderTotalCost(quote, 60);
    expect(r.upfrontCost).toBe(5_000); // 3000 + 2000
  });

  it("multiplies monthly P&I by the horizon", () => {
    const r = lenderTotalCost(quote, 60);
    expect(r.paymentsOverHorizon).toBe(1_896 * 60);
  });

  it("totals upfront + payments", () => {
    const r = lenderTotalCost(quote, 60);
    expect(r.totalCost).toBe(5_000 + 1_896 * 60);
  });

  it("treats a zero/invalid horizon as no payments", () => {
    const r = lenderTotalCost(quote, 0);
    expect(r.paymentsOverHorizon).toBe(0);
    expect(r.totalCost).toBe(5_000);
  });

  it("sanitizes negative inputs to zero", () => {
    const r = lenderTotalCost(
      { ...quote, loanAmount: -1, points: -1, lenderFees: -1, monthlyPI: -1 },
      60,
    );
    expect(r.totalCost).toBe(0);
  });

  it("floors fractional horizon months", () => {
    const r = lenderTotalCost(quote, 60.9);
    expect(r.paymentsOverHorizon).toBe(1_896 * 60);
  });
});

describe("compareLenders", () => {
  const low: LenderQuote = {
    id: "low",
    name: "Low total",
    loanAmount: 300_000,
    ratePercent: 6.0,
    points: 0,
    lenderFees: 1_000,
    monthlyPI: 1_799,
    aprPercent: 6.1,
  };
  const highRateLowPoints: LenderQuote = {
    id: "high",
    name: "Higher rate, no points",
    loanAmount: 300_000,
    ratePercent: 6.9,
    points: 0,
    lenderFees: 800,
    monthlyPI: 1_976,
    aprPercent: 7.0,
  };

  it("flags the lowest total cost over the horizon", () => {
    const rows = compareLenders([quote, low, highRateLowPoints], 60);
    const lowest = rows.find((r) => r.isLowest);
    expect(lowest?.id).toBe("low");
    expect(rows.filter((r) => r.isLowest)).toHaveLength(1);
  });

  it("can pick a lower-rate lender even with upfront points", () => {
    // Over a long horizon, the cheaper monthly payment wins despite points.
    const rows = compareLenders([quote, highRateLowPoints], 120);
    expect(rows.find((r) => r.isLowest)?.id).toBe("a");
  });

  it("preserves input order", () => {
    const rows = compareLenders([quote, low, highRateLowPoints], 60);
    expect(rows.map((r) => r.id)).toEqual(["a", "low", "high"]);
  });

  it("returns an empty list with no quotes", () => {
    expect(compareLenders([], 60)).toEqual([]);
  });

  it("flags the first quote at the minimum on a tie", () => {
    const t1: LenderQuote = { ...low, id: "t1" };
    const t2: LenderQuote = { ...low, id: "t2" };
    const rows = compareLenders([t1, t2], 60);
    expect(rows.find((r) => r.isLowest)?.id).toBe("t1");
  });
});
