import { describe, expect, it } from "vitest";
import { summarizeDiligence } from "./pre-offer-diligence";

describe("summarizeDiligence", () => {
  it("summarizes a full field set into neutral fact lines", () => {
    const s = summarizeDiligence({
      lastSoldPrice: 350000,
      lastSoldDate: "2021-06-01",
      daysOnMarket: 75,
      priceChangeCount: 2,
      taxAssessment: 300000,
    });
    expect(s.empty).toBe(false);
    const ids = s.lines.map((l) => l.id);
    expect(ids).toContain("last-sold");
    expect(ids).toContain("dom");
    expect(ids).toContain("price-changes");
    expect(ids).toContain("tax-assessment");
  });

  it("partial fields → graceful partial summary (skips missing)", () => {
    const s = summarizeDiligence({ daysOnMarket: 10 });
    expect(s.lines).toHaveLength(1);
    expect(s.lines[0].id).toBe("dom");
  });

  it("empty / null input → empty summary, no crash", () => {
    expect(summarizeDiligence(null).empty).toBe(true);
    expect(summarizeDiligence(undefined).lines).toEqual([]);
    expect(summarizeDiligence({}).empty).toBe(true);
  });

  it("labels seller motivation as an unverified inference", () => {
    const s = summarizeDiligence({ sellerMotivation: "job relocation" });
    const line = s.lines.find((l) => l.id === "seller-motivation");
    expect(line?.kind).toBe("inference");
    expect(line?.label).toMatch(/unverified/i);
  });

  it("states tax assessment ≠ market value", () => {
    const s = summarizeDiligence({ taxAssessment: 300000 });
    const line = s.lines.find((l) => l.id === "tax-assessment");
    expect(line?.note).toMatch(/not market value/i);
  });

  it("nudges where in the band on long DOM / price cuts (trade-off, no directive)", () => {
    const s = summarizeDiligence({ daysOnMarket: 90, priceChangeCount: 3 });
    expect(s.bandNudge).toMatch(/room to negotiate/i);
    expect(s.bandNudge).not.toMatch(/you should offer/i);
  });

  it("no nudge on a short DOM with no cuts", () => {
    const s = summarizeDiligence({ daysOnMarket: 5 });
    expect(s.bandNudge).toBeUndefined();
  });

  it("ignores non-positive / NaN numeric fields", () => {
    const s = summarizeDiligence({
      lastSoldPrice: -1,
      taxAssessment: NaN,
      priceChangeCount: 0,
    });
    expect(s.empty).toBe(true);
  });
});
