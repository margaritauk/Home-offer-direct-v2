import { describe, expect, it } from "vitest";
import {
  NullCompsDataSource,
  SampleCompsDataSource,
  getCompsDataSource,
} from "./comps-source";

describe("NullCompsDataSource", () => {
  it("returns no candidates (never fabricates)", async () => {
    const sales = await NullCompsDataSource.fetchRecentSales({
      label: "123 Main St",
      sqft: 2000,
      city: "Austin",
      state: "TX",
    });
    expect(sales).toEqual([]);
  });
});

describe("getCompsDataSource", () => {
  it("defaults to the null source (no real feed configured)", async () => {
    const source = getCompsDataSource();
    expect(await source.fetchRecentSales({})).toEqual([]);
  });
});

describe("SampleCompsDataSource", () => {
  it("returns a non-empty set, every record flagged sample:true", async () => {
    const sales = await SampleCompsDataSource.fetchRecentSales({
      label: "123 Main St",
      sqft: 2000,
      city: "Austin",
      state: "TX",
    });
    expect(sales.length).toBeGreaterThan(0);
    expect(sales.every((s) => s.sample === true)).toBe(true);
    expect(new Set(sales.map((s) => s.id)).size).toBe(sales.length);
  });

  it("returns plausible, positive sqft/price candidates near the subject", async () => {
    const sales = await SampleCompsDataSource.fetchRecentSales({ sqft: 2000 });
    for (const s of sales) {
      expect(s.sqft).toBeGreaterThan(0);
      expect(s.salePrice).toBeGreaterThan(0);
      // Sample sqft stays within a sane band of the subject (±15%).
      expect(Math.abs(s.sqft - 2000)).toBeLessThanOrEqual(2000 * 0.15);
    }
  });

  it("still returns a reasonable default set when subject has no usable sqft", async () => {
    const sales = await SampleCompsDataSource.fetchRecentSales({});
    expect(sales.length).toBeGreaterThan(0);
    expect(sales.every((s) => s.sample === true && s.sqft > 0)).toBe(true);
  });

  it("is deterministic for the same subject", async () => {
    const subject = { sqft: 1850, city: "Austin", state: "TX" };
    const a = await SampleCompsDataSource.fetchRecentSales(subject);
    const b = await SampleCompsDataSource.fetchRecentSales(subject);
    expect(a).toEqual(b);
  });
});
