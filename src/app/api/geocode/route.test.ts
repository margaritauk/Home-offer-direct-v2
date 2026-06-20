import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

function getRequest(q?: string): Request {
  const url = new URL("http://localhost/api/geocode");
  if (q !== undefined) url.searchParams.set("q", q);
  return new Request(url.toString());
}

function photonPayload() {
  return {
    type: "FeatureCollection",
    features: [
      {
        geometry: { coordinates: [-97.74, 30.27] },
        properties: { type: "city", name: "Austin", state: "TX", countrycode: "US" },
      },
    ],
  };
}

describe("GET /api/geocode", () => {
  const ENV = { ...process.env };
  beforeEach(() => {
    delete process.env.GEOCODE_SOURCE;
    delete process.env.GEOCODE_DISABLED;
    vi.restoreAllMocks();
  });
  afterEach(() => {
    process.env = { ...ENV };
    vi.restoreAllMocks();
  });

  it("returns mapped suggestions for a query (source: photon), never 500", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(photonPayload()), { status: 200 }),
    );
    const res = await GET(getRequest("Austin"));
    const data = (await res.json()) as {
      suggestions: { kind: string; label: string }[];
      source: string;
    };
    expect(res.status).toBe(200);
    expect(data.source).toBe("photon");
    expect(data.suggestions[0]).toMatchObject({ kind: "city", label: "Austin" });
  });

  it("returns [] for an empty query without hitting the network", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const res = await GET(getRequest(""));
    const data = (await res.json()) as { suggestions: unknown[] };
    expect(res.status).toBe(200);
    expect(data.suggestions).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns [] with source: disabled when the kill switch is on", async () => {
    process.env.GEOCODE_DISABLED = "1";
    const res = await GET(getRequest("Austin"));
    const data = (await res.json()) as { suggestions: unknown[]; source: string };
    expect(res.status).toBe(200);
    expect(data.source).toBe("disabled");
    expect(data.suggestions).toEqual([]);
  });

  it("degrades to [] (never 500) when the upstream geocoder fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    const res = await GET(getRequest("Austin"));
    const data = (await res.json()) as { suggestions: unknown[] };
    expect(res.status).toBe(200);
    expect(data.suggestions).toEqual([]);
  });
});
