/**
 * Freshness sweep (S1-H2). This is the CI guard that FAILS the moment a typed
 * dated legal/market/tax fact lacks a `source` + `asOf`, plus the staleness flag
 * past a threshold. UDAP: no unsourced dated claim ships.
 */
import { describe, expect, it } from "vitest";
import {
  DATED_FACTS,
  DEFAULT_STALENESS_DAYS,
  isFreshnessComplete,
  isStale,
  sweepFreshness,
  type DatedFact,
} from "./dated-facts";

describe("dated-fact freshness — completeness (CI gate)", () => {
  it("every registered dated fact carries a non-empty source", () => {
    for (const fact of DATED_FACTS) {
      expect(fact.source.trim().length, `${fact.id} is missing a source`).toBeGreaterThan(0);
    }
  });

  it("every registered dated fact carries a valid as-of date", () => {
    for (const fact of DATED_FACTS) {
      expect(isFreshnessComplete(fact), `${fact.id} has no valid asOf`).toBe(true);
    }
  });

  it("the live registry has ZERO facts missing source/as-of", () => {
    // Use a far-future today so completeness is asserted independently of staleness.
    const report = sweepFreshness(DATED_FACTS, "2999-01-01");
    expect(report.missing).toEqual([]);
  });

  it("every registered fact has a unique id", () => {
    const ids = DATED_FACTS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("isFreshnessComplete — fails on missing provenance", () => {
  const base: DatedFact = {
    id: "x",
    category: "legal",
    claim: "A claim.",
    source: "Some Source",
    asOf: "2025-01-01",
  };

  it("is true for a complete fact", () => {
    expect(isFreshnessComplete(base)).toBe(true);
  });

  it("is false when source is blank/whitespace", () => {
    expect(isFreshnessComplete({ ...base, source: "" })).toBe(false);
    expect(isFreshnessComplete({ ...base, source: "   " })).toBe(false);
  });

  it("is false when asOf is missing or invalid", () => {
    expect(isFreshnessComplete({ ...base, asOf: "" })).toBe(false);
    expect(isFreshnessComplete({ ...base, asOf: "not-a-date" })).toBe(false);
    expect(isFreshnessComplete({ ...base, asOf: "2025-02-30" })).toBe(false);
  });
});

describe("isStale — staleness flag past a threshold", () => {
  const fact: DatedFact = {
    id: "s",
    category: "tax",
    claim: "A tax fact.",
    source: "IRS",
    asOf: "2024-01-01",
  };

  it("is not stale within the threshold window", () => {
    expect(isStale(fact, "2024-06-01", DEFAULT_STALENESS_DAYS)).toBe(false);
  });

  it("is stale once asOf is older than the threshold", () => {
    // 600 days after 2024-01-01 exceeds the default 540-day threshold.
    expect(isStale(fact, "2025-08-24", DEFAULT_STALENESS_DAYS)).toBe(true);
  });

  it("respects a custom threshold", () => {
    expect(isStale(fact, "2024-02-01", 10)).toBe(true);
    expect(isStale(fact, "2024-01-05", 10)).toBe(false);
  });

  it("is not flagged stale when asOf is invalid (that's a completeness fail)", () => {
    expect(isStale({ ...fact, asOf: "bad" }, "2030-01-01")).toBe(false);
  });
});

describe("sweepFreshness — classifies ok / missing / stale", () => {
  const facts: DatedFact[] = [
    { id: "ok", category: "market", claim: "c", source: "S", asOf: "2025-01-01" },
    { id: "missing-source", category: "market", claim: "c", source: "", asOf: "2025-01-01" },
    { id: "stale", category: "market", claim: "c", source: "S", asOf: "2020-01-01" },
  ];

  it("buckets each fact correctly against today + threshold", () => {
    const report = sweepFreshness(facts, "2025-06-01", DEFAULT_STALENESS_DAYS);
    expect(report.missing.map((f) => f.id)).toEqual(["missing-source"]);
    expect(report.stale.map((f) => f.id)).toEqual(["stale"]);
    expect(report.ok.map((f) => f.id)).toEqual(["ok"]);
  });
});
