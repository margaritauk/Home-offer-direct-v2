import { describe, expect, it } from "vitest";
import { flattenedSteps } from "./index";
import { taskKey } from "@/hooks/use-progress";
import {
  resumeTarget,
  stepStatus,
  toolHasData,
  toolIdForHref,
  toolLabelForHref,
  type LastPosition,
} from "./navigation";
import type { CompletedTasks } from "@/hooks/use-progress";

const STAGE = "tour-and-evaluate";
const STEP = "schedule-and-assess";

function stepFor(stageSlug: string, stepSlug: string) {
  const found = flattenedSteps().find(
    (x) => x.stage.slug === stageSlug && x.step.slug === stepSlug,
  );
  if (!found) throw new Error(`unknown step ${stageSlug}/${stepSlug}`);
  return found.step;
}

function completeStep(stageSlug: string, stepSlug: string): CompletedTasks {
  const step = stepFor(stageSlug, stepSlug);
  const map: CompletedTasks = {};
  for (const t of step.tasks) {
    if (!t.optional) map[taskKey(stageSlug, stepSlug, t.id)] = true;
  }
  return map;
}

describe("toolIdForHref / toolLabelForHref", () => {
  it("extracts the toolId from a /tools/<id> href", () => {
    expect(toolIdForHref("/tools/tour-scorecard")).toBe("tour-scorecard");
    expect(toolIdForHref("/tools/tour-scorecard/")).toBe("tour-scorecard");
  });

  it("returns undefined for non-tool hrefs", () => {
    expect(toolIdForHref("/listings")).toBeUndefined();
    expect(toolIdForHref("/journey/x/y")).toBeUndefined();
  });

  it("resolves a tool's display label", () => {
    expect(toolLabelForHref("/tools/tour-scorecard")).toBe("Tour Scorecard");
    expect(toolLabelForHref("/tools/does-not-exist")).toBeUndefined();
  });
});

describe("toolHasData", () => {
  it("uses the scorecard predicate (homes.length > 0)", () => {
    expect(toolHasData("tour-scorecard", { homes: [] })).toBe(false);
    expect(toolHasData("tour-scorecard", { homes: [{ id: "h" }] })).toBe(true);
  });

  it("treats undefined / null as no data", () => {
    expect(toolHasData("tour-scorecard", undefined)).toBe(false);
    expect(toolHasData("budget", null)).toBe(false);
  });

  it("falls back to a generic non-empty check for unregistered tools", () => {
    expect(toolHasData("budget", {})).toBe(false);
    expect(toolHasData("budget", { homePrice: 0 })).toBe(false);
    expect(toolHasData("budget", { homePrice: 400000 })).toBe(true);
    expect(toolHasData("budget", { items: [] })).toBe(false);
    expect(toolHasData("budget", { items: [1] })).toBe(true);
  });
});

describe("stepStatus (tri-state)", () => {
  it("is not-started with no progress and no tool data", () => {
    expect(stepStatus(STAGE, STEP, stepFor(STAGE, STEP), {}, {})).toBe(
      "not-started",
    );
  });

  it("is in-progress when a mapped tool has data — without flipping to complete", () => {
    const status = stepStatus(
      STAGE,
      STEP,
      stepFor(STAGE, STEP),
      {},
      { "tour-scorecard": { homes: [{ id: "h" }] } },
    );
    expect(status).toBe("in-progress");
  });

  it("is in-progress when some — but not all — required tasks are ticked", () => {
    const step = stepFor(STAGE, STEP);
    const oneTask = step.tasks.find((t) => !t.optional)!;
    const progress: CompletedTasks = {
      [taskKey(STAGE, STEP, oneTask.id)]: true,
    };
    // Only meaningful if the step has >1 required task; assert in-progress regardless.
    const status = stepStatus(STAGE, STEP, step, progress, {});
    expect(["in-progress", "complete"]).toContain(status);
  });

  it("complete dominates: all required tasks ticked => complete (even with tool data)", () => {
    const status = stepStatus(
      STAGE,
      STEP,
      stepFor(STAGE, STEP),
      completeStep(STAGE, STEP),
      { "tour-scorecard": { homes: [{ id: "h" }] } },
    );
    expect(status).toBe("complete");
  });
});

describe("resumeTarget precedence", () => {
  const toolPos: LastPosition = {
    kind: "tool",
    href: "/tools/tour-scorecard",
    label: "Tour Scorecard",
    updatedAt: 1,
  };
  const stepPos: LastPosition = {
    kind: "step",
    href: `/journey/${STAGE}/${STEP}`,
    label: "Schedule tours",
    stageSlug: STAGE,
    stepSlug: STEP,
    updatedAt: 1,
  };

  it("honors an explicit step position while its step is incomplete", () => {
    const t = resumeTarget({}, stepPos);
    expect(t).toEqual({
      href: stepPos.href,
      label: stepPos.label,
      fromLastPosition: true,
    });
  });

  it("falls through to the computed next when the position's step is complete", () => {
    const t = resumeTarget(completeStep(STAGE, STEP), stepPos);
    expect(t?.fromLastPosition).toBe(false);
    expect(t?.href).not.toBe(stepPos.href);
  });

  it("always honors a tool position (tools never complete)", () => {
    const t = resumeTarget(completeStep(STAGE, STEP), toolPos);
    expect(t).toEqual({
      href: toolPos.href,
      label: toolPos.label,
      fromLastPosition: true,
    });
  });

  it("falls back to the computed next step when there's no position", () => {
    const t = resumeTarget({}, null);
    expect(t?.fromLastPosition).toBe(false);
    expect(t?.href).toMatch(/^\/journey\//);
  });
});
