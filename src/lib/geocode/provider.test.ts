import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getGeocodeSource,
  isGeocodeActive,
  NullGeocodeSource,
} from "./provider";
import { PhotonGeocodeSource } from "./source-photon";
import { suggestionToLocationValue } from "./index";
import type { GeocodeSuggestion } from "./types";

describe("geocode seam gating", () => {
  const ENV = { ...process.env };
  beforeEach(() => {
    delete process.env.GEOCODE_SOURCE;
    delete process.env.GEOCODE_DISABLED;
  });
  afterEach(() => {
    process.env = { ...ENV };
  });

  it("defaults to the keyless Photon source with no env (active out of the box)", () => {
    expect(isGeocodeActive()).toBe(true);
    expect(getGeocodeSource()).toBeInstanceOf(PhotonGeocodeSource);
  });

  it("honors GEOCODE_SOURCE=photon explicitly", () => {
    process.env.GEOCODE_SOURCE = "photon";
    expect(getGeocodeSource()).toBeInstanceOf(PhotonGeocodeSource);
  });

  it("falls back to the Null source for an unknown GEOCODE_SOURCE", () => {
    process.env.GEOCODE_SOURCE = "radar"; // not implemented yet
    expect(isGeocodeActive()).toBe(false);
    expect(getGeocodeSource()).toBeInstanceOf(NullGeocodeSource);
  });

  it("GEOCODE_DISABLED kills the seam regardless of source (mandatory off case)", () => {
    process.env.GEOCODE_SOURCE = "photon";
    process.env.GEOCODE_DISABLED = "1";
    expect(isGeocodeActive()).toBe(false);
    expect(getGeocodeSource()).toBeInstanceOf(NullGeocodeSource);
  });

  it("the Null source yields [] suggestions", async () => {
    expect(await new NullGeocodeSource().suggest()).toEqual([]);
  });
});

describe("suggestionToLocationValue", () => {
  const base: GeocodeSuggestion = {
    id: "x",
    kind: "city",
    label: "Austin",
    lat: 30.27,
    lng: -97.74,
    city: "Austin",
    state: "TX",
    county: "Travis County",
  };

  it("resolves a city pick into a radius-anchored LocationValue (city mode)", () => {
    const v = suggestionToLocationValue(base);
    expect(v).toMatchObject({
      mode: "city",
      lat: 30.27,
      lng: -97.74,
      city: "Austin",
      state: "TX",
    });
    expect(typeof v.radius).toBe("number");
  });

  it("resolves a zip pick into zip mode with the postal code", () => {
    const v = suggestionToLocationValue({
      ...base,
      kind: "zip",
      label: "78704",
      zip: "78704",
    });
    expect(v.mode).toBe("zip");
    expect(v.zip).toBe("78704");
  });

  it("resolves a state pick into state mode", () => {
    const v = suggestionToLocationValue({ ...base, kind: "state", label: "Texas" });
    expect(v.mode).toBe("state");
    expect(v.state).toBe("TX");
  });

  it("resolves an address pick into a coordinate-anchored search", () => {
    const v = suggestionToLocationValue({
      ...base,
      kind: "address",
      label: "123 Maple St",
      zip: "78704",
    });
    expect(v.mode).toBe("current");
    expect(v.lat).toBe(30.27);
    expect(typeof v.radius).toBe("number");
  });

  it("folds a county pick to a city-mode radius search (no county param exists)", () => {
    const v = suggestionToLocationValue({ ...base, kind: "county" });
    expect(v.mode).toBe("city");
    expect(typeof v.radius).toBe("number");
  });
});
