import { describe, expect, it } from "vitest";
import { MULTIPLE_OFFER_TACTICS, OFFER_TACTICS } from "./tactics";

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

describe("MULTIPLE_OFFER_TACTICS (A3 bidding-war playbook)", () => {
  it("covers earnest money, terms beyond price, contingency/close, highest-and-best, and pre-approval", () => {
    const ids = MULTIPLE_OFFER_TACTICS.map((t) => t.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "earnest-money-sizing",
        "terms-beyond-price",
        "contingency-and-close-levers",
        "highest-and-best",
        "pre-approval-strength",
      ]),
    );
  });

  it("has unique ids and non-empty name/what/help/backfires for every card", () => {
    const ids = MULTIPLE_OFFER_TACTICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of MULTIPLE_OFFER_TACTICS) {
      expect(t.name.trim()).not.toBe("");
      expect(t.whatItIs.trim()).not.toBe("");
      expect(t.howItHelps.trim()).not.toBe("");
      expect(t.howItBackfires.trim()).not.toBe("");
    }
  });

  it("frames every card as a trade-off, never a directive (UPL)", () => {
    const directive = /\byou should\b|\bwe recommend\b|\boffer \$|\bwaive your\b|\bmust waive\b/i;
    for (const t of MULTIPLE_OFFER_TACTICS) {
      const all = `${t.whatItIs} ${t.howItHelps} ${t.howItBackfires}`;
      expect(all).not.toMatch(directive);
    }
  });

  it("includes NO buyer love-letter / personal-appeal card (FHA)", () => {
    const all = MULTIPLE_OFFER_TACTICS.map((t) =>
      `${t.id} ${t.name} ${t.whatItIs} ${t.howItHelps}`.toLowerCase(),
    ).join(" ");
    expect(all).not.toMatch(/love letter|personal letter|dear seller|appeal to the seller/);
  });
});
