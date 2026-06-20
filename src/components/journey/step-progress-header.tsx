"use client";

import { useEffect } from "react";
import { useProgress } from "@/hooks/use-progress";
import { useToolData } from "@/hooks/use-tool-data";
import { useLastPosition } from "@/hooks/use-last-position";
import { useFocusOnRouteChange } from "@/hooks/use-focus-on-route-change";
import { stepStatus } from "@/lib/journey/navigation";

/**
 * "Where am I" progress header for a journey step page (UX continuity,
 * Item 2 / S0a). A client island (progress lives in localStorage) wrapping just
 * the orientation strip + the step H1, so the rest of the step page stays
 * server-rendered.
 *
 * It renders:
 *  - an `aria-live="polite"` strip: "Step N of {total} · Stage X of {stages}"
 *    plus a status chip (Not started / In progress / ✓ Complete) — icon + text,
 *    never color alone — and a thin overall progress bar.
 *  - the step eyebrow + H1 (focused on route change so keyboard/SR users land on
 *    the new step title — the shared focus-on-nav a11y pattern).
 *
 * Completion uses the honest existing rule ({@link isStepComplete}: all required
 * tasks ticked). "In progress" = some required tasks ticked but not all. The
 * status reads only structural facts (counts), never note content (FHA).
 */
export interface StepProgressHeaderProps {
  stageOrder: number;
  totalStages: number;
  stageTitle: string;
  stageSlug: string;
  stepSlug: string;
  stepTitle: string;
  stepSummary: string;
  /** 1-based index of this step in the flattened journey. */
  stepNumber: number;
  totalSteps: number;
  tasks: { id: string; optional?: boolean }[];
}

type Status = "not-started" | "in-progress" | "complete";

const STATUS_COPY: Record<Status, { icon: string; label: string }> = {
  "not-started": { icon: "○", label: "Not started" },
  "in-progress": { icon: "◐", label: "In progress" },
  complete: { icon: "✓", label: "Complete" },
};

export function StepProgressHeader(props: StepProgressHeaderProps) {
  const {
    stageOrder,
    totalStages,
    stageTitle,
    stageSlug,
    stepSlug,
    stepTitle,
    stepSummary,
    stepNumber,
    totalSteps,
    tasks,
  } = props;

  const { completed, hydrated } = useProgress();
  const { toolData, hydrated: toolsHydrated } = useToolData();
  const { record } = useLastPosition();
  const headingRef = useFocusOnRouteChange<HTMLHeadingElement>();

  // Persist this step as the buyer's last position (resume target). Label is an
  // app-controlled step title — never user free-text (FHA/UPL).
  useEffect(() => {
    record({
      kind: "step",
      href: `/journey/${stageSlug}/${stepSlug}`,
      label: stepTitle,
      stageSlug,
      stepSlug,
    });
    // record identity is stable; re-run only when the step changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageSlug, stepSlug]);

  let status: Status = "not-started";
  if (hydrated && toolsHydrated) {
    status = stepStatus(stageSlug, stepSlug, { tasks }, completed, toolData);
  }

  const pct = Math.round((stepNumber / totalSteps) * 100);
  const chip = STATUS_COPY[status];

  return (
    <div>
      <div
        aria-live="polite"
        className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm"
      >
        <p className="font-semibold uppercase tracking-wide text-brand-600">
          Stage {stageOrder}: {stageTitle}
        </p>
        <span className="text-ink-muted" aria-hidden>
          ·
        </span>
        <span className="text-ink-soft">
          Step {stepNumber} of {totalSteps} · Stage {stageOrder} of {totalStages}
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-ink-soft"
          aria-label={`Status: ${chip.label}`}
        >
          <span aria-hidden>{chip.icon}</span>
          {chip.label}
        </span>
      </div>

      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={stepNumber}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Journey progress: step ${stepNumber} of ${totalSteps}`}
      >
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <h1 ref={headingRef} tabIndex={-1} className="mt-4 text-3xl font-bold">
        {stepTitle}
      </h1>
      <p className="mt-3 text-lg text-ink-soft">{stepSummary}</p>
    </div>
  );
}
