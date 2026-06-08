import { describe, expect, it } from "vitest";
import {
  TERM_SHEET_DISCLAIMER,
  buildTermSheet,
  concessionAtStake,
  concessionScript,
  earnestMoneyDollars,
  termSheetToText,
} from "./term-sheet";
import type { Offer } from "./types";

function makeOffer(overrides: Partial<Offer> = {}): Offer {
  return {
    price: 400_000,
    earnestMoney: 1,
    isPercent: true,
    financingType: "conventional",
    downPaymentPercent: 10,
    closingDate: "2026-09-01",
    possession: "At closing",
    fixturesIncluded: "Refrigerator, washer/dryer",
    fixturesExcluded: "Dining room chandelier",
    closingCostPreference: "buyer-pays",
    contingencies: {
      inspection: { included: true, days: 10 },
      appraisal: { included: true, days: 17 },
      financing: { included: true, days: 21 },
      "sale-of-home": { included: false, days: 45 },
      title: { included: true, days: 14 },
      "attorney-review": { included: true, days: 5 },
    },
    concession: { type: "price-reduction", percent: 2.5 },
    updatedAt: "2026-06-07T00:00:00.000Z",
    ...overrides,
  };
}

describe("earnestMoneyDollars", () => {
  it("treats earnest money as a percent of price when isPercent", () => {
    expect(earnestMoneyDollars(makeOffer({ earnestMoney: 1, isPercent: true }))).toBe(4_000);
  });

  it("treats earnest money as a flat dollar figure otherwise", () => {
    expect(earnestMoneyDollars(makeOffer({ earnestMoney: 7_500, isPercent: false }))).toBe(7_500);
  });

  it("is safe for a non-positive price", () => {
    expect(earnestMoneyDollars(makeOffer({ price: 0, isPercent: true }))).toBe(0);
  });
});

describe("concessionAtStake", () => {
  it("computes the at-stake amount as the concession percent of price (reusing savings logic)", () => {
    // 2.5% of 400k = 10k, matching the savings calculator.
    expect(concessionAtStake(makeOffer())).toBe(10_000);
  });

  it("scales with the chosen percent", () => {
    expect(concessionAtStake(makeOffer({ concession: { type: "closing-credit", percent: 2 } }))).toBe(8_000);
  });

  it("is zero when no concession is requested", () => {
    expect(concessionAtStake(makeOffer({ concession: { type: "none", percent: 2.5 } }))).toBe(0);
  });
});

describe("buildTermSheet", () => {
  it("always carries the worksheet (not a contract) disclaimer", () => {
    expect(buildTermSheet(makeOffer()).disclaimer).toBe(TERM_SHEET_DISCLAIMER);
    expect(buildTermSheet(makeOffer()).disclaimer).toMatch(/not a binding contract/i);
  });

  it("summarizes price, earnest money, financing, dates, fixtures, and cost allocation", () => {
    const sheet = buildTermSheet(makeOffer());
    const headings = sheet.sections.map((s) => s.heading);
    expect(headings).toContain("Price & deposit");
    expect(headings).toContain("Financing");
    expect(headings).toContain("Dates & possession");
    expect(headings).toContain("Fixtures & cost allocation");
    expect(headings).toContain("Contingencies");
  });

  it("lists each contingency with included window or waived", () => {
    const sheet = buildTermSheet(makeOffer());
    const contSection = sheet.sections.find((s) => s.heading === "Contingencies")!;
    const inspection = contSection.lines.find((l) => l.label.startsWith("Inspection"))!;
    expect(inspection.value).toMatch(/Included — 10 day window/);
    const saleOfHome = contSection.lines.find((l) => l.label.startsWith("Sale-of-home"))!;
    expect(saleOfHome.value).toMatch(/Not included/);
  });

  it("omits the down payment line for cash offers", () => {
    const sheet = buildTermSheet(makeOffer({ financingType: "cash" }));
    const financing = sheet.sections.find((s) => s.heading === "Financing")!;
    expect(financing.lines.some((l) => l.label === "Down payment")).toBe(false);
  });

  it("includes a commission-savings ask section only when a concession is requested", () => {
    const withAsk = buildTermSheet(makeOffer());
    expect(withAsk.sections.some((s) => s.heading === "Commission-savings ask")).toBe(true);
    const without = buildTermSheet(makeOffer({ concession: { type: "none", percent: 0 } }));
    expect(without.sections.some((s) => s.heading === "Commission-savings ask")).toBe(false);
  });
});

describe("concessionScript", () => {
  it("produces price-reduction framing with the at-stake amount", () => {
    const script = concessionScript(makeOffer());
    expect(script).toMatch(/reduction in the purchase price/);
    expect(script).toMatch(/\$10,000/);
    expect(script).toMatch(/attorney/i);
  });

  it("produces closing-credit framing", () => {
    const script = concessionScript(makeOffer({ concession: { type: "closing-credit", percent: 2.5 } }));
    expect(script).toMatch(/closing-cost credit/);
  });

  it("is empty when no concession is requested", () => {
    expect(concessionScript(makeOffer({ concession: { type: "none", percent: 0 } }))).toBe("");
  });
});

describe("termSheetToText", () => {
  it("opens with the worksheet header and disclaimer", () => {
    const text = termSheetToText(makeOffer());
    expect(text).toMatch(/^OFFER WORKSHEET/);
    expect(text).toContain(TERM_SHEET_DISCLAIMER);
  });

  it("includes the suggested ask script when a concession is requested", () => {
    expect(termSheetToText(makeOffer())).toMatch(/Suggested ask/);
  });
});
