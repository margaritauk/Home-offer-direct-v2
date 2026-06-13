import { describe, expect, it } from "vitest";
import {
  ADJUSTMENT_PROMPTS,
  checkAdjustmentSize,
  suggestAdjustmentPrompts,
  suggestSizeAdjustment,
} from "./comps-adjust-prompts";

describe("ADJUSTMENT_PROMPTS (content)", () => {
  it("covers the standard CMA categories with a direction guard each", () => {
    const ids = ADJUSTMENT_PROMPTS.map((p) => p.id);
    for (const id of ["condition", "sqft", "garage", "lot", "recency", "bed-bath"]) {
      expect(ids).toContain(id);
    }
    for (const p of ADJUSTMENT_PROMPTS) {
      expect(p.prompt.length).toBeGreaterThan(0);
      // Direction is explicit (UP / DOWN) — the classic sign-error fix.
      expect(p.direction).toMatch(/\b(UP|DOWN)\b/);
    }
  });

  it("frames the lot/site adjustment on objective site factors, never demographics (FHA)", () => {
    const lot = ADJUSTMENT_PROMPTS.find((p) => p.id === "lot")!;
    expect(lot.prompt).toMatch(/busy road|corner|view|slope/i);
    expect(lot.direction).toMatch(/never the neighborhood's people/i);
    expect(`${lot.prompt} ${lot.direction}`).not.toMatch(
      /demographic|good schools|family-friendly|safe neighborhood/i,
    );
  });

  it("tells the buyer to reconcile recency with the market read (no double-counting)", () => {
    const recency = ADJUSTMENT_PROMPTS.find((p) => p.id === "recency")!;
    expect(recency.direction).toMatch(/double-count/i);
  });
});

describe("suggestSizeAdjustment", () => {
  it("adjusts a LARGER comp DOWN (positive adjustment toward a smaller subject)", () => {
    // Comp: $400k / 2000 sqft = $200/sqft. Subject is 1800 sqft (200 smaller).
    const hint = suggestSizeAdjustment(1_800, { salePrice: 400_000, sqft: 2_000 });
    expect(hint.pricePerSqft).toBe(200);
    expect(hint.sqftDelta).toBe(-200);
    // 200 sqft larger × $200/sqft = $40k adjust-down → +40000 (sign convention).
    expect(hint.illustrativeAdjustment).toBe(40_000);
    expect(hint.note).toMatch(/larger.*DOWN/i);
  });

  it("adjusts a SMALLER comp UP (negative adjustment toward a larger subject)", () => {
    const hint = suggestSizeAdjustment(2_200, { salePrice: 400_000, sqft: 2_000 });
    // Subject 200 sqft bigger → comp adjusts UP → negative adjustment.
    expect(hint.sqftDelta).toBe(200);
    expect(hint.illustrativeAdjustment).toBe(-40_000);
    expect(hint.note).toMatch(/smaller.*UP/i);
  });

  it("yields a zero adjustment when sizes match", () => {
    const hint = suggestSizeAdjustment(2_000, { salePrice: 400_000, sqft: 2_000 });
    expect(hint.illustrativeAdjustment).toBe(0);
    expect(hint.note).toMatch(/no size adjustment/i);
  });

  it("returns null (never throws) on missing/invalid sqft or price", () => {
    expect(
      suggestSizeAdjustment(0, { salePrice: 400_000, sqft: 2_000 })
        .illustrativeAdjustment,
    ).toBeNull();
    expect(
      suggestSizeAdjustment(2_000, { salePrice: 0, sqft: 2_000 })
        .illustrativeAdjustment,
    ).toBeNull();
    expect(
      suggestSizeAdjustment(2_000, { salePrice: 400_000, sqft: 0 })
        .illustrativeAdjustment,
    ).toBeNull();
    expect(
      suggestSizeAdjustment(Number.NaN, { salePrice: 400_000, sqft: 2_000 })
        .illustrativeAdjustment,
    ).toBeNull();
  });
});

describe("suggestAdjustmentPrompts", () => {
  it("returns the static prompts plus the computed size illustration", () => {
    const g = suggestAdjustmentPrompts(1_800, { salePrice: 400_000, sqft: 2_000 });
    expect(g.prompts).toBe(ADJUSTMENT_PROMPTS);
    expect(g.size.illustrativeAdjustment).toBe(40_000);
  });
});

describe("checkAdjustmentSize", () => {
  it("flags a single adjustment over ~10% of the comp's price", () => {
    const c = checkAdjustmentSize({ salePrice: 400_000, adjustment: 60_000 });
    expect(c.ratio).toBeCloseTo(0.15);
    expect(c.exceedsSingleLineCap).toBe(true);
    expect(c.note).toMatch(/closer comp would be stronger/i);
  });

  it("does not flag a small adjustment, and emits no note", () => {
    const c = checkAdjustmentSize({ salePrice: 400_000, adjustment: 20_000 });
    expect(c.exceedsSingleLineCap).toBe(false);
    expect(c.note).toBeNull();
  });

  it("handles a negative adjustment by absolute value", () => {
    const c = checkAdjustmentSize({ salePrice: 400_000, adjustment: -60_000 });
    expect(c.exceedsSingleLineCap).toBe(true);
  });

  it("guards a zero/invalid sale price (null ratio, no crash)", () => {
    expect(checkAdjustmentSize({ salePrice: 0, adjustment: 10_000 }).ratio).toBeNull();
    expect(checkAdjustmentSize({ salePrice: 400_000 }).exceedsSingleLineCap).toBe(
      false,
    );
  });

  it("never emits a directive value or an offer number", () => {
    const c = checkAdjustmentSize({ salePrice: 400_000, adjustment: 80_000 });
    expect(c.note).not.toMatch(/offer \$|you should|set the price/i);
  });
});
