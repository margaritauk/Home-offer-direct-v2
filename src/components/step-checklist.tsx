"use client";

import { useProgress, taskKey } from "@/hooks/use-progress";
import type { JourneyTask } from "@/lib/journey/types";

export function StepChecklist({
  stageSlug,
  stepSlug,
  tasks,
}: {
  stageSlug: string;
  stepSlug: string;
  tasks: JourneyTask[];
}) {
  const { isDone, toggleTask, hydrated } = useProgress();

  const doneCount = tasks.filter((t) =>
    isDone(taskKey(stageSlug, stepSlug, t.id)),
  ).length;

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Your checklist</h3>
        <span
          className="text-sm font-medium text-ink-muted"
          aria-live="polite"
          suppressHydrationWarning
        >
          {hydrated ? `${doneCount}/${tasks.length} done` : `0/${tasks.length}`}
        </span>
      </div>
      <ul className="space-y-3">
        {tasks.map((task) => {
          const key = taskKey(stageSlug, stepSlug, task.id);
          const checked = hydrated && isDone(key);
          return (
            <li key={task.id}>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 flex-shrink-0 rounded border-slate-300 accent-brand-600"
                  checked={checked}
                  onChange={() => toggleTask(key)}
                  suppressHydrationWarning
                />
                <span>
                  <span
                    className={`font-medium ${checked ? "text-ink-muted line-through" : "text-ink"}`}
                  >
                    {task.label}
                    {task.optional ? (
                      <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-ink-muted">
                        optional
                      </span>
                    ) : null}
                  </span>
                  {task.detail ? (
                    <span className="mt-0.5 block text-sm text-ink-muted">
                      {task.detail}
                    </span>
                  ) : null}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
