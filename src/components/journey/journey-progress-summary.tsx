"use client";

import Link from "next/link";
import { getStages } from "@/lib/journey";
import { useProgress } from "@/hooks/use-progress";
import { journeyProgress } from "@/lib/journey/progress";

/**
 * Compact, shared "overall journey progress" card (issue #145). Uses the same
 * pure {@link journeyProgress} computation as the journey overview, so the
 * dashboard and the journey agree on the number. Renders a percent + bar +
 * "X of N steps complete" and links into the journey.
 */
export function JourneyProgressSummary({ className = "" }: { className?: string }) {
  const { completed, hydrated } = useProgress();
  const prog = journeyProgress(getStages(), hydrated ? completed : {});

  return (
    <div className={`card ${className}`.trim()}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink-muted">Your journey</p>
          <p className="text-2xl font-bold" suppressHydrationWarning>
            {prog.pct}%
            <span className="ml-2 text-sm font-normal text-ink-muted">
              {prog.stagesComplete} of {prog.stages.length} stages ·{" "}
              {prog.doneTasks} of {prog.totalTasks} tasks
            </span>
          </p>
        </div>
        <Link
          href="/journey"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          Open the journey →
        </Link>
      </div>
      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${prog.pct}%` }}
          suppressHydrationWarning
        />
      </div>
    </div>
  );
}
