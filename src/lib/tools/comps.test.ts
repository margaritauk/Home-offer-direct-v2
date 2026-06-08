import { describe, expect, it } from "vitest";
import { compsEstimate, type Comp } from "./comps";

const comps: Comp[] = [
  { id: "1", label: "A", salePrice: 400_000, sqft: 2_000 }, // 200/sqft
  { id: "2", label: "B", salePrice: 450_000, sqft: 2_000 }, // 225/sqft
  { id: "3", label: "C", salePrice: 500_000, sqft: 2_000 }, // 250/sqft
];

describe("compsEstimate", () => {
  it("computes each comp's adjusted $/sqft", () => {
    const r = compsEstimate({ sqft: 2_000 }, comps);
    expect(r.comps.map((c) => c.adjustedPricePerSqft)).toEqual([200, 225, 250]);
  });

  it("derives min, mean, and max $/sqft", () => {
    const r = compsEstimate({ sqft: 2_000 }, comps);
    expect(r.minPricePerSqft).toBe(200);
    expect(r.avgPricePerSqft).toBe(225);
    expect(r.maxPricePerSqft).toBe(250);
    expect(r.usableCount).toBe(3);
  });

  it("estimates a fair-value range from subject sqft", () => {
    const r = compsEstimate({ sqft: 2_200 }, comps);
    expect(r.estimatedLow).toBe(200 * 2_200);
    expect(r.estimatedMid).toBe(225 * 2_200);
    expect(r.estimatedHigh).toBe(250 * 2_200);
  });

  it("applies a positive adjustment by lowering the comp's implied value", () => {
    const r = compsEstimate({ sqft: 2_000 }, [
      { id: "1", label: "A", salePrice: 420_000, sqft: 2_000, adjustment: 20_000 },
    ]);
    // 420k - 20k = 400k => 200/sqft
    expect(r.comps[0].adjustedPrice).toBe(400_000);
    expect(r.comps[0].adjustedPricePerSqft).toBe(200);
  });

  it("applies a negative adjustment by raising the comp's implied value", () => {
    const r = compsEstimate({ sqft: 2_000 }, [
      { id: "1", label: "A", salePrice: 380_000, sqft: 2_000, adjustment: -20_000 },
    ]);
    expect(r.comps[0].adjustedPrice).toBe(400_000);
  });

  it("floors adjusted price at zero", () => {
    const r = compsEstimate({ sqft: 1_000 }, [
      { id: "1", label: "A", salePrice: 100_000, sqft: 1_000, adjustment: 500_000 },
    ]);
    expect(r.comps[0].adjustedPrice).toBe(0);
    expect(r.comps[0].adjustedPricePerSqft).toBeNull();
  });

  it("excludes comps with invalid sqft from the range", () => {
    const r = compsEstimate({ sqft: 2_000 }, [
      { id: "1", label: "A", salePrice: 400_000, sqft: 2_000 }, // 200
      { id: "2", label: "B", salePrice: 450_000, sqft: 0 }, // unusable
    ]);
    expect(r.usableCount).toBe(1);
    expect(r.avgPricePerSqft).toBe(200);
  });

  it("returns nulls when there are no usable comps", () => {
    const r = compsEstimate({ sqft: 2_000 }, []);
    expect(r.usableCount).toBe(0);
    expect(r.avgPricePerSqft).toBeNull();
    expect(r.estimatedMid).toBeNull();
  });

  it("returns null estimates when subject sqft is invalid", () => {
    const r = compsEstimate({ sqft: 0 }, comps);
    expect(r.avgPricePerSqft).toBe(225); // comp stats still derive
    expect(r.estimatedLow).toBeNull();
    expect(r.estimatedMid).toBeNull();
    expect(r.estimatedHigh).toBeNull();
  });
});
