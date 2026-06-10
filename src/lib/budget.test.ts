import { describe, expect, it } from "vitest";
import {
  DEFAULT_BACK_CAP_PCT,
  DEFAULT_FRONT_CAP_PCT,
  DEFAULT_PMI_RATE_PCT,
  backEndRatio,
  frontEndRatio,
  maxAffordablePrice,
  monthlyPI,
  monthlyPITI,
  type AffordabilityInput,
  type PitiInput,
} from "./budget";

describe("monthlyPI", () => {
  it("matches a known amortization value ($300k @ 6% / 30yr ≈ $1,798.65)", () => {
    expect(monthlyPI(300_000, 6, 360)).toBeCloseTo(1798.65, 1);
  });

  it("falls back to straight-line P/n at a 0% rate", () => {
    // $360k over 360 months with no interest = exactly $1,000/mo.
    expect(monthlyPI(360_000, 0, 360)).toBe(1_000);
  });

  it("treats a negative/invalid rate like 0% (straight-line)", () => {
    expect(monthlyPI(120_000, -3, 240)).toBe(500);
  });

  it("returns 0 for non-positive principal", () => {
    expect(monthlyPI(0, 6, 360)).toBe(0);
    expect(monthlyPI(-100_000, 6, 360)).toBe(0);
  });

  it("returns 0 for non-positive term", () => {
    expect(monthlyPI(300_000, 6, 0)).toBe(0);
    expect(monthlyPI(300_000, 6, -12)).toBe(0);
  });
});

describe("monthlyPITI", () => {
  // 10% down → LTV 90% → PMI present.
  const lowDown: PitiInput = {
    price: 400_000,
    downPct: 10,
    ratePct: 6,
    termYears: 30,
    propTaxYr: 4_800, // $400/mo
    insuranceYr: 1_200, // $100/mo
    hoaMo: 150,
    pmiRatePct: DEFAULT_PMI_RATE_PCT, // 0.5%
  };

  it("adds PMI when down payment < 20% (LTV > 80%)", () => {
    const b = monthlyPITI(lowDown);
    expect(b.loanAmount).toBe(360_000);
    expect(b.ltv).toBeCloseTo(90, 6);

    // P&I on $360k @ 6%/30yr.
    expect(b.pi).toBeCloseTo(2158.38, 1);
    expect(b.tax).toBe(400);
    expect(b.insurance).toBe(100);
    expect(b.hoa).toBe(150);
    // PMI = 360k * 0.5% / 12 = 150.
    expect(b.pmi).toBeCloseTo(150, 6);
    expect(b.pmi).toBeGreaterThan(0);

    // Total = sum of parts.
    expect(b.total).toBeCloseTo(
      b.pi + b.tax + b.insurance + b.hoa + b.pmi,
      6,
    );
  });

  it("drops PMI to 0 once down payment ≥ 20% (LTV ≤ 80%)", () => {
    const b = monthlyPITI({ ...lowDown, downPct: 20 });
    expect(b.loanAmount).toBe(320_000);
    expect(b.ltv).toBeCloseTo(80, 6);
    expect(b.pmi).toBe(0);
    expect(b.total).toBeCloseTo(b.pi + b.tax + b.insurance + b.hoa, 6);
  });

  it("includes HOA in the total", () => {
    const withHoa = monthlyPITI({ ...lowDown, downPct: 25, hoaMo: 200 });
    const noHoa = monthlyPITI({ ...lowDown, downPct: 25, hoaMo: 0 });
    expect(withHoa.total - noHoa.total).toBeCloseTo(200, 6);
  });

  it("computes ltv correctly", () => {
    const b = monthlyPITI({ ...lowDown, downPct: 5 });
    expect(b.ltv).toBeCloseTo(95, 6);
  });
});

describe("DTI helpers", () => {
  it("front-end ratio = housing / income, returned as a fraction", () => {
    // $2,240 housing on $8,000 income = 0.28.
    expect(frontEndRatio(2_240, 8_000)).toBeCloseTo(0.28, 6);
  });

  it("back-end ratio = (housing + debts) / income, as a fraction", () => {
    // (2,240 + 640) / 8,000 = 0.36.
    expect(backEndRatio(2_240, 640, 8_000)).toBeCloseTo(0.36, 6);
  });

  it("guards divide-by-zero income → 0", () => {
    expect(frontEndRatio(2_000, 0)).toBe(0);
    expect(backEndRatio(2_000, 500, 0)).toBe(0);
  });
});

