import { stages } from "./data";
import type { JourneyStage, JourneyStep } from "./types";

export { stages };
export type { JourneyStage, JourneyStep } from "./types";

/** Stages in display order. */
export function getStages(): JourneyStage[] {
  return [...stages].sort((a, b) => a.order - b.order);
}

export function getStage(slug: string): JourneyStage | undefined {
  return stages.find((s) => s.slug === slug);
}

export function getStep(
  stageSlug: string,
  stepSlug: string,
): { stage: JourneyStage; step: JourneyStep } | undefined {
  const stage = getStage(stageSlug);
  const step = stage?.steps.find((s) => s.slug === stepSlug);
  if (!stage || !step) return undefined;
  return { stage, step };
}

/** Total number of steps across all stages. */
export function totalSteps(): number {
  return stages.reduce((n, s) => n + s.steps.length, 0);
}

/** Total number of checklist tasks across the whole journey. */
export function totalTasks(): number {
  return stages.reduce(
    (n, stage) => n + stage.steps.reduce((m, step) => m + step.tasks.length, 0),
    0,
  );
}

/** Flat, ordered list of every step with its parent stage — for prev/next nav. */
export function flattenedSteps(): { stage: JourneyStage; step: JourneyStep }[] {
  return getStages().flatMap((stage) =>
    stage.steps.map((step) => ({ stage, step })),
  );
}

/** The step immediately before/after a given step in the linear journey. */
export function stepNeighbors(stageSlug: string, stepSlug: string) {
  const flat = flattenedSteps();
  const idx = flat.findIndex(
    (x) => x.stage.slug === stageSlug && x.step.slug === stepSlug,
  );
  return {
    prev: idx > 0 ? flat[idx - 1] : undefined,
    next: idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : undefined,
  };
}
