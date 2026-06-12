import { describe, expect, it } from "vitest";
import { illustrateEscalation } from "./escalation";

describe("illustrateEscalation", () => {
  it("resolves to competing + increment when below the cap", () => {
    const m = illustrateEscalation({
      base: 400000,
      increment: 5000,
      cap: 430000,
      competingOffer: 410000,
    });
    expect(m.valid).toBe(true);
    expect(m.resultingPrice).toBe(415000); // min(410k+5k, 430k)
    expect(m.cappedOut).toBe(false);
    expect(m.noEscalation).toBe(false);
  });

  it("clamps at the cap when competing + increment would exceed it", () => {
    const m = illustrateEscalation({
      base: 400000,
      increment: 5000,
      cap: 430000,
      competingOffer: 440000, // competing already above cap
    });
    expect(m.resultingPrice).toBe(430000);
    expect(m.cappedOut).toBe(true);
  });

  it("hits the cap exactly when competing + increment == cap (boundary)", () => {
    const m = illustrateEscalation({
      base: 400000,
      increment: 5000,
      cap: 425000,
      competingOffer: 420000, // 420k + 5k == 425k cap
    });
    expect(m.resultingPrice).toBe(425000);
    expect(m.cappedOut).toBe(true);
  });

  it("does not escalate when the competing offer is at/below the base", () => {
    const atBase = illustrateEscalation({
      base: 400000,
      increment: 5000,
      cap: 430000,
      competingOffer: 400000,
    });
    expect(atBase.noEscalation).toBe(true);
    expect(atBase.resultingPrice).toBe(400000);

    const below = illustrateEscalation({
      base: 400000,
      increment: 5000,
      cap: 430000,
      competingOffer: 350000,
    });
    expect(below.noEscalation).toBe(true);
    expect(below.resultingPrice).toBe(400000);
  });

  it("reports headroom used as a fraction of cap − base", () => {
    const m = illustrateEscalation({
      base: 400000,
      increment: 5000,
      cap: 420000,
      competingOffer: 410000,
    });
    // resulting 415k; headroom 20k; used 15k → 0.75
    expect(m.headroomUsedFraction).toBeCloseTo(0.75, 5);
  });

  it("errors when the increment is zero or negative (don't compute nonsense)", () => {
    const zero = illustrateEscalation({
      base: 400000,
      increment: 0,
      cap: 430000,
      competingOffer: 410000,
    });
    expect(zero.valid).toBe(false);
    expect(zero.resultingPrice).toBeNull();
    expect(zero.errors.join(" ")).toMatch(/increment/i);

    const neg = illustrateEscalation({
      base: 400000,
      increment: -1000,
      cap: 430000,
      competingOffer: 410000,
    });
    expect(neg.valid).toBe(false);
  });

  it("errors when the cap is below the base", () => {
    const m = illustrateEscalation({
      base: 400000,
      increment: 5000,
      cap: 380000,
      competingOffer: 410000,
    });
    expect(m.valid).toBe(false);
    expect(m.errors.join(" ")).toMatch(/cap/i);
  });

  it("errors on missing/NaN base or cap", () => {
    const m = illustrateEscalation({
      base: NaN,
      increment: 5000,
      cap: NaN,
      competingOffer: 410000,
    });
    expect(m.valid).toBe(false);
    expect(m.resultingPrice).toBeNull();
  });

  it("guards a NaN competing offer (treated as 0 → no escalation)", () => {
    const m = illustrateEscalation({
      base: 400000,
      increment: 5000,
      cap: 430000,
      competingOffer: NaN,
    });
    expect(m.valid).toBe(true);
    expect(m.noEscalation).toBe(true);
    expect(m.resultingPrice).toBe(400000);
  });

  it("never exceeds the cap and never drops below the base", () => {
    const m = illustrateEscalation({
      base: 400000,
      increment: 100000,
      cap: 420000,
      competingOffer: 415000,
    });
    expect(m.resultingPrice).toBeLessThanOrEqual(420000);
    expect(m.resultingPrice).toBeGreaterThanOrEqual(400000);
  });
});
