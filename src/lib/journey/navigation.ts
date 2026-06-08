/**
 * Navigation helpers for the journey-centric IA (epic #83).
 *
 * These are pure functions over the canonical journey data + a progress map, so
 * they're fully unit-testable and have no React/DOM dependencies. They power:
 *  - the in-journey "Tools for this step" block (#86, `stageToolsFor`)
 *  - the "what's next" wayfinding strip (#88, `nextStep`)
 *
 * Journey content (`data.ts`) is intentionally left untouched — the per-stage
 * tool mapping lives here as a separate, easy-to-extend layer keyed on stage
 * slug, so future tools (#64/#65/#66, #51) plug in without editing content.
 */

import { flattenedSteps, getStages } from "./index";
import type { CompletedTasks } from "@/hooks/use-progress";
import { taskKey } from "@/hooks/use-progress";

export interface ToolLink {
  href: string;
  label: string;
  /** Short note on why this tool helps at this stage. */
  description?: string;
}

/**
 * Maps a journey stage slug to the cross-cutting tools most relevant there.
 * This is the single extension point for in-context tools: adding a tool to a
 * stage requires no top-nav change. Per-stage interactive tools (#64/65/66) and
 * the budget wizard (#51) attach here as they ship.
 */
export const STAGE_TOOLS: Record<string, ToolLink[]> = {
  "get-ready": [
    {
      href: "/tools/savings-calculator",
      label: "Savings Calculator",
      description: "Estimate your commission savings and cash to close.",
    },
    {
      href: "/tools/get-ready",
      label: "Credit & Savings Tracker",
      description: "Work the credit-readiness checklist and track your savings goal.",
    },
  ],
  "get-pre-approved": [
    {
      href: "/tools/savings-calculator",
      label: "Savings Calculator",
      description: "Model your all-in numbers before you shop lenders.",
    },
    {
      href: "/tools/lender-compare",
      label: "Lender Comparison",
      description: "Compare your own Loan Estimates by total cost, not just rate.",
    },
  ],
  search: [
    {
      href: "/listings",
      label: "Search Homes",
      description: "Browse listings and start a shortlist.",
    },
    {
      href: "/tools/compare",
      label: "Compare Homes",
      description: "Line up 2–4 homes side by side on the facts that matter.",
    },
    {
      href: "/tools/comps",
      label: "Comps Worksheet",
      description: "Estimate a fair-value range from comparable sales.",
    },
  ],
  "tour-and-evaluate": [
    {
      href: "/showings",
      label: "Showings Tracker",
      description: "Schedule tours and keep notes on each home.",
    },
    {
      href: "/tools/tour-scorecard",
      label: "Tour Scorecard",
      description: "Score each home on a consistent rubric and rank them.",
    },
    {
      href: "/tools/compare",
      label: "Compare Homes",
      description: "Compare your toured homes side by side, including tour scores.",
    },
  ],
  "make-an-offer": [
    {
      href: "/tools/offer-builder",
      label: "Offer Builder",
      description: "Assemble your price, contingencies, and deadlines.",
    },
    {
      href: "/tools/savings-calculator",
      label: "Savings Calculator",
      description: "Size the commission savings to write into your offer.",
    },
    {
      href: "/tools/comps",
      label: "Comps Worksheet",
      description: "Ground your offer price in a comps-based fair-value range.",
    },
  ],
  "negotiate-and-go-under-contract": [
    {
      href: "/offer-status",
      label: "Offer Status",
      description: "Track your offer from draft through accepted.",
    },
    {
      href: "/tools/offer-builder",
      label: "Offer Builder",
      description: "Revise terms as you trade counteroffers.",
    },
  ],
  "earnest-money-and-open-escrow": [
    {
      href: "/tracker",
      label: "Deadline & Document Tracker",
      description: "Track contingency deadlines once you're under contract.",
    },
  ],
  inspection: [
    {
      href: "/tracker",
      label: "Deadline & Document Tracker",
      description: "Stay inside your inspection contingency window.",
    },
  ],
  "appraisal-and-underwriting": [
    {
      href: "/tracker",
      label: "Deadline & Document Tracker",
      description: "Track appraisal and underwriting deadlines and documents.",
    },
  ],
  "title-and-escrow": [
    {
      href: "/tracker",
      label: "Deadline & Document Tracker",
      description: "Keep title and escrow tasks on schedule.",
    },
  ],
  "closing-disclosure-review": [
    {
      href: "/tracker",
      label: "Deadline & Document Tracker",
      description: "Confirm the 3-business-day Closing Disclosure window.",
    },
  ],
  "closing-settlement": [
    {
      href: "/tracker",
      label: "Deadline & Document Tracker",
      description: "Track final documents and your closing date.",
    },
  ],
};

/** The tools mapped to a given stage slug (empty array when none). */
export function stageToolsFor(stageSlug: string): ToolLink[] {
  return STAGE_TOOLS[stageSlug] ?? [];
}

export interface NextStepInfo {
  /** 1-based index of the stage the next step belongs to. */
  stageOrder: number;
  /** Total number of stages (for "Stage X of N"). */
  totalStages: number;
  stageSlug: string;
  stageTitle: string;
  stepSlug: string;
  stepTitle: string;
  /** Deep link to the next step page. */
  href: string;
  /** True when there's no progress yet (the very first step). */
  isStart: boolean;
  /** True when every step is complete — the journey is done. */
  isComplete: boolean;
}

/**
 * Whether a step counts as "done": all of its non-optional tasks are completed.
 * A step with no required tasks is considered done once any progress exists for
 * it, but in practice every step has required tasks.
 */
export function isStepComplete(
  stageSlug: string,
  stepSlug: string,
  step: { tasks: { id: string; optional?: boolean }[] },
  progress: CompletedTasks,
): boolean {
  const required = step.tasks.filter((t) => !t.optional);
  if (required.length === 0) return false;
  return required.every((t) => progress[taskKey(stageSlug, stepSlug, t.id)]);
}

/**
 * Derive the next step the buyer should work, from their progress map. The next
 * step is the FIRST step (in journey order) that is not yet complete — this is
 * correct even when steps are completed out of order, since we always surface
 * the earliest unfinished step.
 *
 * With no progress this returns the very first step (a sensible "Start" state).
 * When every step is complete it returns the last step flagged `isComplete`.
 */
export function nextStep(progress: CompletedTasks): NextStepInfo {
  const flat = flattenedSteps();
  const totalStages = getStages().length;
  const hasProgress = Object.values(progress).some(Boolean);

  const firstIncomplete = flat.find(
    ({ stage, step }) => !isStepComplete(stage.slug, step.slug, step, progress),
  );

  if (!firstIncomplete) {
    // Everything is done — point at the final step.
    const last = flat[flat.length - 1];
    return {
      stageOrder: last.stage.order,
      totalStages,
      stageSlug: last.stage.slug,
      stageTitle: last.stage.title,
      stepSlug: last.step.slug,
      stepTitle: last.step.title,
      href: `/journey/${last.stage.slug}/${last.step.slug}`,
      isStart: false,
      isComplete: true,
    };
  }

  const { stage, step } = firstIncomplete;
  return {
    stageOrder: stage.order,
    totalStages,
    stageSlug: stage.slug,
    stageTitle: stage.title,
    stepSlug: step.slug,
    stepTitle: step.title,
    href: `/journey/${stage.slug}/${step.slug}`,
    isStart: !hasProgress,
    isComplete: false,
  };
}
