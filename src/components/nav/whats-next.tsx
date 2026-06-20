"use client";

import { useState } from "react";
import Link from "next/link";
import { useProgress } from "@/hooks/use-progress";
import { useLastPosition } from "@/hooks/use-last-position";
import { nextStep, resumeTarget } from "@/lib/journey/navigation";

/**
 * Compact "what's next" wayfinding strip (#88): "Stage X of 14 — Next: <step>"
 * with a one-click CTA to the next incomplete step. Derives from journey
 * progress (useProgress) via the pure `nextStep` helper, so it's accurate even
 * when steps are completed out of order. Dismissible and non-blocking; renders
 * nothing until progress has hydrated to avoid an SSR/client flash.
 */
export function WhatsNext() {
  const { completed, hydrated } = useProgress();
  const { position, hydrated: positionHydrated } = useLastPosition();
  const [dismissed, setDismissed] = useState(false);

  if (!hydrated || !positionHydrated || dismissed) return null;

  const info = nextStep(completed);

  // Lead with an explicit "Resume: <where>" when a persisted last position
  // exists and is still live; else fall back to the computed "What's next".
  const resume = resumeTarget(completed, position);
  if (resume && resume.fromLastPosition && !info.isComplete) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            Pick up where you left off · Stage {info.stageOrder} of{" "}
            {info.totalStages}
          </p>
          <p className="mt-0.5 truncate text-sm text-brand-900">
            Resume: <span className="font-semibold">{resume.label}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={resume.href} className="btn-primary">
            Resume →
          </Link>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-sm font-medium text-brand-700 hover:underline"
            aria-label="Dismiss"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  if (info.isComplete) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
        <p className="text-sm text-brand-900">
          🎉 You&apos;ve completed every step of the journey. Congratulations!
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-sm font-medium text-brand-700 hover:underline"
          aria-label="Dismiss"
        >
          Dismiss
        </button>
      </div>
    );
  }

  const lead = info.isStart ? "Start here" : "What's next";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          {lead} · Stage {info.stageOrder} of {info.totalStages}
        </p>
        <p className="mt-0.5 text-sm text-brand-900">
          Next: <span className="font-semibold">{info.stepTitle}</span>{" "}
          <span className="text-brand-700">— {info.stageTitle}</span>
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link href={info.href} className="btn-primary">
          {info.isStart ? "Start" : "Continue"} →
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-sm font-medium text-brand-700 hover:underline"
          aria-label="Dismiss"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
