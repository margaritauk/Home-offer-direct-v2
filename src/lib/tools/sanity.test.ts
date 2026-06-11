import { describe, expect, it } from "vitest";
import { budgetSanity, savingsSanity, type SanityNote } from "./sanity";
import type { PitiInput, AffordabilityInput } from "../budget";
import type { SavingsInput } from "../savings";

function ids(notes: SanityNote[]): string[] {
  return notes.map((n) => n.id);
}

// A clean, plausible payment-mode input — no flags expected.
const CLEAN_PITI: PitiInput = {
  price: 400_000,
  downPct: 10,
  ratePct: 6.5,
  termYears: 30,
  propTaxYr: 4_400, // 1.1% of price
  insuranceYr: 1_500,
  hoaMo: 0,
  pmiRatePct: 0.5,
};

// A clean affordability-mode input.
const CLEAN_AFFORD: AffordabilityInput = {
  grossMonthlyIncome: 9_000,
  monthlyDebts: 500,
  downPayment: 40_000,
  ratePct: 6.5,
  termYears: 30,
  propTaxRatePct: 1.1,
  insuranceYr: 1_500,
  hoaMo: 0,
  pmiRatePct: 0.5,
};

const CLEAN_SAVINGS: SavingsInput = {
  homePrice: 400_000,
  downPaymentPercent: 10,
  buyerCommissionPercent: 2.5,
  captureRatePercent: 80,
  closingCostPercent: 3,
};

describe("budgetSanity (payment mode)", () => {
  it("returns [] for clean inputs", () => {
    expect(budgetSanity(CLEAN_PITI)).toEqual([]);
  });

  it("flags a 100% down payment (all-cash, no loan)", () => {
    expect(ids(budgetSanity({ ...CLEAN_PITI, downPct: 100 }))).toContain(
      "down-ge-price",
    );
  });

  it("does NOT flag a 99% down payment (boundary: only ≥100 flags)", () => {
    expect(ids(budgetSanity({ ...CLEAN_PITI, downPct: 99 }))).not.toContain(
      "down-ge-price",
    );
  });

  it("flags a PMI rate above 2% (exclusive boundary)", () => {
    // Exactly 2% is NOT flagged...
    expect(ids(budgetSanity({ ...CLEAN_PITI, pmiRatePct: 2 }))).not.toContain(
      "pmi-high",
    );
    // ...2.01% IS flagged.
    expect(ids(budgetSanity({ ...CLEAN_PITI, pmiRatePct: 2.01 }))).toContain(
      "pmi-high",
    );
  });

  it("flags property tax above 5% of price per year (exclusive boundary)", () => {
    // Exactly 5% (20,000 / 400,000) is NOT flagged.
    expect(
      ids(budgetSanity({ ...CLEAN_PITI, propTaxYr: 20_000 })),
    ).not.toContain("tax-high");
    // Just above 5% IS flagged.
    expect(ids(budgetSanity({ ...CLEAN_PITI, propTaxYr: 20_001 }))).toContain(
      "tax-high",
    );
  });

  it("flags an interest rate below 2% and above 9% (inclusive band 2–9)", () => {
    // Boundaries 2 and 9 are inside the band → not flagged.
    expect(ids(budgetSanity({ ...CLEAN_PITI, ratePct: 2 }))).not.toContain(
      "rate-band",
    );
    expect(ids(budgetSanity({ ...CLEAN_PITI, ratePct: 9 }))).not.toContain(
      "rate-band",
    );
    // Outside the band → flagged.
    expect(ids(budgetSanity({ ...CLEAN_PITI, ratePct: 1.99 }))).toContain(
      "rate-band",
    );
    expect(ids(budgetSanity({ ...CLEAN_PITI, ratePct: 9.01 }))).toContain(
      "rate-band",
    );
  });

  it("emits all four watch notes when every condition holds", () => {
    const notes = budgetSanity({
      ...CLEAN_PITI,
      downPct: 100,
      pmiRatePct: 3,
      propTaxYr: 30_000,
      ratePct: 12,
    });
    expect(ids(notes).sort()).toEqual(
      ["down-ge-price", "pmi-high", "rate-band", "tax-high"].sort(),
    );
    expect(notes.every((n) => n.tone === "watch")).toBe(true);
  });
});

describe("budgetSanity (affordability mode)", () => {
  it("returns [] for clean inputs", () => {
    expect(budgetSanity(CLEAN_PITI, CLEAN_AFFORD)).toEqual([]);
  });

  it("flags a down payment ≥ the home price", () => {
    const notes = budgetSanity(
      { ...CLEAN_PITI, price: 300_000 },
      { ...CLEAN_AFFORD, downPayment: 300_000 },
    );
    expect(ids(notes)).toContain("down-ge-price");
  });

  it("flags a property-tax RATE above 5%/yr", () => {
    expect(
      ids(budgetSanity(CLEAN_PITI, { ...CLEAN_AFFORD, propTaxRatePct: 6 })),
    ).toContain("tax-high");
    // Exactly 5% is not flagged.
    expect(
      ids(budgetSanity(CLEAN_PITI, { ...CLEAN_AFFORD, propTaxRatePct: 5 })),
    ).not.toContain("tax-high");
  });

  it("flags an out-of-band interest rate (shared with payment mode)", () => {
    expect(
      ids(budgetSanity(CLEAN_PITI, { ...CLEAN_AFFORD, ratePct: 11 })),
    ).toContain("rate-band");
  });
});

describe("savingsSanity", () => {
  it("returns [] for clean inputs", () => {
    expect(savingsSanity(CLEAN_SAVINGS)).toEqual([]);
  });

  it("flags a 100% capture rate as a best case", () => {
    const notes = savingsSanity({ ...CLEAN_SAVINGS, captureRatePercent: 100 });
    expect(ids(notes)).toContain("capture-full");
    expect(notes.find((n) => n.id === "capture-full")?.message).toMatch(
      /best case/i,
    );
  });

  it("flags a buyer commission above 3.5% (exclusive boundary)", () => {
    // Exactly 3.5% not flagged.
    expect(
      ids(savingsSanity({ ...CLEAN_SAVINGS, buyerCommissionPercent: 3.5 })),
    ).not.toContain("commission-high");
    // 3.51% flagged.
    expect(
      ids(savingsSanity({ ...CLEAN_SAVINGS, buyerCommissionPercent: 3.51 })),
    ).toContain("commission-high");
  });

  it("flags closing costs outside the 2–5% band (inclusive boundaries)", () => {
    expect(
      ids(savingsSanity({ ...CLEAN_SAVINGS, closingCostPercent: 2 })),
    ).not.toContain("closing-band");
    expect(
      ids(savingsSanity({ ...CLEAN_SAVINGS, closingCostPercent: 5 })),
    ).not.toContain("closing-band");
    expect(
      ids(savingsSanity({ ...CLEAN_SAVINGS, closingCostPercent: 1.5 })),
    ).toContain("closing-band");
    expect(
      ids(savingsSanity({ ...CLEAN_SAVINGS, closingCostPercent: 6 })),
    ).toContain("closing-band");
  });

  it("every emitted note is framed as a watch (never advice)", () => {
    const notes = savingsSanity({
      ...CLEAN_SAVINGS,
      captureRatePercent: 100,
      buyerCommissionPercent: 4,
      closingCostPercent: 6,
    });
    expect(notes.length).toBe(3);
    expect(notes.every((n) => n.tone === "watch")).toBe(true);
    // No "you should" advice phrasing.
    expect(notes.some((n) => /you should/i.test(n.message))).toBe(false);
  });
});
