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
      href: "/tools/go-solo",
      label: "Should I go solo?",
      description:
        "A balanced read on when self-representation is reasonable vs. when to bring in a flat-fee attorney — plus the post-NAR reality.",
    },
    {
      href: "/tools/budget",
      label: "Budget calculator",
      description:
        "Estimate your monthly payment (PITI) or how much house you can afford.",
    },
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
    {
      href: "/tools/market",
      label: "Market Conditions",
      description:
        "Read whether your area is a buyer's or seller's market from the underlying numbers.",
    },
    {
      href: "/tools/listing-alerts",
      label: "Listing alerts & access guide",
      description:
        "Set up saved-search alerts on the major portals and understand what an unrepresented buyer might miss.",
    },
    {
      href: "/tools/disclosure-review",
      label: "Seller-disclosure review",
      description:
        "Turn the seller's disclosure into the red-flag questions an agent would ask — tailored to your state.",
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
      href: "/tools/market",
      label: "Market Conditions",
      description:
        "Check buyer's vs. seller's market conditions before you size your offer.",
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
    {
      href: "/tools/offer-help",
      label: "Offer tactics & forms",
      description:
        "Learn advanced tactics, find your state's public form, and hand off to a flat-fee attorney.",
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
    {
      href: "/tools/counter-offer",
      label: "Counter-offer Tracker",
      description: "Track each round of price and term changes to see the live terms.",
    },
    {
      href: "/tools/offer-help",
      label: "Offer tactics & forms",
      description:
        "Weigh tactics like appraisal-gap coverage and route contract drafting to a flat-fee attorney.",
    },
  ],
  "earnest-money-and-open-escrow": [
    {
      href: "/tracker",
      label: "Deadline & Document Tracker",
      description: "Track contingency deadlines once you're under contract.",
    },
    {
      href: "/tools/escrow",
      label: "Wire-fraud Checklist & Escrow Tracker",
      description: "Verify wiring instructions by phone before you send funds.",
    },
  ],
  inspection: [
    {
      href: "/tracker",
      label: "Deadline & Document Tracker",
      description: "Stay inside your inspection contingency window.",
    },
    {
      href: "/tools/inspection",
      label: "Inspection Findings Logger",
      description: "Log findings by severity and cost to negotiate from facts.",
    },
    {
      href: "/tools/repair-request",
      label: "Repair-request Builder",
      description: "Turn findings into a neutral repair-or-credit request.",
    },
    {
      href: "/tools/disclosure-review",
      label: "Seller-disclosure review",
      description:
        "Walk the seller's disclosure for red flags and log questions for your inspector or attorney.",
    },
  ],
  "appraisal-and-underwriting": [
    {
      href: "/tracker",
      label: "Deadline & Document Tracker",
      description: "Track appraisal and underwriting deadlines and documents.",
    },
    {
      href: "/tools/clear-to-close",
      label: "Clear-to-close & Low-appraisal Calculator",
      description: "Track your path to clear-to-close and run the low-appraisal numbers.",
    },
  ],
  "title-and-escrow": [
    {
      href: "/tracker",
      label: "Deadline & Document Tracker",
      description: "Keep title and escrow tasks on schedule.",
    },
  ],
  "final-walkthrough": [
    {
      href: "/tools/final-walkthrough",
      label: "Final walkthrough",
      description:
        "Work the walkthrough checklist and verify your negotiated repairs were completed.",
    },
    {
      href: "/tools/repair-request",
      label: "Repair-request Builder",
      description: "Review the repairs you negotiated to confirm at the walkthrough.",
    },
  ],
  "closing-disclosure-review": [
    {
      href: "/tools/closing-disclosure",
      label: "Closing Disclosure check",
      description:
        "Compare your CD against your Loan Estimate and confirm the 3-business-day rule.",
    },
    {
      href: "/tracker",
      label: "Deadline & Document Tracker",
      description: "Confirm the 3-business-day Closing Disclosure window.",
    },
  ],
  "closing-settlement": [
    {
      href: "/tools/closing-day",
      label: "Closing day",
      description:
        "Closing-day checklist, cash-to-close estimate, and a wire-fraud re-verify reminder.",
    },
    {
      href: "/tracker",
      label: "Deadline & Document Tracker",
      description: "Track final documents and your closing date.",
    },
    {
      href: "/tools/move-in",
      label: "Move-in & post-purchase",
      description:
        "First-weeks checklist after closing: utilities, homestead, mortgage setup, and a document vault.",
    },
  ],
};

/** The tools mapped to a given stage slug (empty array when none). */
export function stageToolsFor(stageSlug: string): ToolLink[] {
  return STAGE_TOOLS[stageSlug] ?? [];
}

export interface StageToolGroup {
  stageSlug: string;
  stageTitle: string;
  tools: ToolLink[];
}

/**
 * The full tool catalog grouped by journey stage, in journey order, for the
 * `/tools` index (UX audit IA fix). Each tool is shown under its FIRST (most
 * relevant) stage only, so a tool that appears in several STAGE_TOOLS lists
 * isn't duplicated across the catalog. Stages with no remaining tools are
 * dropped.
 */
export function toolsByStage(): StageToolGroup[] {
  const seen = new Set<string>();
  const groups: StageToolGroup[] = [];
  for (const stage of getStages()) {
    const tools = stageToolsFor(stage.slug).filter((tool) => {
      if (seen.has(tool.href)) return false;
      seen.add(tool.href);
      return true;
    });
    if (tools.length > 0) {
      groups.push({
        stageSlug: stage.slug,
        stageTitle: stage.title,
        tools,
      });
    }
  }
  return groups;
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
