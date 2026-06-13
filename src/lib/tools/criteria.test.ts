import { describe, expect, it } from "vitest";
import {
  groupByTier,
  toScorecardRubric,
  SUGGESTED_CRITERIA,
  type Criterion,
} from "./criteria";

function crit(over: Partial<Criterion> & Pick<Criterion, "tier">): Criterion {
  return { id: over.id ?? "c1", label: over.label ?? "Bedrooms", ...over };
}

describe("groupByTier", () => {
  it("sorts criteria into must / nice / deal-breaker buckets", () => {
    const groups = groupByTier([
      crit({ id: "a", label: "Beds", tier: "must" }),
      crit({ id: "b", label: "Yard", tier: "nice" }),
      crit({ id: "c", label: "On a busy road", tier: "deal-breaker" }),
      crit({ id: "d", label: "Garage", tier: "must" }),
    ]);
    expect(groups.must.map((c) => c.id)).toEqual(["a", "d"]);
    expect(groups.nice.map((c) => c.id)).toEqual(["b"]);
    expect(groups["deal-breaker"].map((c) => c.id)).toEqual(["c"]);
  });

  it("returns empty buckets for an empty worksheet", () => {
    const groups = groupByTier([]);
    expect(groups.must).toEqual([]);
    expect(groups.nice).toEqual([]);
    expect(groups["deal-breaker"]).toEqual([]);
  });
});

describe("toScorecardRubric", () => {
  it("seeds the Tour Scorecard rubric, weighting must-haves above nice-to-haves", () => {
    const rubric = toScorecardRubric([
      crit({ id: "beds", label: "Bedrooms", tier: "must" }),
      crit({ id: "yard", label: "Big yard", tier: "nice" }),
    ]);
    expect(rubric).toEqual([
      { id: "beds", label: "Bedrooms", weight: 3 },
      { id: "yard", label: "Big yard", weight: 1 },
    ]);
  });

  it("excludes deal-breakers from the scored rubric (pass/fail, not a 1–5 gradient)", () => {
    const rubric = toScorecardRubric([
      crit({ id: "beds", label: "Bedrooms", tier: "must" }),
      crit({ id: "flood", label: "In a flood zone", tier: "deal-breaker" }),
    ]);
    expect(rubric.map((c) => c.id)).toEqual(["beds"]);
  });

  it("skips blank labels and yields a valid empty rubric for an empty worksheet", () => {
    expect(toScorecardRubric([])).toEqual([]);
    expect(
      toScorecardRubric([crit({ id: "x", label: "   ", tier: "must" })]),
    ).toEqual([]);
  });

  it("produces objects matching the shared ScorecardCriterion shape", () => {
    const [row] = toScorecardRubric([
      crit({ id: "beds", label: "Bedrooms", tier: "must" }),
    ]);
    // id + label + weight — the exact shared shape the scorecard rankHomes uses.
    expect(Object.keys(row).sort()).toEqual(["id", "label", "weight"]);
    expect(typeof row.weight).toBe("number");
  });
});

describe("SUGGESTED_CRITERIA (FHA neutrality)", () => {
  it("offers only objective property/logistics attributes — no protected-class proxies", () => {
    const blob = SUGGESTED_CRITERIA.map(
      (c) => `${c.label} ${c.hint ?? ""}`,
    )
      .join(" ")
      .toLowerCase();
    // None of the classic steering proxies should appear in the catalog.
    for (const banned of [
      "good schools",
      "school rating",
      "family-friendly",
      "safe neighborhood",
      "crime",
      "demographic",
      "up-and-coming",
    ]) {
      expect(blob).not.toContain(banned);
    }
  });

  it("frames the budget ceiling as the buyer's own number, not a recommended price", () => {
    const budget = SUGGESTED_CRITERIA.find((c) => c.id === "budget-ceiling")!;
    expect(budget.hint).toMatch(/your own|not a recommended/i);
  });
});
