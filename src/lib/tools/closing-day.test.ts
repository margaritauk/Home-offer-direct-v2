import { describe, expect, it } from "vitest";
import {
  STANDARD_CLOSING_DAY_ITEMS,
  cashToClose,
  type CashToCloseInput,
} from "./closing-day";

function input(over: Partial<CashToCloseInput> = {}): CashToCloseInput {
  return {
    downPayment: 0,
    closingCosts: 0,
    lenderCredit: 0,
    sellerCredit: 0,
    earnestMoneyPaid: 0,
    ...over,
  };
}

describe("STANDARD_CLOSING_DAY_ITEMS", () => {
  it("has unique, stable ids", () => {
    const ids = STANDARD_CLOSING_DAY_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers the core closing-day reminders", () => {
    const ids = STANDARD_CLOSING_DAY_ITEMS.map((i) => i.id);
    expect(ids).toContain("photo-id");
    expect(ids).toContain("funds");
    expect(ids).toContain("insurance");
    expect(ids).toContain("walkthrough");
    expect(ids).toContain("no-new-credit");
  });
});

describe("cashToClose", () => {
  it("computes down + costs − credits − earnest = total (worked example)", () => {
    const result = cashToClose(
      input({
        downPayment: 40_000,
        closingCosts: 9_000,
        lenderCredit: 1_500,
        sellerCredit: 3_000,
        earnestMoneyPaid: 5_000,
      }),
    );
    // 40,000 + 9,000 − 1,500 − 3,000 − 5,000 = 39,500
    expect(result.total).toBe(39_500);
    // line items are echoed back unchanged
    expect(result.downPayment).toBe(40_000);
    expect(result.closingCosts).toBe(9_000);
    expect(result.lenderCredit).toBe(1_500);
    expect(result.sellerCredit).toBe(3_000);
    expect(result.earnestMoneyPaid).toBe(5_000);
  });

  it("floors the total at 0 when credits + earnest exceed the gross", () => {
    const result = cashToClose(
      input({
        downPayment: 10_000,
        closingCosts: 2_000,
        lenderCredit: 5_000,
        sellerCredit: 5_000,
        earnestMoneyPaid: 5_000,
      }),
    );
    // 12,000 − 15,000 = −3,000 → floored at 0
    expect(result.total).toBe(0);
  });

  it("treats non-finite inputs as 0", () => {
    const result = cashToClose(
      input({
        downPayment: Number.NaN,
        closingCosts: Number.POSITIVE_INFINITY,
        lenderCredit: Number.NaN,
        sellerCredit: 0,
        earnestMoneyPaid: 0,
      }),
    );
    expect(result.total).toBe(0);
    expect(result.downPayment).toBe(0);
    expect(result.closingCosts).toBe(0);
  });

  it("treats negative inputs as 0", () => {
    const result = cashToClose(
      input({
        downPayment: 30_000,
        closingCosts: -1_000,
        lenderCredit: -2_000,
        sellerCredit: 0,
        earnestMoneyPaid: 0,
      }),
    );
    // negative cost & credit both clamp to 0 → total is just the down payment
    expect(result.closingCosts).toBe(0);
    expect(result.lenderCredit).toBe(0);
    expect(result.total).toBe(30_000);
  });

  it("returns 0 across the board for an all-zero input", () => {
    const result = cashToClose(input());
    expect(result.total).toBe(0);
  });
});
