import { describe, expect, it } from "vitest";
import { mapRentCastMarket } from "./source-rentcast";

describe("mapRentCastMarket — defensive mapping (unverified field-name spike)", () => {
  it("maps a plausible payload (averageDaysOnMarket, medianPrice)", () => {
    const stats = mapRentCastMarket(
      { averageDaysOnMarket: 22, medianPrice: 425000, lastUpdatedDate: "2026-05-01" },
      { zip: "78701" },
    );
    expect(stats).not.toBeNull();
    expect(stats?.daysOnMarket).toBe(22);
    expect(stats?.medianPrice).toBe(425000);
    expect(stats?.source).toBe("rentcast");
    expect(stats?.asOf).toBe("2026-05-01");
  });

  it("probes alternate field names (medianDaysOnMarket, medianListPrice)", () => {
    const stats = mapRentCastMarket({
      medianDaysOnMarket: 18,
      medianListPrice: 390000,
    });
    expect(stats?.daysOnMarket).toBe(18);
    expect(stats?.medianPrice).toBe(390000);
  });

  it("reads nested saleData fields", () => {
    const stats = mapRentCastMarket({
      saleData: { averageDaysOnMarket: 40, medianPrice: 500000 },
    });
    expect(stats?.daysOnMarket).toBe(40);
    expect(stats?.medianPrice).toBe(500000);
  });

  it("never maps list-to-sale or months-of-supply (manual-only fields)", () => {
    const stats = mapRentCastMarket({ averageDaysOnMarket: 20, medianPrice: 1 });
    expect(stats?.listToSaleRatio).toBeUndefined();
    expect(stats?.monthsOfSupply).toBeUndefined();
  });

  it("non-object payload → null", () => {
    expect(mapRentCastMarket(null)).toBeNull();
    expect(mapRentCastMarket("nope")).toBeNull();
    expect(mapRentCastMarket(42)).toBeNull();
  });

  it("payload with no usable numeric field → null (manual fallback)", () => {
    expect(mapRentCastMarket({ unrelated: "x" })).toBeNull();
  });

  it("falls back to today's date when no date field is present", () => {
    const stats = mapRentCastMarket({ averageDaysOnMarket: 12 });
    expect(stats?.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("prefers the query areaLabel for the label", () => {
    const stats = mapRentCastMarket(
      { averageDaysOnMarket: 12, zipCode: "78701" },
      { areaLabel: "Downtown · SFH" },
    );
    expect(stats?.areaLabel).toBe("Downtown · SFH");
  });
});
