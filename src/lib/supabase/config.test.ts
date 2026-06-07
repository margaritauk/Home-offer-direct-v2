import { describe, expect, it } from "vitest";
import { normalizeUrl } from "./config";

describe("normalizeUrl", () => {
  it("strips a single trailing slash (the 'Invalid path' cause)", () => {
    expect(normalizeUrl("https://abc.supabase.co/")).toBe("https://abc.supabase.co");
  });

  it("strips multiple trailing slashes", () => {
    expect(normalizeUrl("https://abc.supabase.co///")).toBe("https://abc.supabase.co");
  });

  it("trims whitespace and newlines from a pasted value", () => {
    expect(normalizeUrl("  https://abc.supabase.co\n")).toBe("https://abc.supabase.co");
  });

  it("recovers the base URL when a REST/auth endpoint path was pasted", () => {
    expect(normalizeUrl("https://abc.supabase.co/rest/v1/")).toBe("https://abc.supabase.co");
    expect(normalizeUrl("https://abc.supabase.co/rest/v1")).toBe("https://abc.supabase.co");
    expect(normalizeUrl("https://abc.supabase.co/auth/v1")).toBe("https://abc.supabase.co");
  });

  it("leaves a clean URL untouched", () => {
    expect(normalizeUrl("https://abc.supabase.co")).toBe("https://abc.supabase.co");
  });

  it("handles undefined/empty", () => {
    expect(normalizeUrl(undefined)).toBe("");
    expect(normalizeUrl("")).toBe("");
  });
});
