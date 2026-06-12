import { describe, expect, it } from "vitest";
import {
  ANCHORING_AND_CONCESSIONS,
  NON_PRICE_LEVERS,
  READING_A_COUNTER,
  WALK_AWAY_DISCIPLINE,
  summarizeRepairLeverage,
} from "./negotiation-playbook";
import type { FindingsSummary } from "./inspection";

const ALL_ENTRIES = [
  ...READING_A_COUNTER,
  ...ANCHORING_AND_CONCESSIONS,
  ...NON_PRICE_LEVERS,
  ...WALK_AWAY_DISCIPLINE,
];

describe("negotiation playbook content", () => {
  it("has unique ids and non-empty title/body/tradeoff for every entry", () => {
    const ids = ALL_ENTRIES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of ALL_ENTRIES) {
      expect(e.title.trim()).not.toBe("");
      expect(e.body.trim()).not.toBe("");
      expect(e.tradeoff.trim()).not.toBe("");
    }
  });

  it("covers anchoring, non-price concessions, and walk-away discipline", () => {
    const ids = ALL_ENTRIES.map((e) => e.id);
    expect(ids).toContain("anchoring");
    expect(NON_PRICE_LEVERS.map((e) => e.id)).toEqual(
      expect.arrayContaining(["rent-back", "as-is", "earnest-money-size", "closing-possession-date"]),
    );
    expect(WALK_AWAY_DISCIPLINE.map((e) => e.id)).toContain("set-your-max-first");
  });

  it("teaches that a counter is a rejection and that counters expire", () => {
    const ids = READING_A_COUNTER.map((e) => e.id);
    expect(ids).toContain("counter-is-a-rejection");
    expect(ids).toContain("time-is-of-the-essence");
  });

  it("clarifies as-is does not necessarily waive the right to inspect/withdraw", () => {
    const asIs = NON_PRICE_LEVERS.find((e) => e.id === "as-is");
    expect(asIs?.tradeoff.toLowerCase()).toMatch(/inspect|withdraw/);
  });

  it("never emits a directive 'counter at $X' / 'you should' (UPL)", () => {
    const directive = /\bcounter at \$|\byou should\b|\bwe recommend\b|\bask for \$|\boffer \$/i;
    for (const e of ALL_ENTRIES) {
      expect(`${e.body} ${e.tradeoff}`).not.toMatch(directive);
    }
  });

  it("ties walk-away discipline to the PRIVATE walk-away max and keeping it private", () => {
    const text = WALK_AWAY_DISCIPLINE.map((e) => `${e.body} ${e.tradeoff}`)
      .join(" ")
      .toLowerCase();
    expect(text).toContain("walk-away max");
    expect(text).toMatch(/private|to yourself|never shared/);
  });
});

describe("summarizeRepairLeverage", () => {
  const summary = (over: Partial<FindingsSummary>): FindingsSummary => ({
    total: 0,
    countsBySeverity: { minor: 0, moderate: 0, major: 0, safety: 0 },
    totalEstCost: 0,
    hasMajorOrSafety: false,
    flaggedCount: 0,
    ...over,
  });

  it("returns an empty-state note when there are no findings", () => {
    const note = summarizeRepairLeverage(summary({ total: 0 }));
    expect(note.hasLeverage).toBe(false);
    expect(note.lines.join(" ")).toMatch(/log your inspection findings/i);
  });

  it("handles null/undefined summary without crashing", () => {
    expect(summarizeRepairLeverage(null).hasLeverage).toBe(false);
    expect(summarizeRepairLeverage(undefined).hasLeverage).toBe(false);
  });

  it("summarizes findings counts, flagged items, and the buyer's own estimated total", () => {
    const note = summarizeRepairLeverage(
      summary({
        total: 3,
        flaggedCount: 1,
        totalEstCost: 8000,
        hasMajorOrSafety: true,
        countsBySeverity: { minor: 1, moderate: 1, major: 1, safety: 0 },
      }),
    );
    expect(note.hasLeverage).toBe(true);
    const text = note.lines.join(" ");
    expect(text).toMatch(/3 findings/);
    expect(text).toMatch(/1 of them major or safety/);
    expect(text).toMatch(/\$8,000/);
  });

  it("explains repair vs credit vs price-reduction mechanics without naming a figure to ask for", () => {
    const note = summarizeRepairLeverage(
      summary({ total: 1, totalEstCost: 2000, countsBySeverity: { minor: 1, moderate: 0, major: 0, safety: 0 } }),
    );
    const text = note.lines.join(" ").toLowerCase();
    expect(text).toContain("credit");
    expect(text).toContain("price reduction");
    expect(text).toContain("repair");
    // UPL: never tells the buyer the amount to seek.
    expect(text).not.toMatch(/ask for \$|request \$|seek \$|counter at \$/);
  });
});
