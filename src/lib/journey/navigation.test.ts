import { describe, expect, it } from "vitest";
import { flattenedSteps, getStages } from "./index";
import { taskKey } from "@/hooks/use-progress";
import {
  STAGE_TOOLS,
  isStepComplete,
  nextStep,
  stageToolsFor,
} from "./navigation";
import type { CompletedTasks } from "@/hooks/use-progress";

/** Mark every required task of a step complete. */
function completeStep(
  stageSlug: string,
  stepSlug: string,
): CompletedTasks {
  const flat = flattenedSteps();
  const found = flat.find(
    (x) => x.stage.slug === stageSlug && x.step.slug === stepSlug,
  );
  if (!found) throw new Error(`unknown step ${stageSlug}/${stepSlug}`);
  const map: CompletedTasks = {};
  for (const task of found.step.tasks) {
    if (!task.optional) map[taskKey(stageSlug, stepSlug, task.id)] = true;
  }
  return map;
}

describe("stageToolsFor", () => {
  it("returns the offer builder + savings calculator for make-an-offer", () => {
    const tools = stageToolsFor("make-an-offer");
    const hrefs = tools.map((t) => t.href);
    expect(hrefs).toContain("/tools/offer-builder");
    expect(hrefs).toContain("/tools/savings-calculator");
  });

  it("maps get-ready to the savings calculator", () => {
    expect(stageToolsFor("get-ready").map((t) => t.href)).toContain(
      "/tools/savings-calculator",
    );
  });

  it("maps inspection and earnest-money stages to the tracker", () => {
    expect(stageToolsFor("inspection").map((t) => t.href)).toContain("/tracker");
    expect(
      stageToolsFor("earnest-money-and-open-escrow").map((t) => t.href),
    ).toContain("/tracker");
  });

  it("maps the tour stage to showings", () => {
    expect(stageToolsFor("tour-and-evaluate").map((t) => t.href)).toContain(
      "/showings",
    );
  });

  it("returns an empty array for an unmapped/unknown stage", () => {
    expect(stageToolsFor("post-purchase")).toEqual([]);
    expect(stageToolsFor("does-not-exist")).toEqual([]);
  });

  it("only references real stage slugs", () => {
    const valid = new Set(getStages().map((s) => s.slug));
    for (const slug of Object.keys(STAGE_TOOLS)) {
      expect(valid.has(slug)).toBe(true);
    }
  });
});

describe("isStepComplete", () => {
  it("is true only when all required tasks are done", () => {
    const step = {
      tasks: [
        { id: "a" },
        { id: "b" },
        { id: "c", optional: true },
      ],
    };
    expect(isStepComplete("s", "st", step, {})).toBe(false);
    expect(
      isStepComplete("s", "st", step, { [taskKey("s", "st", "a")]: true }),
    ).toBe(false);
    // both required done, optional ignored
    expect(
      isStepComplete("s", "st", step, {
        [taskKey("s", "st", "a")]: true,
        [taskKey("s", "st", "b")]: true,
      }),
    ).toBe(true);
  });
});

describe("nextStep", () => {
  it("returns the very first step as a Start state with no progress", () => {
    const info = nextStep({});
    const first = flattenedSteps()[0];
    expect(info.isStart).toBe(true);
    expect(info.isComplete).toBe(false);
    expect(info.stageSlug).toBe(first.stage.slug);
    expect(info.stepSlug).toBe(first.step.slug);
    expect(info.href).toBe(`/journey/${first.stage.slug}/${first.step.slug}`);
    expect(info.totalStages).toBe(getStages().length);
  });

  it("advances to the next step once the first is complete", () => {
    const flat = flattenedSteps();
    const first = flat[0];
    const second = flat[1];
    const progress = completeStep(first.stage.slug, first.step.slug);
    const info = nextStep(progress);
    expect(info.isStart).toBe(false);
    expect(info.stageSlug).toBe(second.stage.slug);
    expect(info.stepSlug).toBe(second.step.slug);
  });

  it("surfaces the EARLIEST incomplete step even when later ones are done", () => {
    const flat = flattenedSteps();
    const first = flat[0];
    const third = flat[2];
    // Complete the third step but leave the first/second incomplete.
    const progress = completeStep(third.stage.slug, third.step.slug);
    const info = nextStep(progress);
    expect(info.stageSlug).toBe(first.stage.slug);
    expect(info.stepSlug).toBe(first.step.slug);
  });

  it("reports isComplete when every step is done", () => {
    const flat = flattenedSteps();
    let all: CompletedTasks = {};
    for (const { stage, step } of flat) {
      all = { ...all, ...completeStep(stage.slug, step.slug) };
    }
    const info = nextStep(all);
    expect(info.isComplete).toBe(true);
    const last = flat[flat.length - 1];
    expect(info.stepSlug).toBe(last.step.slug);
  });
});
