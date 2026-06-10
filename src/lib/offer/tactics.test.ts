import { describe, expect, it } from "vitest";
import { OFFER_TACTICS } from "./tactics";

describe("OFFER_TACTICS", () => {
  it("includes all four advanced tactics", () => {
    const ids = OFFER_TACTICS.map((t) => t.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "escalation-clause",
        "appraisal-gap-coverage",
        "as-is-offer",
        "rent-back",
      ]),
    );
    expect(OFFER_TACTICS).toHaveLength(4);
  });

  it("has unique ids", () => {
    const ids = OFFER_TACTICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has non-empty name, whatItIs, howItHelps and howItBackfires for every tactic", () => {
    for (const t of OFFER_TACTICS) {
      expect(t.name.trim()).not.toBe("");
      expect(t.whatItIs.trim()).not.toBe("");
      expect(t.howItHelps.trim()).not.toBe("");
      expect(t.howItBackfires.trim()).not.toBe("");
    }
  });

  it("routes the escalation clause to an attorney in its risk note", () => {
    const escalation = OFFER_TACTICS.find((t) => t.id === "escalation-clause");
    expect(escalation?.howItBackfires.toLowerCase()).toContain("attorney");
  });
});
