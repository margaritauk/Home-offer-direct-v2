/**
 * Unified journey-progress computation (issue #145).
 *
 * One pure source of truth for "how far through the journey am I?", shared by
 * the journey overview and the dashboard so the progress story is consistent
 * everywhere. Operates on the journey stages + the completed-tasks map; no React.
 */

import { taskKey, type CompletedTasks } from "@/hooks/use-progress";
import type { JourneyStage } from "./types";

/** The persisted task keys for every checklist item in a stage. */
export function stageTaskKeys(stage: JourneyStage): string[] {
  return stage.steps.flatMap((step) =>
    step.tasks.map((t) => taskKey(stage.slug, step.slug, t.id)),
  );
}

export interface StageProgress {
  slug: string;
  title: string;
  order: number;
  done: number;
  total: number;
  complete: boolean;
}

export interface JourneyProgress {
  /** Completed checklist tasks across all stages. */
  doneTasks: number;
  /** Total checklist tasks across all stages. */
  totalTasks: number;
  /** Whole-number percent complete (0–100). */
  pct: number;
  /** Number of stages fully complete. */
  stagesComplete: number;
  /** Per-stage breakdown, in input order. */
  stages: StageProgress[];
}

/**
 * Compute overall + per-stage journey progress from the completed-tasks map.
 * Pure and defensive (a missing/empty map yields 0%).
 */
export function journeyProgress(
  stages: JourneyStage[],
  completed: CompletedTasks | undefined | null,
): JourneyProgress {
  const map = completed ?? {};
  let doneTasks = 0;
  let totalTasks = 0;
  const perStage: StageProgress[] = stages.map((stage) => {
    const keys = stageTaskKeys(stage);
    const done = keys.filter((k) => Boolean(map[k])).length;
    doneTasks += done;
    totalTasks += keys.length;
    return {
      slug: stage.slug,
      title: stage.title,
      order: stage.order,
      done,
      total: keys.length,
      complete: keys.length > 0 && done === keys.length,
    };
  });
  const pct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const stagesComplete = perStage.filter((s) => s.complete).length;
  return { doneTasks, totalTasks, pct, stagesComplete, stages: perStage };
}
