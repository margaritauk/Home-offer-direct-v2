import { describe, expect, it } from "vitest";
import {
  computePriceTrend,
  mapRentCastMarket,
} from "./source-rentcast";
import { classifyMarket } from "./classify";

/**
 * Representative fixture built from the CONFIRMED `/v1/markets` response shape
 * (GET /v1/markets?zipCode=60025&dataType=Sale). Trimmed: ~3 history months and
 * one dataByPropertyType entry, but the field NAMES are the confirmed ones.
 */
function fixture60025() {
  return {
    id: "60025",
    zipCode: "60025",
    saleData: {
      lastUpdatedDate: "2026-06-12T00:00:00.000Z",
      averagePrice: 987781,
      medianPrice: 685000,
      minPrice: 250000,
      maxPrice: 3500000,
      averagePricePerSquareFoot: 346.5,
      medianPricePerSquareFoot: 330.81,
      averageDaysOnMarket: 37.97,
      medianDaysOnMarket: 10,
      minDaysOnMarket: 1,
      maxDaysOnMarket: 345,
      newListings: 25,
      totalListings: 130,
      dataByPropertyType: [
        {
          propertyType: "Single Family",
          medianPrice: 700000,
          medianDaysOnMarket: 9,
        },
      ],
      history: {
        "2026-01": {
          date: "2026-01-31T00:00:00.000Z",
          medianPrice: 550000,
          medianDaysOnMarket: 48,
          totalListings: 137,
        },
        "2026-03": {
          date: "2026-03-31T00:00:00.000Z",
          medianPrice: 600000,
          medianDaysOnMarket: 30,
          totalListings: 140,
        },
        "2026-06": {
          date: "2026-06-30T00:00:00.000Z",
          medianPrice: 685000,
          medianDaysOnMarket: 10,
          totalListings: 130,
        },
      },
    },
  };
}

describe("mapRentCastMarket — confirmed /v1/markets schema", () => {
  it("maps days-on-market from saleData.medianDaysOnMarket (median primary)", () => {
    const stats = mapRentCastMarket(fixture60025(), { zip: "60025" });
    expect(stats).not.toBeNull();
    // MEDIAN leads, NOT the skewed average (37.97).
    expect(stats?.daysOnMarket).toBe(10);
  });

  it("falls back to averageDaysOnMarket when median is absent", () => {
    const payload = {
      saleData: { averageDaysOnMarket: 21, medianPrice: 400000 },
    };
    expect(mapRentCastMarket(payload)?.daysOnMarket).toBe(21);
  });

  it("carries through price + inventory context fields", () => {
    const stats = mapRentCastMarket(fixture60025());
    expect(stats?.medianPrice).toBe(685000);
    expect(stats?.averagePrice).toBe(987781);
    expect(stats?.totalListings).toBe(130);
    expect(stats?.newListings).toBe(25);
  });

  it("computes a rising price trend (latest median > earliest)", () => {
    const stats = mapRentCastMarket(fixture60025());
    // 550000 → 685000 ≈ +24.5%.
    expect(stats?.priceTrendPct).toBeCloseTo(24.5454, 2);
  });

  it("stamps asOf + label from the confirmed payload", () => {
    const stats = mapRentCastMarket(fixture60025());
    expect(stats?.asOf).toBe("2026-06-12T00:00:00.000Z");
    expect(stats?.areaLabel).toBe("60025");
    expect(stats?.source).toBe("rentcast");
  });

  it("never maps list-to-sale or months-of-supply (manual-only fields)", () => {
    const stats = mapRentCastMarket(fixture60025());
    expect(stats?.listToSaleRatio).toBeUndefined();
    expect(stats?.monthsOfSupply).toBeUndefined();
  });

  it("prefers the query areaLabel for the label", () => {
    const stats = mapRentCastMarket(fixture60025(), {
      areaLabel: "Glenview · SFH",
    });
    expect(stats?.areaLabel).toBe("Glenview · SFH");
  });

  it("falls back to today's date when no date field is present", () => {
    const stats = mapRentCastMarket({ saleData: { medianDaysOnMarket: 12 } });
    expect(stats?.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("mapRentCastMarket — safety on garbage / partial payloads", () => {
  it("non-object payload → null", () => {
    expect(mapRentCastMarket(null)).toBeNull();
    expect(mapRentCastMarket("nope")).toBeNull();
    expect(mapRentCastMarket(42)).toBeNull();
  });

  it("payload with no usable numeric field → null (manual fallback)", () => {
    expect(mapRentCastMarket({ saleData: { unrelated: "x" } })).toBeNull();
    expect(mapRentCastMarket({ unrelated: "x" })).toBeNull();
  });

  it("a partial payload (NaN / wrong types) still returns safely", () => {
    const stats = mapRentCastMarket({
      saleData: {
        medianDaysOnMarket: "not-a-number",
        medianPrice: Number.NaN,
        totalListings: 42,
      },
    });
    // totalListings is the only usable field → maps, others undefined.
    expect(stats?.totalListings).toBe(42);
    expect(stats?.daysOnMarket).toBeUndefined();
    expect(stats?.medianPrice).toBeUndefined();
    expect(stats?.priceTrendPct).toBeUndefined();
  });
});

describe("computePriceTrend — pure trend math", () => {
  it("rising when latest median > earliest (beyond flat band)", () => {
    const t = computePriceTrend({
      "2026-01": { medianPrice: 100 },
      "2026-06": { medianPrice: 150 },
    });
    expect(t?.pct).toBeCloseTo(50, 5);
    expect(t?.label).toBe("rising");
  });

  it("falling when latest < earliest beyond the band", () => {
    const t = computePriceTrend({
      "2026-01": { medianPrice: 100 },
      "2026-06": { medianPrice: 90 },
    });
    expect(t?.label).toBe("falling");
  });

  it("flat inside the ±2% band", () => {
    const t = computePriceTrend({
      "2026-01": { medianPrice: 100 },
      "2026-06": { medianPrice: 101 },
    });
    expect(t?.label).toBe("flat");
  });

  it("sorts month keys chronologically regardless of object order", () => {
    const t = computePriceTrend({
      "2026-06": { medianPrice: 150 },
      "2026-01": { medianPrice: 100 },
      "2026-03": { medianPrice: 120 },
    });
    // earliest 100 → latest 150.
    expect(t?.pct).toBeCloseTo(50, 5);
  });

  it("null with fewer than 2 usable history points", () => {
    expect(computePriceTrend({ "2026-06": { medianPrice: 685000 } })).toBeNull();
    expect(computePriceTrend({})).toBeNull();
    expect(computePriceTrend(undefined)).toBeNull();
  });

  it("null when the earliest base is non-positive", () => {
    expect(
      computePriceTrend({
        "2026-01": { medianPrice: 0 },
        "2026-06": { medianPrice: 100 },
      }),
    ).toBeNull();
  });
});

describe("classify integration — confirmed fixture yields a seller's read", () => {
  it("60025-like fixture (DOM ~10, rising prices) reads seller-leaning", () => {
    const stats = mapRentCastMarket(fixture60025(), { zip: "60025" });
    expect(stats).not.toBeNull();
    const read = classifyMarket(stats);
    // Fast DOM + rising prices → seller side, even with MoS/list-to-sale manual.
    expect(read.band).toBe("seller");
    // Classifier handles partial input gracefully (no MoS / list-to-sale here).
    expect(read.signalCount).toBe(2);
  });
});
