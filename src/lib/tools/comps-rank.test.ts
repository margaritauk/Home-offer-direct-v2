import { describe, expect, it } from "vitest";
import { rankComps } from "./comps-rank";
import type { CandidateSale, CompsSubject } from "./comps-source";

const subject: CompsSubject = { sqft: 2000, city: "Austin", state: "TX" };

function candidate(over: Partial<CandidateSale> & { id: string }): CandidateSale {
  return {
    address: `${over.id} St`,
    salePrice: 500_000,
    sqft: 2000,
    saleDate: "2024-12-01",
    ...over,
  };
}

describe("rankComps", () => {
  it("returns [] for empty candidates", () => {
    expect(rankComps(subject, [])).toEqual([]);
  });

  it("returns [] for garbage / unusable candidates", () => {
    const bad = [
      candidate({ id: "a", sqft: 0 }),
      candidate({ id: "b", salePrice: 0 }),
    ];
    expect(rankComps(subject, bad)).toEqual([]);
  });

  it("ranks by sqft closeness to the subject (primary)", () => {
    const candidates = [
      candidate({ id: "far", sqft: 2600 }),
      candidate({ id: "close", sqft: 2050 }),
      candidate({ id: "mid", sqft: 2300 }),
    ];
    const ranked = rankComps(subject, candidates);
    expect(ranked.map((c) => c.id)).toEqual(["close", "mid", "far"]);
  });

  it("breaks sqft ties by recency (more recent wins)", () => {
    const candidates = [
      candidate({ id: "older", sqft: 2100, saleDate: "2024-06-01" }),
      candidate({ id: "newer", sqft: 2100, saleDate: "2024-12-01" }),
    ];
    const ranked = rankComps(subject, candidates);
    expect(ranked.map((c) => c.id)).toEqual(["newer", "older"]);
  });

  it("respects the limit option (default ~4)", () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      candidate({ id: `c${i}`, sqft: 2000 + i * 10 }),
    );
    expect(rankComps(subject, many)).toHaveLength(4);
    expect(rankComps(subject, many, { limit: 2 })).toHaveLength(2);
  });

  it("applies a size-based adjustment (positive when comp is larger)", () => {
    const bigger = candidate({ id: "big", sqft: 2200, salePrice: 550_000 });
    const [comp] = rankComps(subject, [bigger]);
    // pps = 550000/2200 = 250; delta sqft = +200; adjustment = +50000.
    expect(comp.adjustment).toBe(50_000);

    const smaller = candidate({ id: "small", sqft: 1800, salePrice: 450_000 });
    const [comp2] = rankComps(subject, [smaller]);
    // pps = 450000/1800 = 250; delta sqft = -200; adjustment = -50000.
    expect(comp2.adjustment).toBe(-50_000);
  });

  it("uses zero adjustment when the subject sqft is unknown", () => {
    const [comp] = rankComps({}, [candidate({ id: "x", sqft: 2200 })]);
    expect(comp.adjustment).toBe(0);
  });

  it("carries the (sample) marker for sample candidates", () => {
    const [real] = rankComps(subject, [
      candidate({ id: "r", address: "1 Real Rd" }),
    ]);
    expect(real.label).toBe("1 Real Rd");

    const [samp] = rankComps(subject, [
      candidate({ id: "s", address: "2 Sample Rd", sample: true }),
    ]);
    expect(samp.label).toBe("2 Sample Rd (sample)");
  });

  it("maps candidate fields into the Comp shape", () => {
    const [comp] = rankComps(subject, [
      candidate({ id: "m", address: "9 Map Ln", salePrice: 480_000, sqft: 1920 }),
    ]);
    expect(comp).toMatchObject({
      id: "m",
      salePrice: 480_000,
      sqft: 1920,
    });
    expect(typeof comp.adjustment).toBe("number");
  });

  it("is deterministic for the same inputs", () => {
    const candidates = [
      candidate({ id: "a", sqft: 2100 }),
      candidate({ id: "b", sqft: 1950 }),
      candidate({ id: "c", sqft: 2300 }),
    ];
    expect(rankComps(subject, candidates)).toEqual(rankComps(subject, candidates));
  });
});
