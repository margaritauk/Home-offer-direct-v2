import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  MockListingsDataSource,
  allListings,
  getListingById,
  getListingsDataSource,
  listingStates,
  queryListings,
  searchListings,
} from "./provider";
import { RentCastListingsDataSource } from "./source-rentcast";
import { mockListings } from "./mock-data";

describe("mock listings dataset", () => {
  it("has entries, all flagged as samples with unique ids", () => {
    expect(mockListings.length).toBeGreaterThan(0);
    expect(mockListings.every((l) => l.isSample === true)).toBe(true);
    const ids = mockListings.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("queryListings", () => {
  it("returns everything with no filters", () => {
    expect(queryListings()).toHaveLength(mockListings.length);
  });

  it("filters by state (case-insensitive)", () => {
    const state = listingStates()[0];
    const lower = queryListings({ state: state.toLowerCase() });
    expect(lower.length).toBeGreaterThan(0);
    expect(lower.every((l) => l.state === state)).toBe(true);
  });

  it("filters by max price", () => {
    expect(queryListings({ maxPrice: 400_000 }).every((l) => l.price <= 400_000)).toBe(true);
  });

  it("filters by minimum beds and baths", () => {
    expect(queryListings({ minBeds: 3 }).every((l) => l.beds >= 3)).toBe(true);
    expect(queryListings({ minBaths: 2 }).every((l) => l.baths >= 2)).toBe(true);
  });

  it("filters by property type", () => {
    expect(queryListings({ propertyType: "condo" }).every((l) => l.propertyType === "condo")).toBe(true);
  });

  it("matches the free-text query against address/city", () => {
    const sample = mockListings[0];
    const results = queryListings({ query: sample.city });
    expect(results.some((l) => l.id === sample.id)).toBe(true);
  });

  it("matches the free-text query against the description (case-insensitive)", () => {
    // Pick a word that lives ONLY in some listing's description, not in its
    // address/city/state/zip — so a hit proves description is searched.
    const target = mockListings.find((l) => {
      const meta = `${l.address} ${l.city} ${l.state} ${l.zip}`.toLowerCase();
      return l.description
        .toLowerCase()
        .split(/[^a-z]+/)
        .some((w) => w.length > 4 && !meta.includes(w));
    });
    expect(target).toBeDefined();
    const meta = `${target!.address} ${target!.city} ${target!.state} ${target!.zip}`.toLowerCase();
    const word = target!.description
      .toLowerCase()
      .split(/[^a-z]+/)
      .find((w) => w.length > 4 && !meta.includes(w))!;

    const results = queryListings({ query: word.toUpperCase() });
    expect(results.some((l) => l.id === target!.id)).toBe(true);
  });

  it("filters by a min+max price combo", () => {
    const res = queryListings({ minPrice: 400_000, maxPrice: 900_000 });
    expect(res.length).toBeGreaterThan(0);
    expect(res.every((l) => l.price >= 400_000 && l.price <= 900_000)).toBe(true);
  });

  it("sorts by price ascending and descending", () => {
    const asc = queryListings({ sort: "price-asc" }).map((l) => l.price);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    const desc = queryListings({ sort: "price-desc" }).map((l) => l.price);
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
  });

  it("sorts by newest (fewest days on market) by default", () => {
    const days = queryListings().map((l) => l.daysOnMarket);
    expect(days).toEqual([...days].sort((a, b) => a - b));
  });

  it("combines filters", () => {
    const res = queryListings({ minBeds: 2, maxPrice: 900_000, sort: "price-asc" });
    expect(res.every((l) => l.beds >= 2 && l.price <= 900_000)).toBe(true);
  });
});

describe("lookups", () => {
  it("getListingById finds and misses correctly", () => {
    expect(getListingById(mockListings[0].id)?.id).toBe(mockListings[0].id);
    expect(getListingById("nope-does-not-exist")).toBeUndefined();
  });

  it("listingStates returns sorted unique codes", () => {
    const s = listingStates();
    expect(s).toEqual([...s].sort());
    expect(new Set(s).size).toBe(s.length);
  });

  it("allListings returns the full set", () => {
    expect(allListings()).toHaveLength(mockListings.length);
  });
});

describe("listings data-source seam", () => {
  const ORIGINAL_SOURCE = process.env.LISTINGS_DATA_SOURCE;
  const ORIGINAL_KEY = process.env.RENTCAST_API_KEY;

  beforeEach(() => {
    delete process.env.LISTINGS_DATA_SOURCE;
    delete process.env.RENTCAST_API_KEY;
  });

  afterEach(() => {
    if (ORIGINAL_SOURCE === undefined) delete process.env.LISTINGS_DATA_SOURCE;
    else process.env.LISTINGS_DATA_SOURCE = ORIGINAL_SOURCE;
    if (ORIGINAL_KEY === undefined) delete process.env.RENTCAST_API_KEY;
    else process.env.RENTCAST_API_KEY = ORIGINAL_KEY;
  });

  it("defaults to the mock source", () => {
    expect(getListingsDataSource()).toBeInstanceOf(MockListingsDataSource);
  });

  it("stays on mock when source=rentcast but no key is set", () => {
    process.env.LISTINGS_DATA_SOURCE = "rentcast";
    expect(getListingsDataSource()).toBeInstanceOf(MockListingsDataSource);
  });

  it("selects RentCast when source=rentcast AND a key is set", () => {
    process.env.LISTINGS_DATA_SOURCE = "rentcast";
    process.env.RENTCAST_API_KEY = "test-key";
    expect(getListingsDataSource()).toBeInstanceOf(RentCastListingsDataSource);
  });

  it("searchListings goes through the mock seam by default", async () => {
    const res = await searchListings({ propertyType: "condo" });
    expect(res.length).toBeGreaterThan(0);
    expect(res.every((l) => l.propertyType === "condo" && l.isSample)).toBe(true);
  });

  it("MockListingsDataSource.getById resolves a known id", async () => {
    const src = new MockListingsDataSource();
    expect((await src.getById(mockListings[0].id))?.id).toBe(mockListings[0].id);
    expect(await src.getById("nope")).toBeUndefined();
  });
});
