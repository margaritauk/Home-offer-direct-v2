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
      href: "/tools/needs",
      label: "Needs & criteria worksheet",
      description:
        "Capture must-haves, nice-to-haves, and deal-breakers early so your search stays disciplined.",
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
    {
      href: "/tools/needs",
      label: "Needs & criteria worksheet",
      description:
        "Sort your must-haves, nice-to-haves, and deal-breakers — then score tours against your own criteria.",
    },
    {
      href: "/tools/hoa-review",
      label: "HOA / condo document review",
      description:
        "Walk the HOA/condo resale packet for reserves, special assessments, rental caps, and financing red flags.",
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
      href: "/tools/financing",
      label: "Financing-milestone tracker",
      description:
        "Start tracking your loan process — application, appraisal, underwriting, clear-to-close — as soon as you're under contract.",
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
    {
      href: "/tools/hoa-review",
      label: "HOA / condo document review",
      description:
        "Review the HOA/condo resale packet for special assessments, reserves, and rental/insurance red flags.",
    },
  ],
  "appraisal-and-underwriting": [
    {
      href: "/tracker",
      label: "Deadline & Document Tracker",
      description: "Track appraisal and underwriting deadlines and documents.",
    },
    {
      href: "/tools/financing",
      label: "Financing-milestone tracker",
      description:
        "Track the loan process — application, appraisal, underwriting conditions, clear-to-close — so financing doesn't quietly blow up your deal.",
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

/** The first matching tool's display label for a `/tools/<id>` href, if any. */
export function toolLabelForHref(href: string): string | undefined {
  const target = href.replace(/\/+$/, "");
  for (const tools of Object.values(STAGE_TOOLS)) {
    const found = tools.find((t) => t.href.replace(/\/+$/, "") === target);
    if (found) return found.label;
  }
  return undefined;
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

/**
 * The journey anchor for a tool — the "back to your journey" + "next step" deep
 * links a {@link ToolJourneyFooter} renders so a tool never dead-ends.
 *
 * `nextHref`/`nextLabel` are present whenever there's a step after the owning
 * stage (or a "back to journey ✓" terminus on the final stage); they're omitted
 * only for the unmapped-tool degrade case (back-link to `/journey` only).
 */
export interface ToolJourneyAnchor {
  backHref: string;
  backLabel: string;
  nextHref: string;
  nextLabel: string;
}

/**
 * Resolve a tool's `href` (e.g. `/tools/tour-scorecard`) to its journey anchor:
 * the owning stage's first step (back) + the step after the owning stage (next).
 *
 * Order-resolution rule (pure, mirrors {@link toolsByStage}'s "first stage wins"
 * dedupe so a multi-stage tool resolves deterministically):
 *  1. Owning stage = the FIRST stage (in journey order) whose `STAGE_TOOLS` list
 *     contains the href.
 *  2. `backHref` = the owning stage's first step page; label names the stage.
 *  3. `nextHref` = the step AFTER the owning stage's LAST step, in
 *     `flattenedSteps()` order. If the owning stage is the final stage, "next"
 *     becomes "Back to journey ✓" → `/journey`.
 *  4. If the tool is in NO stage list, return `null` — the footer degrades to a
 *     single back-link to `/journey` (no dead-end, ever).
 *
 * Normalizes a trailing slash on `href` so `/tools/x` and `/tools/x/` match.
 */
export function journeyAnchorForTool(href: string): ToolJourneyAnchor | null {
  const target = href.replace(/\/+$/, "") || "/";
  const stages = getStages();

  const owningStage = stages.find((stage) =>
    stageToolsFor(stage.slug).some(
      (tool) => tool.href.replace(/\/+$/, "") === target,
    ),
  );
  if (!owningStage || owningStage.steps.length === 0) return null;

  const firstStep = owningStage.steps[0];
  const lastStep = owningStage.steps[owningStage.steps.length - 1];

  const flat = flattenedSteps();
  const lastIdx = flat.findIndex(
    (x) => x.stage.slug === owningStage.slug && x.step.slug === lastStep.slug,
  );
  const after = lastIdx >= 0 ? flat[lastIdx + 1] : undefined;

  return {
    backHref: `/journey/${owningStage.slug}/${firstStep.slug}`,
    backLabel: `Back to ${owningStage.title}`,
    nextHref: after
      ? `/journey/${after.stage.slug}/${after.step.slug}`
      : "/journey",
    nextLabel: after ? `Next: ${after.step.title}` : "Back to journey",
  };
}

/**
 * Tri-state step status (Item 2 / S0b). Derived, honest, never premature:
 *  - **complete**   = all non-optional tasks ticked ({@link isStepComplete}).
 *                     Tools NEVER flip a step to complete — only the checklist.
 *  - **in-progress**= some required tasks ticked, OR a `STAGE_TOOLS`-mapped tool
 *                     for this step's stage has saved NON-EMPTY data.
 *  - **not-started**= none of the above.
 */
export type StepStatus = "not-started" | "in-progress" | "complete";

/**
 * Per-tool "has the buyer entered real data?" predicates, keyed by the tool's
 * `useStageTool` toolId (Item 2 / S0b). Deliberately conservative so OPENING a
 * tool ≠ progress. A tool absent from this map falls back to the default
 * deep-not-equal-to-its-initial check in {@link toolHasData}.
 *
 * The value passed in is the parsed `hod:tool:<toolId>:v1` blob (or `undefined`
 * when the tool was never opened).
 */
export const TOOL_DATA_PREDICATES: Record<
  string,
  (value: unknown) => boolean
> = {
  // Scorecard: at least one home added.
  "tour-scorecard": (v) =>
    isRecord(v) && Array.isArray(v.homes) && v.homes.length > 0,
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/**
 * Whether a tool blob counts as "has data". Uses the tool's registered
 * predicate when present; otherwise a generic "non-empty" check: a non-null
 * object/array with at least one own value that isn't itself empty.
 */
export function toolHasData(toolId: string, value: unknown): boolean {
  if (value == null) return false;
  const predicate = TOOL_DATA_PREDICATES[toolId];
  if (predicate) return predicate(value);
  // Generic fallback: any array with entries, or any object with a truthy /
  // non-empty own value, counts as data.
  if (Array.isArray(value)) return value.length > 0;
  if (isRecord(value)) {
    return Object.values(value).some((v) => {
      if (v == null) return false;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === "string") return v.trim() !== "";
      if (typeof v === "number") return v !== 0;
      if (typeof v === "boolean") return v;
      if (isRecord(v)) return Object.keys(v).length > 0;
      return true;
    });
  }
  return Boolean(value);
}

/** The `useStageTool` toolId a `/tools/<id>` href maps to, else undefined. */
export function toolIdForHref(href: string): string | undefined {
  const m = href.replace(/\/+$/, "").match(/^\/tools\/([^/]+)$/);
  return m ? m[1] : undefined;
}

/**
 * Compute a step's {@link StepStatus} from the progress map + the per-tool data
 * map (toolId → parsed blob). PURE + unit-tested. `complete` strictly dominates;
 * tool data can only ever raise a step to `in-progress`, never `complete`.
 */
export function stepStatus(
  stageSlug: string,
  stepSlug: string,
  step: { tasks: { id: string; optional?: boolean }[] },
  progress: CompletedTasks,
  toolData: Record<string, unknown> = {},
): StepStatus {
  if (isStepComplete(stageSlug, stepSlug, step, progress)) return "complete";

  const anyTaskTicked = step.tasks.some(
    (t) => progress[taskKey(stageSlug, stepSlug, t.id)],
  );
  if (anyTaskTicked) return "in-progress";

  // A tool mapped to this stage that has non-empty data → in-progress.
  const stageTools = stageToolsFor(stageSlug);
  const toolInProgress = stageTools.some((tool) => {
    const toolId = toolIdForHref(tool.href);
    return toolId ? toolHasData(toolId, toolData[toolId]) : false;
  });
  return toolInProgress ? "in-progress" : "not-started";
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

/**
 * The buyer's last-visited position (Item 2 part 3 / S0b). Persisted as a
 * `useStageTool("__last-position")` blob — so it auto-syncs to signed-in users
 * for free (the sync layer enumerates every `hod:tool:*` key). Never stores user
 * free-text: `label` is an app-controlled step/tool title only (FHA/UPL).
 */
export interface LastPosition {
  kind: "step" | "tool";
  href: string;
  /** App-controlled human label for the resume button. */
  label: string;
  /** The owning step's stage/step slugs, for the "is it still incomplete?" check. */
  stageSlug?: string;
  stepSlug?: string;
  updatedAt: number;
}

export interface ResumeTarget {
  href: string;
  label: string;
  /** True when this came from the explicit last position (vs. computed next). */
  fromLastPosition: boolean;
}

/**
 * Resume precedence (Item 2 part 3 / S0b), PURE + unit-tested:
 *  1. An explicit last position whose target step is NOT yet complete → resume
 *     there (honor where they actually were). A `tool` position is always
 *     honored (tools never "complete").
 *  2. Otherwise (no position, or its step is already complete) → the computed
 *     next action ({@link nextStep}). Resuming into a finished step is a dead
 *     feeling; advancing is better.
 *
 * Returns `null` only when the whole journey is complete AND there's no live
 * tool position — the caller then shows its "all done" state instead.
 */
export function resumeTarget(
  progress: CompletedTasks,
  lastPosition: LastPosition | null | undefined,
): ResumeTarget | null {
  if (lastPosition) {
    if (lastPosition.kind === "tool") {
      return {
        href: lastPosition.href,
        label: lastPosition.label,
        fromLastPosition: true,
      };
    }
    // A step position: honor it only while its step is still incomplete.
    const { stageSlug, stepSlug } = lastPosition;
    if (stageSlug && stepSlug) {
      const found = flattenedSteps().find(
        (x) => x.stage.slug === stageSlug && x.step.slug === stepSlug,
      );
      if (
        found &&
        !isStepComplete(stageSlug, stepSlug, found.step, progress)
      ) {
        return {
          href: lastPosition.href,
          label: lastPosition.label,
          fromLastPosition: true,
        };
      }
    }
  }

  const next = nextStep(progress);
  if (next.isComplete) return null;
  return {
    href: next.href,
    label: next.stepTitle,
    fromLastPosition: false,
  };
}
