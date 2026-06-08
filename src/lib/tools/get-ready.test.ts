import { describe, expect, it } from "vitest";
import { CREDIT_CHECKLIST, savingsGoal } from "./get-ready";

const base = {
  homePrice: 400_000,
  downPaymentPercent: 10,
  closingCostPercent: 3,
  currentSaved: 26_000,
};

describe("savingsGoal", () => {
  it("computes down payment and closing-cost targets", () => {
    const r = savingsGoal(base);
    expect(r.downPaymentTarget).toBe(40_000); // 10% of 400k
    expect(r.closingCostTarget).toBe(12_000); // 3% of 400k
    expect(r.totalTarget).toBe(52_000);
  });

  it("computes percent complete and gap", () => {
    const r = savingsGoal(base);
    expect(r.percentComplete).toBeCloseTo((26_000 / 52_000) * 100, 5); // 50
    expect(r.gap).toBe(26_000);
    expect(r.reached).toBe(false);
  });

  it("caps progress at 100 and reports the goal reached", () => {
    const r = savingsGoal({ ...base, currentSaved: 60_000 });
    expect(r.percentComplete).toBe(100);
    expect(r.gap).toBe(0);
    expect(r.reached).toBe(true);
  });

  it("reaches exactly at the target", () => {
    const r = savingsGoal({ ...base, currentSaved: 52_000 });
    expect(r.reached).toBe(true);
    expect(r.gap).toBe(0);
  });

  it("clamps out-of-range percentages", () => {
    const r = savingsGoal({ ...base, downPaymentPercent: 250, closingCostPercent: -5 });
    expect(r.downPaymentTarget).toBe(400_000); // clamped to 100%
    expect(r.closingCostTarget).toBe(0); // clamped to 0%
  });

  it("handles an invalid price as a zero target", () => {
    const r = savingsGoal({ ...base, homePrice: -1 });
    expect(r.totalTarget).toBe(0);
    expect(r.percentComplete).toBe(0);
    expect(r.gap).toBe(0);
    expect(r.reached).toBe(false);
  });

  it("sanitizes negative savings to zero", () => {
    const r = savingsGoal({ ...base, currentSaved: -100 });
    expect(r.saved).toBe(0);
    expect(r.percentComplete).toBe(0);
  });

  it("reports zero progress when nothing is saved", () => {
    const r = savingsGoal({ ...base, currentSaved: 0 });
    expect(r.percentComplete).toBe(0);
    expect(r.gap).toBe(52_000);
  });
});

describe("CREDIT_CHECKLIST", () => {
  it("provides educational steps with unique ids", () => {
    expect(CREDIT_CHECKLIST.length).toBeGreaterThan(0);
    const ids = CREDIT_CHECKLIST.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of CREDIT_CHECKLIST) {
      expect(item.label).toBeTruthy();
      expect(item.detail).toBeTruthy();
    }
  });
});
