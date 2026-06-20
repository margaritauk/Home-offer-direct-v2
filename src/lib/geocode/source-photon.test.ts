import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mapPhotonResponse, PhotonGeocodeSource } from "./source-photon";

/** A Photon GeoJSON FeatureCollection slice across the five geographic kinds. */
function samplePhotonPayload() {
  return {
    type: "FeatureCollection",
    features: [
      {
        // City
        geometry: { coordinates: [-97.7431, 30.2672] },
        properties: {
          osm_key: "place",
          osm_value: "city",
          type: "city",
          name: "Austin",
          city: "Austin",
          county: "Travis County",
          state: "TX",
          countrycode: "US",
        },
      },
      {
        // ZIP / postcode
        geometry: { coordinates: [-97.766, 30.245] },
        properties: {
          type: "postcode",
          name: "78704",
          postcode: "78704",
          city: "Austin",
          state: "TX",
          countrycode: "US",
        },
      },
      {
        // Street address (house number present)
        geometry: { coordinates: [-97.75, 30.26] },
        properties: {
          type: "house",
          name: "Maple",
          housenumber: "123",
          street: "Maple St",
          city: "Austin",
          state: "TX",
          postcode: "78704",
          countrycode: "US",
        },
      },
      {
        // State
        geometry: { coordinates: [-99.9, 31.9] },
        properties: {
          osm_key: "place",
          osm_value: "state",
          type: "state",
          name: "Texas",
          state: "TX",
          countrycode: "US",
        },
      },
      {
        // County
        geometry: { coordinates: [-97.8, 30.3] },
        properties: {
          osm_key: "place",
          osm_value: "county",
          type: "county",
          name: "Travis County",
          county: "Travis County",
          state: "TX",
          countrycode: "US",
        },
      },
      {
        // FHA: a neighborhood/district must NOT be surfaced.
        geometry: { coordinates: [-97.74, 30.27] },
        properties: {
          osm_key: "place",
          osm_value: "suburb",
          type: "district",
          name: "Hyde Park",
          city: "Austin",
          state: "TX",
          countrycode: "US",
        },
      },
      {
        // Foreign place must be dropped (US box).
        geometry: { coordinates: [-0.12, 51.5] },
        properties: {
          type: "city",
          name: "London",
          countrycode: "GB",
        },
      },
    ],
  };
}

describe("mapPhotonResponse", () => {
  it("maps each geographic kind, tagged by kind, with no neighborhood/foreign", () => {
    const out = mapPhotonResponse(samplePhotonPayload());
    const kinds = out.map((s) => s.kind);

    expect(kinds).toContain("city");
    expect(kinds).toContain("zip");
    expect(kinds).toContain("address");
    expect(kinds).toContain("state");
    expect(kinds).toContain("county");
    // FHA: no neighborhood kind exists, and the district is dropped.
    expect(out.some((s) => s.label === "Hyde Park")).toBe(false);
    // US-only: London is dropped.
    expect(out.some((s) => s.label === "London")).toBe(false);
  });

  it("carries real coords + fields, leaving absent fields undefined (never fabricated)", () => {
    const out = mapPhotonResponse(samplePhotonPayload());
    const city = out.find((s) => s.kind === "city")!;
    expect(city.label).toBe("Austin");
    expect(city.lat).toBeCloseTo(30.2672, 3);
    expect(city.lng).toBeCloseTo(-97.7431, 3);
    expect(city.state).toBe("TX");
    expect(city.county).toBe("Travis County");

    const addr = out.find((s) => s.kind === "address")!;
    expect(addr.label).toBe("123 Maple St");
    expect(addr.zip).toBe("78704");

    const zip = out.find((s) => s.kind === "zip")!;
    expect(zip.label).toBe("78704");
    expect(zip.zip).toBe("78704");
  });

  it("returns [] for garbage / non-FeatureCollection payloads, never throwing", () => {
    expect(mapPhotonResponse(undefined)).toEqual([]);
    expect(mapPhotonResponse(null)).toEqual([]);
    expect(mapPhotonResponse(42)).toEqual([]);
    expect(mapPhotonResponse("nope")).toEqual([]);
    expect(mapPhotonResponse({})).toEqual([]);
    expect(mapPhotonResponse({ features: "x" })).toEqual([]);
    expect(mapPhotonResponse({ features: [1, null, "x"] })).toEqual([]);
    expect(
      mapPhotonResponse({ features: [{ properties: {}, geometry: {} }] }),
    ).toEqual([]);
  });
});

describe("PhotonGeocodeSource.suggest", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns [] for an empty query without calling fetch", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect(await new PhotonGeocodeSource().suggest("   ")).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("maps a mocked OK response and hits the keyless Photon URL", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(samplePhotonPayload()), { status: 200 }),
    );
    const out = await new PhotonGeocodeSource().suggest("Austin");
    expect(out.length).toBeGreaterThan(0);
    const [url] = fetchSpy.mock.calls[0] as [string];
    expect(url).toContain("https://photon.komoot.io/api/");
    expect(url).toContain("q=Austin");
    // Keyless: no api key param.
    expect(url).not.toMatch(/api[_-]?key/i);
  });

  it("returns [] on a non-OK response (never throws)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("error", { status: 500 }),
    );
    expect(await new PhotonGeocodeSource().suggest("Austin")).toEqual([]);
  });

  it("returns [] when fetch throws (never throws)", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    expect(await new PhotonGeocodeSource().suggest("Austin")).toEqual([]);
  });
});
