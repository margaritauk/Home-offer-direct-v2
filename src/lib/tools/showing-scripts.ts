/**
 * Showing access reality + scripts + dual-agency caution (I1).
 *
 * Helps a solo buyer get a tour without accidentally signing away their
 * independence. Three pieces, all PURE (no React, no storage):
 *   1. {@link SHOWING_SCRIPTS} — copyable, Fair-Housing-safe scripts/fallbacks
 *      for common access scenarios (agent won't show, showing-service vs listing
 *      agent, "I have my own attorney").
 *   2. {@link dualAgencyCaution} — a state-aware caution that reads
 *      `StateProfile.dualAgency` (banned vs. permitted-with-consent vs.
 *      restricted) and cites the state.
 *   3. {@link TOUR_CHECKLIST_CRITERIA} + {@link toScorecardSeed} — a short
 *      in-person tour checklist that complements / can seed the existing Tour
 *      Scorecard rubric (shared `ScorecardCriterion` type).
 *
 * Compliance:
 *  - FHA: scripts deal only in property/transaction facts (no protected-class,
 *    no love-letter). The tour checklist is about the BUILDING, never who lives
 *    there. Any editable script field is screened in the UI.
 *  - UPL: scripts are wording, not legal advice. The dual-agency caution
 *    EXPLAINS the conflict; it does not advise whether to sign anything.
 *
 * Sources (docs/backlog/contributions/researcher.md, as of 2026): dual-agency
 * prohibition varies by state — drive off the state engine, not a hardcoded
 * list. Access fallbacks (open houses, showing services, "I have my own
 * attorney") per the market-research risk table.
 */

import type { ScorecardCriterion } from "@/lib/tools/tour-scorecard";
import type { DualAgencyStatus, StateProfile } from "@/lib/states/types";

export interface ShowingScript {
  id: string;
  /** Scenario label for the picker. */
  label: string;
  /** One-line description of when to use it. */
  description: string;
  /** Copyable body — neutral, no protected-class or urgency tells. */
  body: string;
}

export const SHOWING_SCRIPTS: readonly ShowingScript[] = [
  {
    id: "agent-wont-show",
    label: "Listing agent won't show to an unrepresented buyer",
    description:
      "A neutral ask that keeps your unrepresented status explicit and offers low-friction alternatives.",
    body: [
      "Hi — I'm an unrepresented buyer interested in this home. I understand you represent the seller; I'm not asking you to represent me.",
      "Could we arrange a showing at your convenience? If it's easier, I'm happy to come to an open house or use a showing service instead. I'm pre-approved and can share proof of funds.",
    ].join("\n\n"),
  },
  {
    id: "showing-service",
    label: "Request a showing service instead of the listing agent",
    description:
      "When you'd rather a neutral third party open the door than the seller's agent.",
    body: [
      "Hi — I'd like to tour this home. Rather than have the listing agent show it, is there a showing service or lockbox-access option you can set up?",
      "I'm an unrepresented buyer and not seeking representation; I just need access to view the property. I'm pre-approved.",
    ].join("\n\n"),
  },
  {
    id: "own-attorney",
    label: '"I\'m representing myself and have my own attorney"',
    description:
      "Preserves your independence and signals you're covered on the legal side — without seeking representation.",
    body: [
      "Thanks for the offer to help. I'm representing myself on this purchase and have my own attorney for the contract, so I'm not seeking representation or a buyer-agency arrangement.",
      "I'm glad to view the home and put a clean offer together — could we schedule a time?",
    ].join("\n\n"),
  },
  {
    id: "virtual-tour",
    label: "Request a video / virtual showing (remote buyer)",
    description:
      "For buying from out of area — ask for a live video walkthrough before traveling.",
    body: [
      "Hi — I'm an unrepresented buyer relocating to the area and can't tour in person yet. Would a live video walkthrough (FaceTime/Zoom) be possible, or is there a recorded virtual tour available?",
      "I'm pre-approved and serious; a virtual showing would help me decide whether to travel for an in-person visit.",
    ].join("\n\n"),
  },
] as const;

