import { describe, expect, it } from "vitest";
import { buildSafeBudgetInput } from "./budget-input";

describe("buildSafeBudgetInput (financial-only, FHA-neutral projection)", () => {
  it("projects financial inputs and defaults the mode to payment", () => {
    const safe = buildSafeBudgetInput({
      price: 400_000,
      downPaymentPercent: 10,
      ratePct: 6.5,
      termYears: 30,
    });
    expect(safe.mode).toBe("payment");
    expect(safe.price).toBe(400_000);
    expect(safe.downPaymentPercent).toBe(10);
    expect(safe.ratePct).toBe(6.5);
    expect(safe.termYears).toBe(30);
  });

  it("keeps the affordability mode and carries income + debts when supplied", () => {
    const safe = buildSafeBudgetInput({
      mode: "affordability",
      price: 500_000,
      downPaymentPercent: 8,
      ratePct: 6,
      termYears: 30,
      grossMonthlyIncome: 9_000,
      monthlyDebts: 500,
    });
    expect(safe.mode).toBe("affordability");
    expect(safe.grossMonthlyIncome).toBe(9_000);
    expect(safe.monthlyDebts).toBe(500);
  });

  it("coerces garbage / negative numbers to safe zeros (never throws)", () => {
    const safe = buildSafeBudgetInput({
      price: Number.NaN,
      downPaymentPercent: -5,
      ratePct: Infinity,
      termYears: undefined,
    });
    expect(safe.price).toBe(0);
    expect(safe.downPaymentPercent).toBe(0);
    expect(safe.ratePct).toBe(0);
    expect(safe.termYears).toBe(0);
  });

  it("screens a free-text note for protected-class signals before the model sees it", () => {
    const safe = buildSafeBudgetInput({
      price: 400_000,
      note: "Budget for our growing family with two children",
    });
    // screenText redacts familial-status signals.
    expect(safe.note).toContain("[removed]");
    expect(safe.note).not.toMatch(/children/i);
  });

  it("omits an empty/whitespace note entirely", () => {
    expect(buildSafeBudgetInput({ price: 1, note: "   " }).note).toBeUndefined();
    expect(buildSafeBudgetInput({ price: 1 }).note).toBeUndefined();
  });
});
