import { describe, expect, it } from "vitest";
import { SOLO_FACTORS, summarizeGoSolo } from "./go-solo";

describe("summarizeGoSolo", () => {
  it("returns the neutral 'solo reasonable' default with nothing selected", () => {
    const s = summarizeGoSolo([]);
    expect(s.band).toBe("solo-reasonable");
    expect(s.elevated).toBe(0);
    expect(s.notes).toEqual([]);
    expect(s.headline).toMatch(/reasonable for many straightforward purchases/i);
  });

  it("any single factor escalates the band to consider-help", () => {
    const s = summarizeGoSolo(["complex-title"]);
    expect(s.band).toBe("consider-help");
    expect(s.elevated).toBe(1);
    expect(s.notes).toHaveLength(1);
  });

  it("stacked factors raise the count and keep a two-sided (non-directive) read", () => {
    const s = summarizeGoSolo([
      "complex-title",
      "new-construction",
      "probate-short-sale-reo",
    ]);
    expect(s.band).toBe("consider-help");
    expect(s.elevated).toBe(3);
    // Never a hard "you must hire" verdict.
    expect(s.headline).not.toMatch(/you must/i);
    expect(s.headline).toMatch(/many buyers/i);
    expect(s.headline).toMatch(/choice, not a requirement/i);
  });

  it("ignores unknown ids and de-duplicates", () => {
    const s = summarizeGoSolo([
      "complex-title",
      "complex-title",
      "not-a-real-factor",
    ]);
    expect(s.elevated).toBe(1);
  });

  it("every factor has a non-empty label and trade-off 'why'", () => {
    for (const f of SOLO_FACTORS) {
      expect(f.id).toBeTruthy();
      expect(f.label.length).toBeGreaterThan(0);
      expect(f.why.length).toBeGreaterThan(0);
      // The "why" is a trade-off, never a directive.
      expect(f.why).not.toMatch(/you must/i);
    }
  });

  it("factor ids are unique", () => {
    const ids = SOLO_FACTORS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
