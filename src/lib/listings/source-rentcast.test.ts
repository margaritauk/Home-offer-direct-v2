import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  RentCastListingsDataSource,
  mapRentCastListings,
  mapRentCastPropertyType,
} from "./source-rentcast";

/** A representative slice of a RentCast `/v1/listings/sale` array response. */
function sampleListingsPayload() {
  return [
    {
      id: "rc-1",
      formattedAddress: "101 Oak St, Austin, TX 78701",
      addressLine1: "101 Oak St",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      price: 510000,
      bedrooms: 3,
      bathrooms: 2,
      squareFootage: 1950,
      propertyType: "Single Family",
      yearBuilt: 2005,
      daysOnMarket: 12,
      status: "Active",
    },
    {
      // No formattedAddress → falls back to addressLine1. Condo type.
      id: "rc-2",
      addressLine1: "202 Pine Ave",
      city: "Austin",
      state: "tx",
      zipCode: "78702",
      price: 389000,
      bedrooms: 2,
      bathrooms: 2,
      squareFootage: 1100,
      propertyType: "Condo",
      // no yearBuilt / daysOnMarket → default 0
    },
    {
      // DROPPED: missing price.
      id: "rc-3",
      formattedAddress: "303 Elm Ct, Austin, TX 78701",
      city: "Austin",
      state: "TX",
      squareFootage: 2100,
      propertyType: "Townhouse",
    },
    {
      // DROPPED: missing squareFootage.
      id: "rc-4",
      formattedAddress: "404 Maple Dr, Austin, TX 78701",
      price: 600000,
      propertyType: "Single Family",
    },
  ];
}

describe("mapRentCastPropertyType", () => {
  it("maps RentCast labels to our union, with a single-family fallback", () => {
    expect(mapRentCastPropertyType("Single Family")).toBe("single-family");
    expect(mapRentCastPropertyType("Condo")).toBe("condo");
    expect(mapRentCastPropertyType("Townhouse")).toBe("townhouse");
    expect(mapRentCastPropertyType("Multi-Family")).toBe("multi-family");
    expect(mapRentCastPropertyType("Duplex")).toBe("multi-family");
    expect(mapRentCastPropertyType("Apartment")).toBe("condo");
    // Unknown / garbage → sensible default.
    expect(mapRentCastPropertyType("Castle")).toBe("single-family");
    expect(mapRentCastPropertyType(undefined)).toBe("single-family");
  });
});

describe("mapRentCastListings", () => {
  it("maps an array and drops records missing price or sqft", () => {
    const listings = mapRentCastListings(sampleListingsPayload());

    // rc-3 (no price) and rc-4 (no sqft) dropped; rc-1, rc-2 survive.
    expect(listings).toHaveLength(2);
    expect(listings.map((l) => l.id)).toEqual(["rc-1", "rc-2"]);

    const [a, b] = listings;
    expect(a).toMatchObject({
      id: "rc-1",
      address: "101 Oak St, Austin, TX 78701",
      city: "Austin",
      state: "TX",
      zip: "78701",
      price: 510000,
      beds: 3,
      baths: 2,
      sqft: 1950,
      propertyType: "single-family",
      yearBuilt: 2005,
      daysOnMarket: 12,
      isSample: false,
    });
    expect(typeof a.description).toBe("string");
    expect(a.description.length).toBeGreaterThan(0);

    // formattedAddress missing → addressLine1; state uppercased; defaults applied.
    expect(b).toMatchObject({
      id: "rc-2",
      address: "202 Pine Ave",
      state: "TX",
      propertyType: "condo",
      yearBuilt: 0,
      daysOnMarket: 0,
      isSample: false,
    });
  });

  it("marks real listings as NOT sample", () => {
    const listings = mapRentCastListings(sampleListingsPayload());
    expect(listings.length).toBeGreaterThan(0);
    expect(listings.every((l) => l.isSample === false)).toBe(true);
  });

  it("returns [] for garbage / non-array payloads", () => {
    expect(mapRentCastListings(undefined)).toEqual([]);
    expect(mapRentCastListings(null)).toEqual([]);
    expect(mapRentCastListings(42)).toEqual([]);
    expect(mapRentCastListings("nope")).toEqual([]);
    expect(mapRentCastListings({})).toEqual([]);
    expect(mapRentCastListings({ listings: [] })).toEqual([]);
    expect(mapRentCastListings([1, null, "x"])).toEqual([]);
  });
});

describe("RentCastListingsDataSource.search", () => {
  const ORIGINAL_KEY = process.env.RENTCAST_API_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.RENTCAST_API_KEY = "test-key";
  });

  afterEach(() => {
    if (ORIGINAL_KEY === undefined) delete process.env.RENTCAST_API_KEY;
    else process.env.RENTCAST_API_KEY = ORIGINAL_KEY;
  });

  it("returns [] and does NOT call fetch when no key is set", async () => {
    delete process.env.RENTCAST_API_KEY;
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const source = new RentCastListingsDataSource();
    expect(await source.search({ state: "TX" })).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("maps + post-filters a mocked OK response and sends the key header", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(sampleListingsPayload()), { status: 200 }),
    );

    const source = new RentCastListingsDataSource();
    // Post-filter: minBeds 3 should drop rc-2 (2 beds) even though the API
    // returned it.
    const out = await source.search({ city: "Austin", state: "TX", minBeds: 3 });

    expect(out.map((l) => l.id)).toEqual(["rc-1"]);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("https://api.rentcast.io/v1/listings/sale");
    expect(url).toContain("city=Austin");
    expect(url).toContain("state=TX");
    expect(url).toContain("status=Active");
    expect(url).toContain("limit=50");
    expect((init.headers as Record<string, string>)["X-Api-Key"]).toBe(
      "test-key",
    );
  });

  it("uses a lat/lng/radius query when provided", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );
    const source = new RentCastListingsDataSource();
    await source.search({ lat: 30.26, lng: -97.74, radius: 5 });
    const [url] = fetchSpy.mock.calls[0] as [string];
    expect(url).toContain("latitude=30.26");
    expect(url).toContain("longitude=-97.74");
    expect(url).toContain("radius=5");
  });

  it("returns [] on a non-OK response (never throws)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("error", { status: 500 }),
    );
    const source = new RentCastListingsDataSource();
    expect(await source.search({ state: "TX" })).toEqual([]);
  });

  it("returns [] when fetch throws (never throws)", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    const source = new RentCastListingsDataSource();
    expect(await source.search({ state: "TX" })).toEqual([]);
  });
});

import { rentcastHasLocation } from "./source-rentcast";

describe("rentcastHasLocation", () => {
  it("is true with lat+lng, zip, city, or state; false otherwise", () => {
    expect(rentcastHasLocation({ lat: 30, lng: -97 })).toBe(true);
    expect(rentcastHasLocation({ zip: "78704" })).toBe(true);
    expect(rentcastHasLocation({ city: "Austin" })).toBe(true);
    expect(rentcastHasLocation({ state: "TX" })).toBe(true);
    expect(rentcastHasLocation({})).toBe(false);
    expect(rentcastHasLocation({ minBeds: 3, maxPrice: 500000 })).toBe(false);
  });
});

describe("RentCastListingsDataSource location guard", () => {
  it("returns [] without firing a request when there is no location", async () => {
    const prev = process.env.RENTCAST_API_KEY;
    process.env.RENTCAST_API_KEY = "rc-test";
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const out = await new RentCastListingsDataSource().search({ minBeds: 3 });
    expect(out).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
    process.env.RENTCAST_API_KEY = prev;
  });
});
