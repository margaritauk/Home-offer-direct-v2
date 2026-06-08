import { describe, expect, it } from "vitest";
import { summarizeFindings, type Finding } from "./inspection";

function f(partial: Partial<Finding>): Finding {
  return {
    id: partial.id ?? Math.random().toString(36).slice(2),
    item: partial.item ?? "Item",
    severity: partial.severity ?? "minor",
    estCost: partial.estCost ?? 0,
    decision: partial.decision ?? "accept",
    notes: partial.notes,
  };
}

describe("summarizeFindings", () => {
  it("returns zeroed counts for an empty list", () => {
    const s = summarizeFindings([]);
    expect(s.total).toBe(0);
    expect(s.countsBySeverity).toEqual({
      minor: 0,
      moderate: 0,
      major: 0,
      safety: 0,
    });
    expect(s.totalEstCost).toBe(0);
    expect(s.hasMajorOrSafety).toBe(false);
    expect(s.flaggedCount).toBe(0);
  });

  it("counts findings by severity", () => {
    const s = summarizeFindings([
      f({ severity: "minor" }),
      f({ severity: "minor" }),
      f({ severity: "moderate" }),
      f({ severity: "major" }),
      f({ severity: "safety" }),
    ]);
    expect(s.countsBySeverity).toEqual({
      minor: 2,
      moderate: 1,
      major: 1,
      safety: 1,
    });
    expect(s.total).toBe(5);
  });

  it("sums estimated costs", () => {
    const s = summarizeFindings([
      f({ estCost: 1_000 }),
      f({ estCost: 2_500 }),
      f({ estCost: 500 }),
    ]);
    expect(s.totalEstCost).toBe(4_000);
  });

  it("treats invalid costs as zero", () => {
    const s = summarizeFindings([
      f({ estCost: Number.NaN }),
      f({ estCost: -100 }),
      f({ estCost: 750 }),
    ]);
    expect(s.totalEstCost).toBe(750);
  });

  it("flags when any major finding exists", () => {
    const s = summarizeFindings([f({ severity: "minor" }), f({ severity: "major" })]);
    expect(s.hasMajorOrSafety).toBe(true);
    expect(s.flaggedCount).toBe(1);
  });

  it("flags when any safety finding exists and counts both major+safety", () => {
    const s = summarizeFindings([
      f({ severity: "major" }),
      f({ severity: "safety" }),
      f({ severity: "moderate" }),
    ]);
    expect(s.hasMajorOrSafety).toBe(true);
    expect(s.flaggedCount).toBe(2);
  });

  it("does not flag when only minor/moderate findings exist", () => {
    const s = summarizeFindings([f({ severity: "minor" }), f({ severity: "moderate" })]);
    expect(s.hasMajorOrSafety).toBe(false);
    expect(s.flaggedCount).toBe(0);
  });
});
