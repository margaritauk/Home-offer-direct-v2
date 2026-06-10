import { describe, expect, it } from "vitest";
import { getStages } from "./index";
import { STAGE_TOOLS, stageToolsFor } from "./navigation";
import { SITUATIONS, recommendForSituation } from "./onboarding";

const stageSlugs = new Set(getStages().map((s) => s.slug));

describe("SITUATIONS", () => {
  it("has at least one starting point", () => {
    expect(SITUATIONS.length).toBeGreaterThan(0);
  });

  it("every situation maps to a real stage slug present in getStages()", () => {
    for (const situation of SITUATIONS) {
      expect(stageSlugs.has(situation.stageSlug)).toBe(true);
    }
  });

  it("has unique ids and a label + rationale for each", () => {
    const ids = SITUATIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SITUATIONS) {
      expect(s.label.trim().length).toBeGreaterThan(0);
      expect(s.rationale.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("recommendForSituation", () => {
  it("returns the matched stage title from getStages() for every situation", () => {
    const bySlug = new Map(getStages().map((s) => [s.slug, s]));
    for (const situation of SITUATIONS) {
      const rec = recommendForSituation(situation.id);
      const stage = bySlug.get(situation.stageSlug)!;
      expect(rec.stageSlug).toBe(situation.stageSlug);
      expect(rec.stageTitle).toBe(stage.title);
      expect(rec.rationale).toBe(situation.rationale);
    }
  });

  it("pulls tools from STAGE_TOOLS for the resolved stage", () => {
    for (const situation of SITUATIONS) {
      const rec = recommendForSituation(situation.id);
      expect(rec.tools).toEqual(stageToolsFor(situation.stageSlug));
      // Tools come from the STAGE_TOOLS map (or an empty array when none).
      expect(rec.tools).toEqual(STAGE_TOOLS[situation.stageSlug] ?? []);
    }
  });

  it("falls back to the first stage for an unknown id", () => {
    const first = getStages()[0];
    const rec = recommendForSituation("does-not-exist");
    expect(rec.stageSlug).toBe(first.slug);
    expect(rec.stageTitle).toBe(first.title);
    expect(rec.tools).toEqual(stageToolsFor(first.slug));
    expect(rec.rationale.length).toBeGreaterThan(0);
  });

  it("treats an empty id as unknown and uses the first stage", () => {
    const first = getStages()[0];
    expect(recommendForSituation("").stageSlug).toBe(first.slug);
  });
});
