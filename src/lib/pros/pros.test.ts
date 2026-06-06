import { describe, expect, it } from "vitest";
import { finderServices, samplePros, getFinderServices, getSamplePros } from "./data";
import { PRO_ROLES } from "./index";
import type { ProRole } from "./types";

describe("finder services (real handoff path)", () => {
  it("cover all three roles", () => {
    const roles = new Set(finderServices.map((s) => s.role));
    for (const r of PRO_ROLES) expect(roles.has(r)).toBe(true);
  });

  it("all have absolute https URLs and valid roles", () => {
    for (const s of finderServices) {
      expect(s.website).toMatch(/^https:\/\//);
      expect(PRO_ROLES).toContain(s.role);
      expect(s.name.length).toBeGreaterThan(0);
    }
  });

  it("include at least one per-state attorney referral service", () => {
    expect(
      finderServices.some((s) => s.role === "attorney" && s.perState),
    ).toBe(true);
  });

  it("getFinderServices filters by role", () => {
    for (const r of PRO_ROLES) {
      expect(getFinderServices(r).every((s) => s.role === r)).toBe(true);
    }
    expect(getFinderServices()).toHaveLength(finderServices.length);
  });
});

describe("sample listings integrity", () => {
  it("EVERY directory listing is flagged as a sample (no fabricated real businesses)", () => {
    for (const p of samplePros) {
      expect(p.isSample).toBe(true);
    }
  });

  it("contain no phone numbers anywhere in their fields", () => {
    const phone = /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
    for (const p of samplePros) {
      const blob = [p.name, p.description, p.location, p.pricingNote, p.website]
        .filter(Boolean)
        .join(" ");
      expect(blob).not.toMatch(phone);
    }
  });

  it("use valid roles and uppercase state codes", () => {
    for (const p of samplePros) {
      expect(PRO_ROLES).toContain(p.role);
      for (const s of p.states) expect(s).toMatch(/^[A-Z]{2}$/);
    }
  });

  it("cover all three roles", () => {
    const roles = new Set(samplePros.map((p) => p.role));
    for (const r of PRO_ROLES) expect(roles.has(r)).toBe(true);
  });
});

describe("getSamplePros filtering", () => {
  it("filters by role", () => {
    const role: ProRole = "attorney";
    expect(getSamplePros({ role }).every((p) => p.role === role)).toBe(true);
  });

  it("matches nationwide listings (empty states) for any state", () => {
    const nationwide = samplePros.filter((p) => p.states.length === 0);
    const forCA = getSamplePros({ state: "CA" });
    for (const n of nationwide) {
      expect(forCA.some((p) => p.id === n.id)).toBe(true);
    }
  });

  it("matches state-specific listings by code, case-insensitively", () => {
    const lower = getSamplePros({ state: "ca" });
    const upper = getSamplePros({ state: "CA" });
    expect(lower.map((p) => p.id).sort()).toEqual(upper.map((p) => p.id).sort());
  });

  it("returns everything with no filters", () => {
    expect(getSamplePros()).toHaveLength(samplePros.length);
  });
});
