import { describe, expect, it } from "vitest";
import {
  NullCompsDataSource,
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
