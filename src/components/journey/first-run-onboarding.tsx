"use client";

import { useState } from "react";
import Link from "next/link";
import { useStageTool } from "@/hooks/use-stage-tool";
import {
  SITUATIONS,
  recommendForSituation,
} from "@/lib/journey/onboarding";

interface OnboardingState {
  dismissed: boolean;
  /** The situation id the buyer picked, if any. */
  situation: string | null;
}

const INITIAL: OnboardingState = { dismissed: false, situation: null };

/**
 * First-run intake (issue #144): "Where are you in the process?" A dismissible
 * card that asks a first-time visitor where they are, then points them at the
 * matching journey stage plus a couple of relevant tools. Pure mapping lives in
 * `lib/journey/onboarding.ts`; persistence is device-local via `useStageTool`.
 *
 * Self-hiding: renders nothing until hydrated (to avoid an SSR/client flash)
 * and nothing once `dismissed` is true. Picking a situation or hitting "skip"
 * both set `dismissed: true`, so the card never shows again on this device.
 * Never blocks the page.
 */
export function FirstRunOnboarding() {
  const { value, hydrated, save } = useStageTool<OnboardingState>(
    "onboarding",
    INITIAL,
  );
  // Local mirror of the live choice so the recommendation appears immediately,
  // even though we persist `dismissed: true` at the same time.
  const [picked, setPicked] = useState<string | null>(null);

  if (!hydrated || value.dismissed) return null;

  const current = picked ?? value.situation;

  function choose(id: string) {
    setPicked(id);
    // A choice counts as completing the intake: don't show it again.
    save({ dismissed: true, situation: id });
  }

  function skip() {
    save({ dismissed: true, situation: null });
  }

  const recommendation = current ? recommendForSituation(current) : null;

  return (
    <section
      className="card border-brand-200 bg-brand-50/40"
      aria-labelledby="onboarding-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            First, let&apos;s find your spot
          </p>
          <h2 id="onboarding-heading" className="mt-1 text-xl font-bold">
            Where are you in the process?
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Pick what fits best and we&apos;ll point you to the right stage. You
            can always explore the whole journey below.
          </p>
        </div>
        <button
          type="button"
          onClick={skip}
          className="text-sm font-medium text-ink-muted underline hover:text-ink"
        >
          Skip
        </button>
      </div>

      <fieldset className="mt-5">
        <legend className="sr-only">Your current situation</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {SITUATIONS.map((situation) => {
            const active = current === situation.id;
            return (
              <label
                key={situation.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-1 ${
                  active
                    ? "border-brand-500 bg-white font-medium text-ink"
                    : "border-slate-300 bg-white text-ink hover:border-brand-300"
                }`}
              >
                <input
                  type="radio"
                  name="onboarding-situation"
                  value={situation.id}
                  checked={active}
                  onChange={() => choose(situation.id)}
                  className="h-4 w-4 flex-shrink-0 accent-brand-600"
                />
                <span>{situation.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {recommendation ? (
        <div
          className="mt-5 rounded-lg border border-brand-200 bg-white p-4"
          aria-live="polite"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            Recommended starting point
          </p>
          <h3 className="mt-1 text-lg font-semibold">
            {recommendation.stageTitle}
          </h3>
          <p className="mt-1 text-sm text-ink-soft">
            {recommendation.rationale}
          </p>

          {recommendation.tools.length > 0 ? (
            <ul className="mt-3 space-y-1.5">
              {recommendation.tools.slice(0, 2).map((tool) => (
                <li key={tool.href}>
                  <Link
                    href={tool.href}
                    className="text-sm font-medium text-brand-700 hover:underline"
                  >
                    {tool.label}
                  </Link>
                  {tool.description ? (
                    <span className="text-sm text-ink-muted">
                      {" "}
                      — {tool.description}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-4">
            <Link
              href={`/journey/${recommendation.stageSlug}`}
              className="btn-primary"
            >
              Go to {recommendation.stageTitle} →
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
