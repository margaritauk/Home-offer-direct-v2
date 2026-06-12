/**
 * Seller-disclosure review worksheet (A5).
 *
 * A state-aware red-flag checklist an unrepresented buyer walks before/at
 * diligence. It keys off the per-state legal engine's `disclosureRegime` /
 * `disclosureFormName` to set expectations, then walks the common red-flag
 * categories (water/roof/foundation, systems, prior repairs, environmental
 * including the FEDERAL pre-1978 lead overlay, pests, boundary, HOA, and
 * deaths/stigma where the state's regime supports it). Each category gives
 * "what to look for" and ends with "have your attorney/inspector confirm".
 *
 * This is the PURE core — no React, no storage, no fetch. It reads a plain
 * {@link StateProfile} and returns a checklist; fully unit-testable.
 *
 * Compliance:
 *  - UPL: surfaces what to *ask* and look for. It never interprets legal
 *    sufficiency ("this is a defect, rescind"). Every category routes back to a
 *    licensed pro.
 *  - FHA: categories are about the *property's condition*, not the
 *    neighborhood's people. The "deaths/stigma" category is a neutral state-law
 *    disclosure fact and is only surfaced where the regime supports it (never
 *    volunteered where minimal-disclosure law would prohibit asking). The
 *    buyer's free-text "questions to ask" are screened in the UI.
 *
 * Sources (see docs/backlog/contributions/researcher.md, as of 2026):
 *  - Federal lead-based-paint disclosure applies to pre-1978 housing in ALL
 *    states regardless of regime (HomeLight — Mandated Disclosures by State).
 *  - Caveat-emptor / minimal-disclosure states (regime "limited") — silence
 *    is not a guarantee of no defects; inspect harder (Nolo; GK Middleton).
 */

import type { DisclosureRegime, StateProfile } from "@/lib/states/types";

export type DisclosureCategoryId =
  | "water"
  | "roof"
  | "foundation"
  | "systems"
  | "prior-repairs"
  | "environmental"
  | "lead-paint"
  | "pests"
  | "boundary"
  | "hoa"
  | "deaths-stigma";

export interface DisclosureCategory {
  id: DisclosureCategoryId;
  label: string;
  /** Plain-English "what to look for" — facts, never a directive. */
  whatToLookFor: string;
  /** The handoff line — always present (UPL boundary). */
  askYourPro: string;
}

/** Whose pro confirms — reused across categories for consistency. */
const ATTORNEY = "Have your attorney confirm anything contractual or legal.";
const INSPECTOR = "Flag this for your inspector to verify on site.";
const BOTH = "Have your inspector verify it on site and your attorney confirm the contract effect.";

/**
 * The universal red-flag categories present on essentially every disclosure
 * review, regardless of state regime. Deaths/stigma and the federal lead
 * overlay are added conditionally by {@link buildDisclosureChecklist}.
 */
const UNIVERSAL_CATEGORIES: readonly DisclosureCategory[] = [
  {
    id: "water",
    label: "Water intrusion & drainage",
    whatToLookFor:
      "Past flooding, leaks, sump-pump history, grading/drainage issues, water stains, or a high water table. Water is the most common hidden defect.",
    askYourPro: INSPECTOR,
  },
  {
    id: "roof",
    label: "Roof",
    whatToLookFor:
      "Age of the roof, prior leaks or repairs, and any active warranty. A roof near end-of-life is a near-term cost.",
    askYourPro: INSPECTOR,
  },
  {
    id: "foundation",
    label: "Foundation & structural",
    whatToLookFor:
      "Cracks, settling, prior structural repairs, or grading problems. Structural issues are expensive and can affect financing.",
    askYourPro: INSPECTOR,
  },
  {
    id: "systems",
    label: "Electrical, plumbing & HVAC",
    whatToLookFor:
      "Age and condition of the major systems, knob-and-tube or aluminum wiring, polybutylene/galvanized pipe, and HVAC service history.",
    askYourPro: INSPECTOR,
  },
  {
    id: "prior-repairs",
    label: "Prior repairs, permits & insurance claims",
    whatToLookFor:
      "Work done without permits, unfinished repairs, and any insurance claims (a CLUE report can reveal claim history). Unpermitted work can complicate resale.",
    askYourPro: BOTH,
  },
  {
    id: "environmental",
    label: "Environmental & flood",
    whatToLookFor:
      "Radon, asbestos, mold, underground tanks, and whether the home sits in a flood zone (which can require flood insurance). Newer state flood-disclosure laws are expanding.",
    askYourPro: INSPECTOR,
  },
  {
    id: "pests",
    label: "Pests & termites",
    whatToLookFor:
      "Active infestations, prior termite/wood-destroying-organism treatment, and any structural damage left behind.",
    askYourPro: INSPECTOR,
  },
  {
    id: "boundary",
    label: "Boundary & easements",
    whatToLookFor:
      "Encroachments, shared driveways, unrecorded easements, or fence-line disputes. A survey resolves most boundary questions.",
    askYourPro: ATTORNEY,
  },
  {
    id: "hoa",
    label: "HOA / condo association",
    whatToLookFor:
      "Whether an HOA governs the home, the dues, any special assessments or litigation, and rental/use restrictions. Ask for the resale packet.",
    askYourPro: ATTORNEY,
  },
] as const;

