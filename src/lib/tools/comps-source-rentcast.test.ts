import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  RentCastCompsDataSource,
  mapRentCastComparables,
} from "./comps-source-rentcast";

/** A representative slice of a RentCast `/v1/avm/value` response. */
function sampleAvmPayload() {
  return {
    price: 525000,
    comparables: [
      {
        id: "rc-1",
        formattedAddress: "101 Oak St, Austin, TX 78701",
        addressLine1: "101 Oak St",
        city: "Austin",
        state: "TX",
        price: 510000,
        squareFootage: 1950,
        bedrooms: 3,
        bathrooms: 2,
        distance: 0.4,
        lastSeenDate: "2025-03-01T00:00:00.000Z",
        removedDate: "2025-03-02T00:00:00.000Z",
        listedDate: "2025-01-15T00:00:00.000Z",
      },
      {
        // Missing formattedAddress → falls back to addressLine1; no lastSeen →
        // falls back to removedDate.
        id: "rc-2",
        addressLine1: "202 Pine Ave",
        city: "Austin",
        state: "TX",
        price: 489000,
        squareFootage: 1820,
        bedrooms: 3,
        bathrooms: 2,
        distance: 0.7,
        removedDate: "2025-02-10T00:00:00.000Z",
      },
      {
        // DROPPED: no price.
        id: "rc-3",
        formattedAddress: "303 Elm Ct, Austin, TX 78701",
        city: "Austin",
        state: "TX",
        squareFootage: 2100,
        distance: 1.1,
        lastSeenDate: "2025-02-20T00:00:00.000Z",
      },
    ],
  };
}

describe("mapRentCastComparables", () => {
  it("maps a representative payload and drops comps missing price/sqft", () => {
    const comps = mapRentCastComparables(sampleAvmPayload());

    // rc-3 (no price) is dropped; rc-1 and rc-2 survive.
    expect(comps).toHaveLength(2);
    expect(comps.map((c) => c.id)).toEqual(["rc-1", "rc-2"]);

    const [a, b] = comps;
    expect(a).toMatchObject({
      id: "rc-1",
      address: "101 Oak St, Austin, TX 78701",
      city: "Austin",
      state: "TX",
      salePrice: 510000,
      sqft: 1950,
      beds: 3,
      baths: 2,
      distanceMiles: 0.4,
      // lastSeenDate wins over removedDate/listedDate.
      saleDate: "2025-03-01T00:00:00.000Z",
    });

    // formattedAddress missing → addressLine1; lastSeenDate missing → removedDate.
    expect(b).toMatchObject({
      id: "rc-2",
      address: "202 Pine Ave",
      saleDate: "2025-02-10T00:00:00.000Z",
    });
  });

  it("never flags real comps as sample", () => {
    const comps = mapRentCastComparables(sampleAvmPayload());
    expect(comps.length).toBeGreaterThan(0);
    expect(comps.every((c) => c.sample === undefined)).toBe(true);
  });

  it("falls back from squareFootage drop: drops a comp missing sqft", () => {
    const comps = mapRentCastComparables({
      comparables: [
        {
          id: "rc-x",
          formattedAddress: "1 A St",
          price: 400000,
          // no squareFootage
        },
      ],
    });
    expect(comps).toEqual([]);
  });

  it("returns [] for garbage / missing comparables", () => {
    expect(mapRentCastComparables(undefined)).toEqual([]);
    expect(mapRentCastComparables(null)).toEqual([]);
    expect(mapRentCastComparables(42)).toEqual([]);
    expect(mapRentCastComparables("nope")).toEqual([]);
    expect(mapRentCastComparables({})).toEqual([]);
    expect(mapRentCastComparables({ comparables: "x" })).toEqual([]);
    expect(mapRentCastComparables({ comparables: [1, 2, null] })).toEqual([]);
  });
});

describe("RentCastCompsDataSource.fetchRecentSales", () => {
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

    const source = new RentCastCompsDataSource();
    const out = await source.fetchRecentSales({ label: "1 Main St" });

    expect(out).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns [] and does NOT call fetch when no address is given", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const source = new RentCastCompsDataSource();
    expect(await source.fetchRecentSales({})).toEqual([]);
    expect(await source.fetchRecentSales({ label: "   " })).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("maps comps from a mocked OK response and sends the key header", async () => {
    const payload = sampleAvmPayload();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(payload), { status: 200 }),
    );

    const source = new RentCastCompsDataSource();
    const out = await source.fetchRecentSales({ label: "123 Main St, Austin, TX" });

    expect(out).toHaveLength(2);
    expect(out.map((c) => c.id)).toEqual(["rc-1", "rc-2"]);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("https://api.rentcast.io/v1/avm/value");
    expect(url).toContain(`address=${encodeURIComponent("123 Main St, Austin, TX")}`);
    expect(url).toContain("compCount=8");
    expect((init.headers as Record<string, string>)["X-Api-Key"]).toBe("test-key");
  });

  it("returns [] on a non-OK response (never throws)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("error", { status: 500 }),
    );
    const source = new RentCastCompsDataSource();
    expect(await source.fetchRecentSales({ label: "1 Main St" })).toEqual([]);
  });

  it("returns [] when fetch throws (never throws)", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    const source = new RentCastCompsDataSource();
    expect(await source.fetchRecentSales({ label: "1 Main St" })).toEqual([]);
  });
});
