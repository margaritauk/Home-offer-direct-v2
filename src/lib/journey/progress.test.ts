import { describe, expect, it } from "vitest";
import { getStages } from "./index";
import { taskKey } from "@/hooks/use-progress";
import { journeyProgress, stageTaskKeys } from "./progress";

const stages = getStages();

describe("journeyProgress", () => {
  it("is 0% with no completed tasks", () => {
    const r = journeyProgress(stages, {});
    expect(r.pct).toBe(0);
    expect(r.doneTasks).toBe(0);
    expect(r.totalTasks).toBeGreaterThan(0);
    expect(r.stagesComplete).toBe(0);
    expect(r.stages.length).toBe(stages.length);
  });

  it("handles null/undefined defensively", () => {
    expect(journeyProgress(stages, null).pct).toBe(0);
    expect(journeyProgress(stages, undefined).pct).toBe(0);
  });

  it("is 100% when every task is done", () => {
    const all: Record<string, boolean> = {};
    for (const s of stages) for (const k of stageTaskKeys(s)) all[k] = true;
    const r = journeyProgress(stages, all);
    expect(r.pct).toBe(100);
    expect(r.doneTasks).toBe(r.totalTasks);
    expect(r.stagesComplete).toBe(stages.length);
  });

  it("counts a fully-completed stage as complete and computes a partial percent", () => {
    const first = stages[0];
    const keys = stageTaskKeys(first);
    const completed: Record<string, boolean> = {};
    keys.forEach((k) => (completed[k] = true));
    const r = journeyProgress(stages, completed);
    expect(r.stages[0].complete).toBe(true);
    expect(r.stages[0].done).toBe(keys.length);
    expect(r.doneTasks).toBe(keys.length);
    expect(r.pct).toBeGreaterThan(0);
    expect(r.pct).toBeLessThan(100);
  });

  it("ignores unknown keys in the completed map", () => {
    const r = journeyProgress(stages, { "not/a/real-key": true });
    expect(r.doneTasks).toBe(0);
  });

  it("stageTaskKeys produces keys via taskKey", () => {
    const s = stages[0];
    const k = stageTaskKeys(s)[0];
    const step = s.steps[0];
    expect(k).toBe(taskKey(s.slug, step.slug, step.tasks[0].id));
  });
});
