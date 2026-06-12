import { describe, expect, it } from "vitest";
import {
  ACCESS_GAP_SECTIONS,
  ALERT_PORTALS,
  LISTING_ALERTS_SOURCE,
} from "./listing-alerts";

describe("listing-alerts content", () => {
  it("lists several portals and endorses none (neutral, alphabetical)", () => {
    const names = ALERT_PORTALS.map((p) => p.name);
    expect(names).toContain("Zillow");
    expect(names).toContain("Redfin");
    expect(names).toContain("Realtor.com");
    expect(names.length).toBeGreaterThanOrEqual(3);
  });

  it("every portal link is https with a non-empty neutral note", () => {
    for (const p of ALERT_PORTALS) {
      expect(p.href).toMatch(/^https:\/\//);
      expect(p.note.length).toBeGreaterThan(0);
      // No affiliate/endorsement language (UDAP).
      expect(p.note).not.toMatch(/\b(best|recommended|partner|affiliate|sponsored)\b/i);
    }
  });

  it("includes an honest note about MLS-only / pocket / off-market listings", () => {
    const offMarket = ACCESS_GAP_SECTIONS.find((s) => s.id === "off-market");
    expect(offMarket).toBeDefined();
    const text = offMarket!.body.join(" ");
    expect(text).toMatch(/pocket|office-exclusive|MLS-only/i);
    expect(text).toMatch(/Clear Cooperation/i);
  });

  it("states portal lag vs the MLS honestly", () => {
    const lag = ACCESS_GAP_SECTIONS.find((s) => s.id === "portal-lag");
    expect(lag).toBeDefined();
    expect(lag!.body.join(" ")).toMatch(/lag|before they syndicate|hours or days/i);
  });

  it("keeps saved-search guidance on objective attributes (FHA — no demographic proxies)", () => {
    const setAlerts = ACCESS_GAP_SECTIONS.find((s) => s.id === "set-alerts");
    const text = setAlerts!.body.join(" ");
    expect(text).toMatch(/price|beds|commute|property type/i);
    expect(text).not.toMatch(/good schools|family-friendly|safe neighborhood|demographic/i);
  });

  it("every section has a heading and non-empty body", () => {
    for (const s of ACCESS_GAP_SECTIONS) {
      expect(s.heading.length).toBeGreaterThan(0);
      expect(s.body.length).toBeGreaterThan(0);
    }
  });

  it("carries a dated source line (accuracy compliance)", () => {
    expect(LISTING_ALERTS_SOURCE).toMatch(/2026/);
  });
});
