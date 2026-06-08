import { describe, expect, it } from "vitest";
import {
  DEFAULT_CRITERIA,
  rankHomes,
  scoreHome,
  type ScorecardCriterion,
  type ScoredHome,
} from "./tour-scorecard";

const criteria: ScorecardCriterion[] = [
  { id: "a", label: "A", weight: 2 },
  { id: "b", label: "B", weight: 1 },
  { id: "c", label: "C", weight: 1 },
];

describe("scoreHome", () => {
  it("computes a weighted average on the 1–5 scale", () => {
    // a=4 (w2), b=2 (w1), c=2 (w1) => (8+2+2)/(2+1+1) = 12/4 = 3
    const r = scoreHome({ a: 4, b: 2, c: 2 }, criteria);
    expect(r.weighted).toBe(3);
    expect(r.percent).toBe(60);
    expect(r.ratedCount).toBe(3);
  });

  it("weights higher-weight criteria more", () => {
    const r = scoreHome({ a: 5, b: 1, c: 1 }, criteria);
    // (10 + 1 + 1) / 4 = 3
    expect(r.weighted).toBe(3);
  });

  it("only counts rated criteria in the divisor", () => {
    // only a rated => 5
    const r = scoreHome({ a: 5 }, criteria);
    expect(r.weighted).toBe(5);
    expect(r.ratedCount).toBe(1);
  });

  it("returns zero when nothing is rated", () => {
    const r = scoreHome({}, criteria);
    expect(r.weighted).toBe(0);
    expect(r.percent).toBe(0);
    expect(r.ratedCount).toBe(0);
  });

  it("ignores zero / unrated rows", () => {
    const r = scoreHome({ a: 4, b: 0, c: 0 }, criteria);
    expect(r.weighted).toBe(4);
    expect(r.ratedCount).toBe(1);
  });

  it("clamps out-of-range ratings to 1–5", () => {
    const r = scoreHome({ a: 99, b: 5, c: 5 }, criteria);
    // a clamped to 5 => all 5 => 5
    expect(r.weighted).toBe(5);
  });

  it("ignores criteria with non-positive weight", () => {
    const withZero: ScorecardCriterion[] = [
      { id: "a", label: "A", weight: 0 },
      { id: "b", label: "B", weight: 1 },
    ];
    const r = scoreHome({ a: 1, b: 5 }, withZero);
    expect(r.weighted).toBe(5); // only b counts
    expect(r.ratedCount).toBe(1);
  });

  it("handles NaN ratings safely", () => {
    const r = scoreHome({ a: Number.NaN, b: 4, c: 4 }, criteria);
    expect(r.weighted).toBe(4);
  });
});

describe("rankHomes", () => {
  const homes: ScoredHome[] = [
    { id: "1", label: "One", ratings: { a: 2, b: 2, c: 2 } }, // 2
    { id: "2", label: "Two", ratings: { a: 5, b: 5, c: 5 } }, // 5
    { id: "3", label: "Three", ratings: { a: 3, b: 3, c: 3 } }, // 3
  ];

  it("ranks highest weighted score first", () => {
    const ranked = rankHomes(homes, criteria);
    expect(ranked.map((h) => h.id)).toEqual(["2", "3", "1"]);
    expect(ranked.map((h) => h.rank)).toEqual([1, 2, 3]);
  });

  it("attaches a computed score to each home", () => {
    const ranked = rankHomes(homes, criteria);
    expect(ranked[0].score.weighted).toBe(5);
  });

  it("keeps stable order for ties", () => {
    const tied: ScoredHome[] = [
      { id: "x", label: "X", ratings: { a: 3, b: 3, c: 3 } },
      { id: "y", label: "Y", ratings: { a: 3, b: 3, c: 3 } },
    ];
    const ranked = rankHomes(tied, criteria);
    expect(ranked.map((h) => h.id)).toEqual(["x", "y"]);
  });

  it("sorts unrated homes last", () => {
    const withEmpty: ScoredHome[] = [
      { id: "empty", label: "Empty", ratings: {} },
      { id: "rated", label: "Rated", ratings: { a: 4, b: 4, c: 4 } },
    ];
    const ranked = rankHomes(withEmpty, criteria);
    expect(ranked[0].id).toBe("rated");
    expect(ranked[1].id).toBe("empty");
  });

  it("returns an empty array for no homes", () => {
    expect(rankHomes([], criteria)).toEqual([]);
  });
});

describe("DEFAULT_CRITERIA", () => {
  it("are all property facts with positive weights", () => {
    expect(DEFAULT_CRITERIA.length).toBeGreaterThan(0);
    for (const c of DEFAULT_CRITERIA) {
      expect(c.weight).toBeGreaterThan(0);
      expect(c.id).toBeTruthy();
      expect(c.label).toBeTruthy();
    }
  });
});
