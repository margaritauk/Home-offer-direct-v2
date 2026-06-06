"use client";

import Link from "next/link";
import { useProgress, taskKey } from "@/hooks/use-progress";
import type { JourneyStage } from "@/lib/journey/types";

function stageTaskKeys(stage: JourneyStage): string[] {
  return stage.steps.flatMap((step) =>
    step.tasks.map((t) => taskKey(stage.slug, step.slug, t.id)),
  );
}

export function JourneyOverview({ stages }: { stages: JourneyStage[] }) {
  const { isDone, hydrated, reset } = useProgress();

  const allKeys = stages.flatMap(stageTaskKeys);
  const totalDone = hydrated ? allKeys.filter(isDone).length : 0;
  const overallPct = allKeys.length
    ? Math.round((totalDone / allKeys.length) * 100)
    : 0;

  return (
    <div>
      <div className="card mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-ink-muted">Overall progress</p>
            <p className="text-2xl font-bold" suppressHydrationWarning>
              {overallPct}%
              <span className="ml-2 text-sm font-normal text-ink-muted">
                {totalDone} of {allKeys.length} tasks
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
          const stepCount = stage.steps.length;
          return (
            <li key={stage.slug}>
              <Link
                href={`/journey/${stage.slug}`}
                className="card flex items-center gap-4 transition hover:border-brand-300 hover:shadow-md"
              >
                <span
                  className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl ${
                    complete ? "bg-brand-600 text-white" : "bg-brand-50"
                  }`}
                  aria-hidden
                >
                  {complete ? "✓" : stage.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                      Stage {stage.order}
                    </span>
                    {stage.timeline ? (
                      <span className="text-xs text-ink-muted">· {stage.timeline}</span>
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
