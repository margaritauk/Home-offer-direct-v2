/**
 * First-run onboarding intake (issue #144): "Where are you in the process?"
 *
 * Maps a buyer's self-described starting situation to the right journey stage
 * plus the tools most useful there. This is a pure, defensive mapping layer —
 * no React/DOM — so it's fully unit-testable. The UI (FirstRunOnboarding) reads
 * `SITUATIONS` for the choices and calls `recommendForSituation` to render a
 * recommendation. Every situation maps to a real stage slug that exists in
 * `getStages()`; an unknown id falls back to the first stage so the intake is
 * never a dead end.
 */

import { getStages } from "./index";
import { stageToolsFor, type ToolLink } from "./navigation";

export interface Situation {
  id: string;
  /** The choice the buyer picks ("I'm just starting to think about it"). */
  label: string;
  /** Real journey stage slug this situation maps to (verified in tests). */
  stageSlug: string;
  /** One-line, plain-English reason this is the right place to pick up. */
  rationale: string;
}

/**
 * The buyer's possible starting points, in journey order. Each maps to a real
 * stage slug from `data.ts`. Keep the labels honest and plain-English.
 */
export const SITUATIONS: Situation[] = [
  {
    id: "just-starting",
    label: "I'm just starting to think about buying",
    stageSlug: "get-ready",
    rationale:
      "Start by knowing your numbers — budget, credit, and savings — before you fall for a house.",
  },
  {
    id: "saving-preapproval",
    label: "I'm saving up and want to get pre-approved",
    stageSlug: "get-pre-approved",
    rationale:
      "A pre-approval letter turns your budget into an offer sellers take seriously.",
  },
  {
    id: "shopping",
    label: "I'm browsing listings and learning the market",
    stageSlug: "search",
    rationale:
      "Set your criteria and pull comps so you know a fair price when you see one.",
  },
  {
    id: "touring",
    label: "I'm touring homes in person",
    stageSlug: "tour-and-evaluate",
    rationale:
      "Schedule showings yourself and judge each home's condition against your comps.",
  },
  {
    id: "making-an-offer",
    label: "I've found a home and want to make an offer",
    stageSlug: "make-an-offer",
    rationale:
      "Draft a written offer with the right price and contingencies — and claim the commission savings.",
  },
  {
    id: "under-contract",
    label: "I'm under contract (offer accepted)",
    stageSlug: "earnest-money-and-open-escrow",
    rationale:
      "Deposit your earnest money safely and open escrow — watch for wire fraud.",
  },
  {
    id: "closing-soon",
    label: "I'm closing soon",
    stageSlug: "closing-disclosure-review",
    rationale:
      "Use your 3-business-day window to check the Closing Disclosure line by line.",
  },
];

export interface SituationRecommendation {
  stageSlug: string;
  stageTitle: string;
  rationale: string;
  tools: ToolLink[];
}

/**
 * Resolve a situation id to a stage recommendation. Pure and defensive:
 *  - the stage title is read from the canonical `getStages()` data,
 *  - tools come from `STAGE_TOOLS` (empty array when a stage has none),
 *  - an unknown id (or a situation whose slug somehow isn't a real stage)
 *    falls back to the first stage so the caller always gets a valid target.
 */
export function recommendForSituation(
  situationId: string,
): SituationRecommendation {
  const stages = getStages();
  const firstStage = stages[0];

  const situation = SITUATIONS.find((s) => s.id === situationId);
  const matched = situation
    ? stages.find((stage) => stage.slug === situation.stageSlug)
    : undefined;

  const stage = matched ?? firstStage;
  const rationale =
    matched && situation
      ? situation.rationale
      : "Not sure where to begin? Start at the beginning and work forward at your own pace.";

  return {
    stageSlug: stage.slug,
    stageTitle: stage.title,
    rationale,
    tools: stageToolsFor(stage.slug),
  };
}
