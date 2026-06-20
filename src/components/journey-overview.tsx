"use client";

import Link from "next/link";
import { useProgress, taskKey } from "@/hooks/use-progress";
import { useToolData } from "@/hooks/use-tool-data";
import { journeyProgress } from "@/lib/journey/progress";
import { stepStatus } from "@/lib/journey/navigation";
import type { JourneyStage } from "@/lib/journey/types";

function stageTaskKeys(stage: JourneyStage): string[] {
  return stage.steps.flatMap((step) =>
    step.tasks.map((t) => taskKey(stage.slug, step.slug, t.id)),
  );
}

type StageState = "not-started" | "in-progress" | "complete";

/** Tri-state for a stage: complete when all tasks done; in-progress when any
 *  step is in-progress (task ticked or a mapped tool has data); else not. */
function stageState(
  stage: JourneyStage,
  completed: Record<string, boolean>,
  toolData: Record<string, unknown>,
  complete: boolean,
): StageState {
  if (complete) return "complete";
  const anyProgress = stage.steps.some(
    (step) =>
      stepStatus(stage.slug, step.slug, step, completed, toolData) !==
      "not-started",
  );
  return anyProgress ? "in-progress" : "not-started";
}

export function JourneyOverview({ stages }: { stages: JourneyStage[] }) {
  const { isDone, completed, hydrated, reset } = useProgress();
  const { toolData } = useToolData();

  // Shared computation so the journey overview and the dashboard agree.
  const prog = journeyProgress(stages, hydrated ? completed : {});
  const totalDone = prog.doneTasks;
  const overallPct = prog.pct;

  return (
    <div>
      <div className="card mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-ink-muted">Overall progress</p>
            <p className="text-2xl font-bold" suppressHydrationWarning>
              {overallPct}%
              <span className="ml-2 text-sm font-normal text-ink-muted">
                {totalDone} of {prog.totalTasks} tasks
              </span>
            </p>
          </div>
          {hydrated && totalDone > 0 ? (
            <button
              type="button"
              onClick={reset}
              className="text-sm font-medium text-ink-muted underline hover:text-ink"
            >
              Reset progress
            </button>
          ) : null}
        </div>
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${overallPct}%` }}
            suppressHydrationWarning
          />
        </div>
      </div>

      <ol className="space-y-4">
        {stages.map((stage) => {
          const keys = stageTaskKeys(stage);
          const done = hydrated ? keys.filter(isDone).length : 0;
          const complete = keys.length > 0 && done === keys.length;
          const state: StageState = hydrated
            ? stageState(stage, completed, toolData, complete)
            : "not-started";
          const stepCount = stage.steps.length;
          const statusLabel =
            state === "complete"
              ? "complete"
              : state === "in-progress"
                ? "in progress"
                : "not started";
          return (
            <li key={stage.slug}>
              <Link
                href={`/journey/${stage.slug}`}
                className="card flex items-center gap-4 transition hover:border-brand-300 hover:shadow-md"
                aria-label={`Stage ${stage.order}: ${stage.title} — ${statusLabel}`}
              >
                <span
                  className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl ${
                    state === "complete"
                      ? "bg-brand-600 text-white"
                      : state === "in-progress"
                        ? "bg-brand-100 text-brand-700 ring-2 ring-brand-300"
                        : "bg-brand-50"
                  }`}
                  aria-hidden
                >
                  {state === "complete" ? "✓" : state === "in-progress" ? "◐" : stage.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                      Stage {stage.order}
                    </span>
                    {stage.timeline ? (
                      <span className="text-xs text-ink-muted">· {stage.timeline}</span>
                    ) : null}
                    {state === "in-progress" ? (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        ◐ In progress
                      </span>
                    ) : state === "complete" ? (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        ✓ Complete
                      </span>
                    ) : null}
                  </div>
                  <h3 className="truncate text-lg font-semibold">{stage.title}</h3>
                  <p className="truncate text-sm text-ink-muted">{stage.tagline}</p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium text-ink" suppressHydrationWarning>
                    {done}/{keys.length}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {stepCount} step{stepCount === 1 ? "" : "s"}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