/** Federal pre-1978 lead-based-paint overlay — added on top of any regime. */
export const LEAD_PAINT_CATEGORY: DisclosureCategory = {
  id: "lead-paint",
  label: "Lead-based paint (federal — pre-1978 homes)",
  whatToLookFor:
    "For any home built before 1978, federal law requires the seller to give you the lead-paint disclosure and the EPA pamphlet, and a 10-day window to test. This applies in every state regardless of the state regime.",
  askYourPro:
    "This is a federal requirement — confirm you received the disclosure and pamphlet, and consider a lead test.",
};

/** Deaths / stigma — only surfaced where the state regime supports asking. */
export const DEATHS_STIGMA_CATEGORY: DisclosureCategory = {
  id: "deaths-stigma",
  label: "Deaths or stigma on the property (where your state addresses it)",
  whatToLookFor:
    "Some states require disclosing certain deaths or other stigmatizing events; others are silent or limit what may be asked. This is a neutral state-law question, not a judgment about anyone.",
  askYourPro:
    "Whether this must be disclosed varies by state — have your attorney confirm what your state requires.",
};

export interface DisclosureChecklist {
  regime: DisclosureRegime;
  /** The mandated/standard form name, when the state has one. */
  formName?: string;
  /** Plain-English expectation-setting intro for this state's regime. */
  intro: string;
  /**
   * True for minimal-disclosure / caveat-emptor-leaning states — the UI shows a
   * prominent "silence is not a guarantee" warning and to inspect harder.
   */
  caveatEmptorWarning: boolean;
  categories: DisclosureCategory[];
}

/** Intro copy per regime — sets honest expectations without legal conclusions. */
function introFor(profile: StateProfile): string {
  switch (profile.disclosureRegime) {
    case "statutory-form":
      return `${profile.name} uses a mandated seller-disclosure form${
        profile.disclosureFormName ? ` (the ${profile.disclosureFormName})` : ""
      }. Read every section — but a form being complete doesn't mean the home is problem-free. Use this checklist to turn the disclosure into questions.`;
    case "written-disclosure":
      return `${profile.name} requires sellers to disclose known defects in writing, though there's no single mandated form. Walk these categories and capture anything the disclosure leaves vague.`;
    case "limited":
      return `${profile.name} leans toward limited / "buyer-beware" disclosure — the seller may have little duty to volunteer defects. Treat silence as a reason to inspect harder, not as reassurance.`;
    default:
      return `Disclosure rules vary by state. Walk these categories and turn anything unclear into a question for your inspector or attorney.`;
  }
}

/**
 * Build the state-aware disclosure checklist.
 *
 * @param profile  The buyer's selected state profile (from the legal engine).
 * @param opts.builtPre1978  When true, the federal lead-paint overlay is added.
 *   Defaults to true (conservative — better to surface it than miss it).
 */
export function buildDisclosureChecklist(
  profile: StateProfile,
  opts: { builtPre1978?: boolean } = {},
): DisclosureChecklist {
  const builtPre1978 = opts.builtPre1978 ?? true;
  const categories: DisclosureCategory[] = [...UNIVERSAL_CATEGORIES];

  // Federal pre-1978 lead overlay — applies in ALL states regardless of regime.
  if (builtPre1978) categories.push(LEAD_PAINT_CATEGORY);

  // Deaths/stigma: only where the regime supports an affirmative-disclosure
  // expectation (statutory-form or written-disclosure). Minimal-disclosure
  // ("limited") states often restrict what may be asked, so we don't volunteer
  // it there.
  if (profile.disclosureRegime !== "limited") {
    categories.push(DEATHS_STIGMA_CATEGORY);
  }

  return {
    regime: profile.disclosureRegime,
    formName: profile.disclosureFormName,
    intro: introFor(profile),
    caveatEmptorWarning: profile.disclosureRegime === "limited",
    categories,
  };
}

/** Convenience: just the categories for a state (used by the boundary tests). */
export function categoriesForState(
  profile: StateProfile,
  opts: { builtPre1978?: boolean } = {},
): DisclosureCategory[] {
  return buildDisclosureChecklist(profile, opts).categories;
}
