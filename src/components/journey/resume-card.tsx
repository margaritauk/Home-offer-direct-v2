"use client";

import Link from "next/link";
import { useProgress } from "@/hooks/use-progress";
import { useLastPosition } from "@/hooks/use-last-position";
import { resumeTarget } from "@/lib/journey/navigation";

/**
 * "Resume where you left off → <label>" card (Item 2 part 3 / S0b) for the
 * landing page + dashboard. Hydration-gated to avoid an SSR flash and a
 * wrong-then-right label. Renders nothing when there's no resume target (first
 * run, or the whole journey is complete) so the caller's Start CTA / done-state
 * stands.
 *
 * Resume copy is pure wayfinding (no advice, no FHA surface); the label is an
 * app-controlled step/tool title, never user free-text.
 */
export function ResumeCard({ className = "" }: { className?: string }) {
  const { completed, hydrated: progressHydrated } = useProgress();
  const { position, hydrated: positionHydrated } = useLastPosition();

  if (!progressHydrated || !positionHydrated) return null;

  const target = resumeTarget(completed, position);
  // Only surface the card when there's an explicit place to return to.
  if (!target || !target.fromLastPosition) return null;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 ${className}`}
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Pick up where you left off
        </p>
        <p className="mt-0.5 truncate text-sm text-brand-900">
          Resume: <span className="font-semibold">{target.label}</span>
        </p>
      </div>
      <Link
        href={target.href}
        className="btn-primary inline-flex min-h-[44px] items-center justify-center"
        aria-label={`Resume where you left off: ${target.label}`}
      >
        Resume →
      </Link>
    </div>
  );
}
