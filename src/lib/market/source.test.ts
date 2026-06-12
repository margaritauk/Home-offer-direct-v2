import { afterEach, describe, expect, it, vi } from "vitest";

// `isMarketDataLive`/`getMarketDataSource` gate on THREE axes: the kill switch
// (RENTCAST_DISABLED), the dedicated MARKET_DATA_SOURCE flag, and the shared
// RENTCAST_API_KEY. We stub each axis and re-import fresh.
async function load(opts: {
  source?: string;
  key?: string;
  disabled?: string;
}) {
  vi.resetModules();
  vi.stubEnv("MARKET_DATA_SOURCE", opts.source ?? "");
  vi.stubEnv("RENTCAST_API_KEY", opts.key ?? "");
  vi.stubEnv("RENTCAST_DISABLED", opts.disabled ?? "");
  return import("./source");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("isMarketDataLive gating", () => {
  it("is OFF by default (no source, no key) → null source", async () => {
    const { isMarketDataLive, getMarketDataSource, NullMarketDataSource } =
      await load({});
    expect(isMarketDataLive()).toBe(false);
    expect(getMarketDataSource()).toBe(NullMarketDataSource);
  });

  it("is OFF with the flag set but no key", async () => {
    const { isMarketDataLive } = await load({ source: "rentcast" });
    expect(isMarketDataLive()).toBe(false);
  });

  it("is OFF with a key but the flag not set to rentcast", async () => {
    const { isMarketDataLive } = await load({ key: "secret" });
    expect(isMarketDataLive()).toBe(false);
  });

  it("is ON with flag=rentcast AND a key AND kill switch off", async () => {
    const { isMarketDataLive, getMarketDataSource, NullMarketDataSource } =
      await load({ source: "rentcast", key: "secret" });
    expect(isMarketDataLive()).toBe(true);
    expect(getMarketDataSource()).not.toBe(NullMarketDataSource);
  });

  it("the kill switch forces OFF even when fully configured", async () => {
    const { isMarketDataLive, getMarketDataSource, NullMarketDataSource } =
      await load({ source: "rentcast", key: "secret", disabled: "1" });
    expect(isMarketDataLive()).toBe(false);
    expect(getMarketDataSource()).toBe(NullMarketDataSource);
  });

  it("does NOT overload COMPS_DATA_SOURCE — only MARKET_DATA_SOURCE turns it on", async () => {
    vi.resetModules();
    vi.stubEnv("MARKET_DATA_SOURCE", "");
    vi.stubEnv("COMPS_DATA_SOURCE", "rentcast");
    vi.stubEnv("RENTCAST_API_KEY", "secret");
    vi.stubEnv("RENTCAST_DISABLED", "");
    const { isMarketDataLive } = await import("./source");
    expect(isMarketDataLive()).toBe(false);
  });

  it("the null source returns null (manual-entry fallback)", async () => {
    const { NullMarketDataSource } = await load({});
    await expect(
      NullMarketDataSource.fetchMarketStats({ zip: "78701" }),
    ).resolves.toBeNull();
  });
});
