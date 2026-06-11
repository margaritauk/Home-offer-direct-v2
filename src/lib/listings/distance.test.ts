import { describe, expect, it } from "vitest";
import { haversineMiles, annotateDistance } from "./distance";
import type { Listing } from "./types";

const baseListing = (over: Partial<Listing>): Listing => ({
  id: "x",
  address: "1 Test St",
  city: "Austin",
  state: "TX",
  zip: "78701",
  price: 500000,
  beds: 3,
  baths: 2,
  sqft: 1800,
  propertyType: "single-family",
  yearBuilt: 2010,
  daysOnMarket: 5,
  description: "Test listing.",
  isSample: false,
  ...over,
});

describe("haversineMiles", () => {
  it("is zero for identical points", () => {
    const p = { lat: 30.27, lng: -97.74 };
    expect(haversineMiles(p, p)).toBeCloseTo(0, 6);
  });

  it("is symmetric", () => {
    const a = { lat: 30.27, lng: -97.74 };
    const b = { lat: 32.78, lng: -96.8 };
    expect(haversineMiles(a, b)).toBeCloseTo(haversineMiles(b, a), 6);
  });

  it("matches a known distance: Austin → Dallas (~182 mi)", () => {
    // Austin (30.2672, -97.7431) → Dallas (32.7767, -96.7970).
    const d = haversineMiles(
      { lat: 30.2672, lng: -97.7431 },
      { lat: 32.7767, lng: -96.797 },
    );
    expect(d).toBeGreaterThan(178);
    expect(d).toBeLessThan(186);
  });

  it("matches a known distance: ~1 degree of latitude (~69 mi)", () => {
    const d = haversineMiles({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(d).toBeGreaterThan(68);
    expect(d).toBeLessThan(70);
  });

  it("matches a known distance: LA → NYC (~2445 mi)", () => {
    const d = haversineMiles(
      { lat: 34.0522, lng: -118.2437 },
      { lat: 40.7128, lng: -74.006 },
    );
    expect(d).toBeGreaterThan(2400);
    expect(d).toBeLessThan(2480);
  });
});

describe("annotateDistance", () => {
  const center = { lat: 30.2672, lng: -97.7431 };

  it("sets distance when a listing has coordinates", () => {
    const withCoords = baseListing({
      id: "a",
      lat: 32.7767,
      lng: -96.797,
    });
    const [out] = annotateDistance([withCoords], center);
    expect(out.distance).toBeDefined();
    expect(out.distance).toBeCloseTo(haversineMiles(center, { lat: 32.7767, lng: -96.797 }), 6);
  });

  it("leaves distance undefined when a listing lacks coordinates", () => {
    const noCoords = baseListing({ id: "b" });
    const [out] = annotateDistance([noCoords], center);
    expect(out.distance).toBeUndefined();
  });

  it("handles a mix of listings with and without coordinates", () => {
    const out = annotateDistance(
      [
        baseListing({ id: "a", lat: 30.3, lng: -97.7 }),
        baseListing({ id: "b" }),
      ],
      center,
    );
    expect(out[0].distance).toBeDefined();
    expect(out[1].distance).toBeUndefined();
  });

  it("does not mutate the input listings", () => {
    const input = baseListing({ id: "a", lat: 30.3, lng: -97.7 });
    annotateDistance([input], center);
    expect(input.distance).toBeUndefined();
  });
});
