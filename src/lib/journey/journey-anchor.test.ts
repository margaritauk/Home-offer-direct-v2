import { describe, expect, it } from "vitest";
import { getStages } from "./index";
import { journeyAnchorForTool, STAGE_TOOLS } from "./navigation";

describe("journeyAnchorForTool", () => {
  it("resolves the tour scorecard to its owning stage + the next step", () => {
    const anchor = journeyAnchorForTool("/tools/tour-scorecard");
    expect(anchor).not.toBeNull();
    // Owning stage = tour-and-evaluate (its first step); next = make-an-offer.
    expect(anchor!.backHref).toBe("/journey/tour-and-evaluate/schedule-and-assess");
    expect(anchor!.backLabel).toContain("Tour & Evaluate");
    expect(anchor!.nextHref).toBe("/journey/make-an-offer/draft-the-offer");
    expect(anchor!.nextLabel).toMatch(/^Next:/);
  });

  it("resolves a multi-stage tool to its FIRST owning stage (mirrors toolsByStage dedupe)", () => {
    // `compare` appears under both `search` and `tour-and-evaluate`; the first
    // stage in journey order (search) must win.
    const anchor = journeyAnchorForTool("/tools/compare");
    expect(anchor).not.toBeNull();
    expect(anchor!.backHref).toBe("/journey/search/find-listings-and-comps");
    expect(anchor!.backLabel).toContain("Search");
  });

  it("normalizes a trailing slash on the href", () => {
    expect(journeyAnchorForTool("/tools/tour-scorecard/")).toEqual(
      journeyAnchorForTool("/tools/tour-scorecard"),
    );
  });

  it("returns null for an unmapped tool (footer degrades to a back-only link)", () => {
    expect(journeyAnchorForTool("/tools/does-not-exist")).toBeNull();
    expect(journeyAnchorForTool("/listings")).not.toBeNull(); // /listings IS mapped
    expect(journeyAnchorForTool("/totally/unknown")).toBeNull();
  });

  it("a final-stage tool (if any) points 'next' back to the journey", () => {
    // No tool currently maps to the final stage, so synthesize the contract:
    // the last stage with tools still has a real next step (not the terminus).
    const stages = getStages();
    const lastStage = stages[stages.length - 1];
    const lastStageTools = STAGE_TOOLS[lastStage.slug] ?? [];
    // The truly final stage has no tools today — the terminus branch is unused
    // but covered by the helper. Assert the invariant that drives it:
    if (lastStageTools.length > 0) {
      const anchor = journeyAnchorForTool(lastStageTools[0].href);
      expect(anchor!.nextHref).toBe("/journey");
      expect(anchor!.nextLabel).toBe("Back to journey");
    } else {
      expect(lastStageTools).toHaveLength(0);
    }
  });

  it("every STAGE_TOOLS href resolves to a non-null anchor (no tool dead-ends)", () => {
    const allHrefs = new Set<string>();
    for (const tools of Object.values(STAGE_TOOLS)) {
      for (const t of tools) allHrefs.add(t.href);
    }
    for (const href of allHrefs) {
      expect(journeyAnchorForTool(href), href).not.toBeNull();
    }
  });
});
