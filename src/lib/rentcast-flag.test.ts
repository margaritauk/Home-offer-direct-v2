import { afterEach, describe, expect, it, vi } from "vitest";
import { isRentCastDisabled } from "./rentcast-flag";
import {
  getListingsDataSource,
  isRentCastListingsActive,
} from "@/lib/listings/provider";
import { RentCastListingsDataSource } from "@/lib/listings/source-rentcast";
import { getCompsDataSource } from "@/lib/tools/comps-source";
import { RentCastCompsDataSource } from "@/lib/tools/comps-source-rentcast";

afterEach(() => vi.unstubAllEnvs());

/** Configure RentCast as fully "on" (source vars + key) before each gate test. */
function enableRentCast() {
  vi.stubEnv("LISTINGS_DATA_SOURCE", "rentcast");
  vi.stubEnv("COMPS_DATA_SOURCE", "rentcast");
  vi.stubEnv("RENTCAST_API_KEY", "test-key");
}

describe("isRentCastDisabled", () => {
  it("is false when unset or empty", () => {
    vi.stubEnv("RENTCAST_DISABLED", "");
    expect(isRentCastDisabled()).toBe(false);
  });

  it.each(["1", "true", "TRUE", "Yes", "on", "  on  "])(
    "is true for the truthy value %j",
    (v) => {
      vi.stubEnv("RENTCAST_DISABLED", v);
      expect(isRentCastDisabled()).toBe(true);
    },
  );

  it.each(["0", "false", "no", "off", "disabled", "rentcast"])(
    "is false for the non-truthy value %j",
    (v) => {
      vi.stubEnv("RENTCAST_DISABLED", v);
      expect(isRentCastDisabled()).toBe(false);
    },
  );
});

describe("kill switch gates the listings source", () => {
  it("uses the real RentCast source when enabled and not disabled", () => {
    enableRentCast();
    vi.stubEnv("RENTCAST_DISABLED", "");
    expect(isRentCastListingsActive()).toBe(true);
    expect(getListingsDataSource()).toBeInstanceOf(RentCastListingsDataSource);
  });

  it("falls back to mock when the kill switch is on", () => {
    enableRentCast();
    vi.stubEnv("RENTCAST_DISABLED", "true");
    expect(isRentCastListingsActive()).toBe(false);
    expect(getListingsDataSource()).not.toBeInstanceOf(
      RentCastListingsDataSource,
    );
  });
});

describe("kill switch gates the comps source", () => {
  it("uses the real RentCast comps source when enabled and not disabled", () => {
    enableRentCast();
    vi.stubEnv("RENTCAST_DISABLED", "");
    expect(getCompsDataSource()).toBeInstanceOf(RentCastCompsDataSource);
  });

  it("falls back to the null comps source when the kill switch is on", () => {
    enableRentCast();
    vi.stubEnv("RENTCAST_DISABLED", "on");
    expect(getCompsDataSource()).not.toBeInstanceOf(RentCastCompsDataSource);
  });
});
