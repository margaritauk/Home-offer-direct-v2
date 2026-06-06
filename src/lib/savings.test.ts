import { describe, expect, it } from "vitest";
import { calculateSavings, formatUSD } from "./savings";

const base = {
  homePrice: 400_000,
  downPaymentPercent: 10,
  buyerCommissionPercent: 2.5,
  captureRatePercent: 100,
  closingCostPercent: 3,
};

describe("calculateSavings", () => {
  it("computes the negotiable commission as a percent of price", () => {
    const r = calculateSavings(base);
    expect(r.negotiableCommission).toBe(10_000); // 2.5% of 400k
  });

  it("captures all of the commission at 100% capture rate", () => {
    const r = calculateSavings(base);
    expect(r.capturedSavings).toBe(10_000);
  });

  it("captures none of it at 0% capture rate (seller keeps it)", () => {
    const r = calculateSavings({ ...base, captureRatePercent: 0 });
    expect(r.capturedSavings).toBe(0);
  });

  it("captures half at 50% capture rate", () => {
    const r = calculateSavings({ ...base, captureRatePercent: 50 });
    expect(r.capturedSavings).toBe(5_000);
  });

  it("derives down payment, loan amount, and closing costs", () => {
    const r = calculateSavings(base);
    expect(r.downPayment).toBe(40_000);
    expect(r.loanAmount).toBe(360_000);
    expect(r.closingCosts).toBe(12_000);
  });

  it("reduces cash-to-close by the captured savings", () => {
    const r = calculateSavings(base);
    expect(r.cashToCloseBefore).toBe(52_000); // 40k down + 12k closing
    expect(r.cashToCloseAfter).toBe(42_000); // minus 10k captured
  });

  it("never drives cash-to-close below zero", () => {
    const r = calculateSavings({
      ...base,
      downPaymentPercent: 0,
      closingCostPercent: 0,
      buyerCommissionPercent: 4,
    });
    expect(r.cashToCloseAfter).toBe(0);
  });

  it("clamps out-of-range percentages", () => {
    const r = calculateSavings({ ...base, captureRatePercent: 250 });
    expect(r.capturedSavings).toBe(10_000); // clamped to 100%
  });

  it("handles invalid / non-positive price safely", () => {
    const r = calculateSavings({ ...base, homePrice: -5 });
    expect(r.negotiableCommission).toBe(0);
    expect(r.cashToCloseAfter).toBe(0);
  });
});

describe("formatUSD", () => {
  it("formats whole dollars without cents", () => {
    expect(formatUSD(10_000)).toBe("$10,000");
  });

  it("handles non-finite input", () => {
    expect(formatUSD(Number.NaN)).toBe("$0");
  });
});
