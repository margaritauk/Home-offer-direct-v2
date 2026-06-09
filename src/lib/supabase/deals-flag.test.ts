import { afterEach, describe, expect, it, vi } from "vitest";

// `isDealsEnabled` combines `isCloudSyncEnabled()` (driven by the Supabase env
// vars, which `config.ts` captures into module constants at load) with the
// runtime `NEXT_PUBLIC_DEALS_ENABLED` flag. We stub both env axes and re-import
// the module fresh so the captured constants pick up the stubbed keys, then
// assert deals require BOTH cloud sync AND the explicit opt-in flag.
async function loadConfig(opts: { cloudSync: boolean; flag?: string }) {
  vi.resetModules();
  if (opts.cloudSync) {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  } else {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
  }
  if (opts.flag === undefined) {
    vi.stubEnv("NEXT_PUBLIC_DEALS_ENABLED", "");
  } else {
    vi.stubEnv("NEXT_PUBLIC_DEALS_ENABLED", opts.flag);
  }
  return import("./config");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("isDealsEnabled (decoupled from cloud sync)", () => {
  it("default test env: no keys → both off", async () => {
    const { isCloudSyncEnabled, isDealsEnabled } = await import("./config");
    expect(isCloudSyncEnabled()).toBe(false);
    expect(isDealsEnabled()).toBe(false);
  });

  it("is OFF when the flag is absent even though cloud keys are present", async () => {
    const { isCloudSyncEnabled, isDealsEnabled } = await loadConfig({
      cloudSync: true,
      flag: undefined,
    });
    expect(isCloudSyncEnabled()).toBe(true);
    expect(isDealsEnabled()).toBe(false);
  });

  it('is OFF when the flag is present but not exactly "true"', async () => {
    const { isDealsEnabled } = await loadConfig({ cloudSync: true, flag: "1" });
    expect(isDealsEnabled()).toBe(false);
  });

  it('is ON only when cloud keys present AND flag === "true"', async () => {
    const { isCloudSyncEnabled, isDealsEnabled } = await loadConfig({
      cloudSync: true,
      flag: "true",
    });
    expect(isCloudSyncEnabled()).toBe(true);
    expect(isDealsEnabled()).toBe(true);
  });

  it("is OFF when cloud keys absent regardless of the flag", async () => {
    const { isCloudSyncEnabled, isDealsEnabled } = await loadConfig({
      cloudSync: false,
      flag: "true",
    });
    expect(isCloudSyncEnabled()).toBe(false);
    expect(isDealsEnabled()).toBe(false);
  });
});
