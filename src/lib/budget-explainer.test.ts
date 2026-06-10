import { describe, expect, it } from "vitest";
import { explainBudget } from "./budget-explainer";
import { monthlyPITI } from "./budget";

const breakdown = (over: Partial<Parameters<typeof monthlyPITI>[0]> = {}) =>
  monthlyPITI({
    price: 400_000,
    downPct: 10,
    ratePct: 6.5,
    termYears: 30,
    propTaxYr: 4_400,
    insuranceYr: 1_500,
    hoaMo: 0,
    pmiRatePct: 0.5,
    ...over,
  });

describe("explainBudget", () => {
  it("returns an empty-state insight when the payment is zero", () => {
    const out = explainBudget(monthlyPITI({ price: 0, downPct: 0, ratePct: 0, termYears: 0, propTaxYr: 0, insuranceYr: 0, hoaMo: 0, pmiRatePct: 0 }));
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("empty");
  });

  it("flags PMI with shed-it guidance when down < 20%", () => {
    const out = explainBudget(breakdown({ downPct: 10 }));
    const pmi = out.find((i) => i.id === "pmi");
    expect(pmi).toBeTruthy();
    expect(pmi!.tone).toBe("watch");
    expect(pmi!.body.toLowerCase()).toContain("20% equity");
  });

  it("reports no PMI when down >= 20%", () => {
    const out = explainBudget(breakdown({ downPct: 20 }));
    expect(out.find((i) => i.id === "no-pmi")).toBeTruthy();
    expect(out.find((i) => i.id === "pmi")).toBeUndefined();
  });

  it("always narrates the payment composition and the levers", () => {
    const out = explainBudget(breakdown());
    expect(out.find((i) => i.id === "composition")).toBeTruthy();
    expect(out.find((i) => i.id === "levers")).toBeTruthy();
  });

  it("adds a DTI insight only when income is provided", () => {
    expect(explainBudget(breakdown()).find((i) => i.id === "dti")).toBeUndefined();
    const withIncome = explainBudget(breakdown(), { grossMonthlyIncome: 12_000 });
    expect(withIncome.find((i) => i.id === "dti")).toBeTruthy();
  });
});
