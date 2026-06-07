import { describe, expect, it } from "vitest";
import { isCloudSyncEnabled, isDealsEnabled } from "./config";

describe("isDealsEnabled", () => {
  it("is gated on the same requirement as cloud sync (off with no keys)", () => {
    // In the test environment no Supabase env vars are set, so both are false —
    // this is the safety net: no keys → no deal layer → today's single-user app.
    expect(isCloudSyncEnabled()).toBe(false);
    expect(isDealsEnabled()).toBe(false);
    expect(isDealsEnabled()).toBe(isCloudSyncEnabled());
  });
});