export function getShowingScript(id: string): ShowingScript | undefined {
  return SHOWING_SCRIPTS.find((s) => s.id === id);
}

export interface DualAgencyCaution {
  status: DualAgencyStatus;
  /** Short label, e.g. "Dual agency banned". */
  label: string;
  /** Plain-English explanation tailored to the status, naming the state. */
  explanation: string;
  /** The state-specific note from the legal engine, when present. */
  stateNote?: string;
  /** Always present — explains the conflict without advising the choice (UPL). */
  conflictNote: string;
}

const STATUS_LABEL: Record<DualAgencyStatus, string> = {
  permitted: "Dual agency permitted (with written consent)",
  banned: "Dual agency banned",
  restricted: "Dual agency restricted",
};

const CONFLICT_NOTE =
  "Either way, the listing agent's duty runs to the seller. If they offer to \"help you too,\" understand what you'd be agreeing to before you sign anything — but whether to sign is your call (and your attorney's), not ours.";

/**
 * Build a state-aware dual-agency caution from a {@link StateProfile}. Reads
 * `dualAgency` + `dualAgencyNote`; the explanation is factual and routes the
 * representation decision back to the buyer/attorney (UPL).
 */
export function dualAgencyCaution(profile: StateProfile): DualAgencyCaution {
  const status = profile.dualAgency;
  let explanation: string;

  switch (status) {
    case "banned":
      explanation = `In ${profile.name}, one agent cannot represent both the buyer and the seller in the same deal. The listing agent represents the seller only — they cannot also be your agent.`;
      break;
    case "restricted":
      explanation = `${profile.name} allows dual agency only in a limited form (for example designated or transaction brokerage). Even then, the listing agent's loyalty stays with the seller.`;
      break;
    case "permitted":
    default:
      explanation = `${profile.name} permits dual agency with the informed, written consent of both sides — meaning a listing agent could try to represent you too. That's a conflict of interest: the same person can't fully advocate for both a higher and a lower price.`;
      break;
  }

  return {
    status,
    label: STATUS_LABEL[status],
    explanation,
    stateNote: profile.dualAgencyNote,
    conflictNote: CONFLICT_NOTE,
  };
}

/**
 * The in-person tour checklist, expressed as Tour-Scorecard criteria so it can
 * SEED that tool (shared {@link ScorecardCriterion} type). Strictly about the
 * building's condition — never who lives there or neighborhood demographics.
 */
export const TOUR_CHECKLIST_CRITERIA: readonly ScorecardCriterion[] = [
  {
    id: "water-signs",
    label: "Signs of water / moisture",
    hint: "Ceiling/wall stains, musty smell, basement dampness, grading toward the house",
    weight: 3,
  },
  {
    id: "foundation-signs",
    label: "Foundation & structure",
    hint: "Cracks, sloping floors, sticking doors/windows",
    weight: 3,
  },
  {
    id: "systems-age",
    label: "Major systems",
    hint: "Age/condition of roof, HVAC, water heater, electrical panel",
    weight: 3,
  },
  {
    id: "windows-doors",
    label: "Windows & doors",
    hint: "Seals, drafts, operation, signs of rot",
    weight: 1,
  },
  {
    id: "smells-noise",
    label: "Smells & noise",
    hint: "Odors, traffic/road noise, anything that won't show in photos",
    weight: 1,
  },
  {
    id: "photos",
    label: "Photos to take",
    hint: "Utility/electrical panel, any defect, room condition, exterior grading",
    weight: 1,
  },
] as const;

/**
 * Produce a Tour-Scorecard seed: a list of criteria (ids + labels + weights)
 * the buyer can carry into the scorecard. Returns the shared criterion shape so
 * the scorecard can consume it directly.
 */
export function toScorecardSeed(): ScorecardCriterion[] {
  return TOUR_CHECKLIST_CRITERIA.map((c) => ({ ...c }));
}