describe("maxAffordablePrice", () => {
  const base: AffordabilityInput = {
    grossMonthlyIncome: 8_000,
    monthlyDebts: 500,
    downPayment: 60_000,
    ratePct: 6,
    termYears: 30,
    propTaxRatePct: 1.2,
    insuranceYr: 1_200,
    hoaMo: 0,
    pmiRatePct: DEFAULT_PMI_RATE_PCT,
    // front/back default to 28/36.
  };

  it("front-end constraint binds when front cap is the lower side", () => {
    // front = 0.28*8000 = 2240; back = 0.36*8000 - 500 = 2380 → front binds.
    const r = maxAffordablePrice(base);
    expect(r.bindingConstraint).toBe("front");
    // Housing cap is 2240; solved PITI must fit within it (to the dollar).
    expect(r.piti.total).toBeLessThanOrEqual(2_240 + 1);
    // And it should be close to the cap (solver maximizes price).
    expect(r.piti.total).toBeGreaterThan(2_240 - 5);
    expect(r.maxPrice).toBeGreaterThan(0);
    expect(r.maxLoan).toBe(r.maxPrice - 60_000);
    // Taxes/insurance/PMI are reflected in the breakdown.
    expect(r.piti.tax).toBeGreaterThan(0);
    expect(r.piti.insurance).toBe(100);
  });

  it("back-end constraint binds when debts push the back cap below the front cap", () => {
    // income 10k, debts 2.5k: front = 2800; back = 0.36*10000 - 2500 = 1100 → back binds.
    const r = maxAffordablePrice({
      ...base,
      grossMonthlyIncome: 10_000,
      monthlyDebts: 2_500,
    });
    expect(r.bindingConstraint).toBe("back");
    expect(r.piti.total).toBeLessThanOrEqual(1_100 + 1);
    expect(r.piti.total).toBeGreaterThan(1_100 - 5);
    expect(r.maxPrice).toBeGreaterThan(0);
  });

  it("reflects PMI in the solved PITI when the down payment is small", () => {
    // Tiny fixed down payment on a sizable price → LTV > 80% → PMI > 0.
    const r = maxAffordablePrice({ ...base, downPayment: 5_000 });
    expect(r.piti.ltv).toBeGreaterThan(80);
    expect(r.piti.pmi).toBeGreaterThan(0);
  });

  it("honors the higher 43% back cap as an option", () => {
    const standard = maxAffordablePrice({
      ...base,
      grossMonthlyIncome: 10_000,
      monthlyDebts: 2_500,
    });
    const relaxed = maxAffordablePrice({
      ...base,
      grossMonthlyIncome: 10_000,
      monthlyDebts: 2_500,
      backCapPct: 43,
    });
    // A looser back cap allows a higher price.
    expect(relaxed.maxPrice).toBeGreaterThan(standard.maxPrice);
  });

  it("returns maxPrice 0 when debts exceed the back cap (cap ≤ 0)", () => {
    const r = maxAffordablePrice({
      ...base,
      grossMonthlyIncome: 4_000,
      monthlyDebts: 2_000, // back cap = 0.36*4000 - 2000 = -560 < 0.
    });
    expect(r.maxPrice).toBe(0);
    expect(r.maxLoan).toBe(0);
    expect(r.bindingConstraint).toBe("back");
  });

  it("returns maxPrice 0 when income is 0", () => {
    const r = maxAffordablePrice({ ...base, grossMonthlyIncome: 0 });
    expect(r.maxPrice).toBe(0);
    expect(r.maxLoan).toBe(0);
  });
});

describe("exported defaults", () => {
  it("exposes shared DTI/PMI constants", () => {
    expect(DEFAULT_FRONT_CAP_PCT).toBe(28);
    expect(DEFAULT_BACK_CAP_PCT).toBe(36);
    expect(DEFAULT_PMI_RATE_PCT).toBeCloseTo(0.5, 6);
  });
});
