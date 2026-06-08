"use client";

import { useState } from "react";
import Link from "next/link";
import { useProgress } from "@/hooks/use-progress";
import { nextStep } from "@/lib/journey/navigation";

/**
 * Compact "what's next" wayfinding strip (#88): "Stage X of 14 — Next: <step>"
 * with a one-click CTA to the next incomplete step. Derives from journey
 * progress (useProgress) via the pure `nextStep` helper, so it's accurate even
 * when steps are completed out of order. Dismissible and non-blocking; renders
 * nothing until progress has hydrated to avoid an SSR/client flash.
 */
export function WhatsNext() {
  const { completed, hydrated } = useProgress();
  const [dismissed, setDismissed] = useState(false);

  if (!hydrated || dismissed) return null;

  const info = nextStep(completed);

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
