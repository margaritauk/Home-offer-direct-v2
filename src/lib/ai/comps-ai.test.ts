import { describe, expect, it } from "vitest";
import { buildCompsPrompt, parseCompsResponse } from "./comps-ai";
import type { CandidateSale, CompsSubject } from "@/lib/tools/comps-source";

const subject: CompsSubject = {
  label: "100 Subject Ln",
  sqft: 2000,
  city: "Austin",
  state: "TX",
};

const candidates: CandidateSale[] = [
  {
    id: "cand-1",
    address: "101 Maple St",
    city: "Austin",
    state: "TX",
    salePrice: 420_000,
    sqft: 1950,
    distanceMiles: 0.3,
  },
  {
    id: "cand-2",
    address: "202 Oak Ave",
    city: "Austin",
    state: "TX",
    salePrice: 455_000,
    sqft: 2100,
    distanceMiles: 0.6,
  },
];

describe("buildCompsPrompt", () => {
  it("includes every candidate by id and address", () => {
    const { user } = buildCompsPrompt(subject, candidates);
    for (const c of candidates) {
      expect(user).toContain(c.id);
      expect(user).toContain(c.address);
    }
  });

  it("instructs no-fabrication and estimate framing", () => {
    const { system } = buildCompsPrompt(subject, candidates);
    expect(system.toLowerCase()).toContain("only from the provided candidate");
    expect(system.toLowerCase()).toMatch(/not invent|never invent|not.*fabricate/);
    expect(system.toLowerCase()).toContain("estimate");
    expect(system.toLowerCase()).toContain("not an appraisal");
  });

  it("embeds the subject facts", () => {
    const { user } = buildCompsPrompt(subject, candidates);
    expect(user).toContain("100 Subject Ln");
    expect(user).toContain("Austin");
  });
});

describe("parseCompsResponse", () => {
  it("parses valid JSON into Comp[] anchored to candidate facts", () => {
    const text = JSON.stringify({
      comps: [
        { id: "cand-1", label: "ignored", salePrice: 1, sqft: 1, adjustment: -5000 },
        { id: "cand-2", adjustment: 3000 },
      ],
    });
    const comps = parseCompsResponse(text, candidates);
    expect(comps).toHaveLength(2);
    // Facts come from OUR candidate data, not the model's bogus 1/1 values.
    expect(comps[0]).toMatchObject({
      id: "cand-1",
      label: "101 Maple St",
      salePrice: 420_000,
      sqft: 1950,
      adjustment: -5000,
    });
    expect(comps[1]).toMatchObject({
      id: "cand-2",
      salePrice: 455_000,
      adjustment: 3000,
    });
  });

  it("drops hallucinated comps not in the candidate list", () => {
    const text = JSON.stringify({
      comps: [
        { id: "cand-1", adjustment: 0 },
        { id: "ghost-999", label: "999 Fake Rd", salePrice: 700_000, sqft: 3000, adjustment: 0 },
      ],
    });
    const comps = parseCompsResponse(text, candidates);
    expect(comps).toHaveLength(1);
    expect(comps[0].id).toBe("cand-1");
    expect(comps.some((c) => c.id === "ghost-999")).toBe(false);
  });

  it("matches by address when id is absent or wrong", () => {
    const text = JSON.stringify({
      comps: [{ label: "202 Oak Ave", adjustment: 100 }],
    });
    const comps = parseCompsResponse(text, candidates);
    expect(comps).toHaveLength(1);
    expect(comps[0].id).toBe("cand-2");
  });

  it("de-dupes the same candidate listed twice", () => {
    const text = JSON.stringify({
      comps: [
        { id: "cand-1", adjustment: 0 },
        { id: "cand-1", adjustment: 999 },
      ],
    });
    const comps = parseCompsResponse(text, candidates);
    expect(comps).toHaveLength(1);
  });

  it("tolerates a ```json fenced / prose-wrapped response", () => {
    const text = "Here are the comps:\n```json\n" +
      JSON.stringify({ comps: [{ id: "cand-1", adjustment: 0 }] }) +
      "\n```\nHope that helps!";
    const comps = parseCompsResponse(text, candidates);
    expect(comps).toHaveLength(1);
    expect(comps[0].id).toBe("cand-1");
  });

  it("returns [] on malformed, empty, or non-JSON text", () => {
    expect(parseCompsResponse("", candidates)).toEqual([]);
    expect(parseCompsResponse("not json at all", candidates)).toEqual([]);
    expect(parseCompsResponse("{ broken", candidates)).toEqual([]);
    expect(parseCompsResponse(JSON.stringify({ comps: "nope" }), candidates)).toEqual([]);
  });

  it("screens protected-class signals out of the label", () => {
    const fhaCandidate: CandidateSale = {
      id: "cand-fha",
      address: "5 Christian Church Rd",
      salePrice: 400_000,
      sqft: 2000,
    };
    const text = JSON.stringify({ comps: [{ id: "cand-fha", adjustment: 0 }] });
    const comps = parseCompsResponse(text, [fhaCandidate]);
    expect(comps).toHaveLength(1);
    expect(comps[0].label).not.toMatch(/christian|church/i);
    expect(comps[0].label).toContain("[removed]");
  });
});
