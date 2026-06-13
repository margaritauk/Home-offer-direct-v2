/**
 * HOA / condo document-review checklist (A6).
 *
 * A red-flag checklist an unrepresented buyer walks against the HOA/condo
 * "resale packet" (a.k.a. resale certificate + governing documents). It covers
 * the categories a buyer's agent reads the packet for — reserves/budget, special
 * assessments, CC&Rs/rules, litigation, rental caps / owner-occupancy, master +
 * owner insurance, dues & history — plus the structural notes a buyer needs:
 * condo vs HOA vs co-op, warrantable vs non-warrantable (a FINANCING gotcha), and
 * that a state may grant a statutory review/rescission window to CANCEL.
 *
 * This is the PURE core — no React, no storage, no fetch. Structurally a sibling
 * of `disclosure-review.ts`; fully unit-testable.
 *
 * Compliance:
 *  - UPL: surfaces what to *look for* and *ask*. It never interprets the legal
 *    effect of the documents. Every contractual category routes to "have your
 *    attorney review the governing documents." Warrantability is framed as a
 *    question to confirm with your lender, never a directive.
 *  - FHA: rental-cap / owner-occupancy notes are phrased NEUTRALLY (a financing
 *    and use fact), never as investment advice and never tied to who lives there.
 *    The buyer's free-text "questions to ask" are screened in the UI.
 *
 * Sources (see docs/backlog/contributions/researcher.md, as of 2026):
 *  - Standard resale-packet contents — reserves/budget, special assessments,
 *    CC&Rs/bylaws/rules, pending litigation, insurance, rental/leasing rules
 *    (FirstService; ClarkSimsonMiller; Rexera — HOA resale package).
 *  - Many states grant a statutory HOA-document review / cancellation period;
 *    contents and delivery vary by state (researcher brief A6).
 *  - Warrantable vs non-warrantable condo affects conventional/FHA/VA financing
 *    (high investor ratio, litigation, low owner-occupancy can block loans).
 */

export type HoaCategoryId =
  | "budget-reserves"
  | "special-assessments"
  | "ccrs-rules"
  | "litigation"
  | "rental-caps"
  | "insurance"
  | "dues-history"
  | "warrantability";

export interface HoaCategory {
  id: HoaCategoryId;
  label: string;
  /** Plain-English "what to look for" — facts, never a directive. */
  whatToLookFor: string;
  /** "Why it matters" framed as a trade-off, never a recommendation. */
  whyItMatters: string;
  /** The handoff line — always present (UPL boundary). */
  askYourPro: string;
}

/** Whose pro confirms — reused across categories for consistency. */
const ATTORNEY = "Have your attorney review the governing documents.";
const LENDER = "Confirm the financing impact with your lender.";

/**
 * The resale-packet red-flag categories. Present for any condo/HOA home; the UI
 * shows the whole set once the buyer indicates the home is governed by an
 * association.
 */
const HOA_CATEGORIES: readonly HoaCategory[] = [
  {
    id: "budget-reserves",
    label: "Operating budget & reserve study",
    whatToLookFor:
      "The current operating budget, the reserve study, and what percent of reserves are funded. Look at whether dues cover ongoing costs and whether big-ticket items (roof, elevators, siding) are funded.",
    whyItMatters:
      "Low reserves can mean future special assessments or dues increases land on you — a well-funded reserve study is a cushion.",
    askYourPro: ATTORNEY,
  },
  {
    id: "special-assessments",
    label: "Special assessments (pending or recent)",
    whatToLookFor:
      "Any special assessment that's pending, approved, or recently levied, plus board minutes hinting at upcoming major repairs that aren't yet funded.",
    whyItMatters:
      "A pending special assessment is a real, often large, cost — whether the seller or you pays it is a negotiable contract point.",
    askYourPro: ATTORNEY,
  },
  {
    id: "ccrs-rules",
    label: "CC&Rs, bylaws & rules",
    whatToLookFor:
      "The declaration/CC&Rs, bylaws, and house rules — pet limits, parking, architectural-change approval, short-term-rental and use restrictions, and any fines history.",
    whyItMatters:
      "These govern what you can and can't do with the home; a rule you can't live with is far cheaper to find now than after closing.",
    askYourPro: ATTORNEY,
  },
  {
    id: "litigation",
    label: "Litigation involving the association",
    whatToLookFor:
      "Whether the HOA is a party to any active or threatened lawsuits (construction defects, insurance, owner disputes) and any related disclosures.",
    whyItMatters:
      "Active litigation can drain reserves, signal a defect problem, and — for condos — can make the project non-warrantable and harder to finance.",
    askYourPro: ATTORNEY,
  },
  {
    id: "rental-caps",
    label: "Rental caps & owner-occupancy ratio",
    whatToLookFor:
      "Any cap on the number or share of units that may be rented, an existing waitlist, minimum lease terms, and the current owner-occupancy ratio.",
    whyItMatters:
      "Rental caps and the owner-occupancy ratio are neutral facts that can affect both your plans and the building's financeability. This is information to confirm, not investment advice.",
    askYourPro: LENDER,
  },
  {
    id: "insurance",
    label: "Insurance — master policy + what you must carry",
    whatToLookFor:
      "The association's master policy (what it covers — typically the building/common areas) and the gap an HO-6 / owner policy fills (interior, contents, loss assessment).",
    whyItMatters:
      "A coverage gap between the master policy and your own can leave you exposed; lenders also check the master policy's adequacy.",
    askYourPro: LENDER,
  },
  {
    id: "dues-history",
    label: "Dues & dues history",
    whatToLookFor:
      "Current dues, the recent history of increases, what dues include, and whether the seller is current (any past-due balance can become your problem at closing).",
    whyItMatters:
      "A steep dues-increase trend or a thin budget tells you the real carrying cost — and unpaid seller dues are a closing item to resolve.",
    askYourPro: ATTORNEY,
  },
  {
    id: "warrantability",
    label: "Condo warrantability (a financing question)",
    whatToLookFor:
      "For condos, whether the project is warrantable for your loan type. High investor concentration, ongoing litigation, low owner-occupancy, or a single owner holding many units can make a project non-warrantable; FHA/VA maintain their own condo-approval lists.",
    whyItMatters:
      "A non-warrantable condo can limit you to specialized (often pricier) financing or block a conventional/FHA/VA loan entirely — confirm before you're deep into the deal.",
    askYourPro: LENDER,
  },
] as const;

/** A neutral note on the three ownership structures — co-op differs materially. */
export interface OwnershipNote {
  id: "condo" | "hoa" | "co-op";
  label: string;
  detail: string;
}

export const OWNERSHIP_NOTES: readonly OwnershipNote[] = [
  {
    id: "hoa",
    label: "HOA (single-family / townhome)",
    detail:
      "You own your home and lot fee-simple; the HOA governs common areas and enforces the CC&Rs. The packet centers on dues, rules, and assessments.",
  },
  {
    id: "condo",
    label: "Condominium",
    detail:
      "You own your unit plus a share of common elements. Add master insurance and warrantability to your review — they drive financing.",
  },
  {
    id: "co-op",
    label: "Co-op (cooperative)",
    detail:
      "You buy shares in a corporation and get a proprietary lease — not fee-simple title. Boards often must approve buyers, and financing works differently. Have your attorney explain the structure.",
  },
] as const;

export interface HoaChecklist {
  /** True once the buyer indicates the home is governed by a condo/HOA/co-op. */
  applies: boolean;
  categories: HoaCategory[];
  ownershipNotes: readonly OwnershipNote[];
  /** Reminder that a statutory review/cancellation window may exist. */
  reviewWindowNote: string;
}

const REVIEW_WINDOW_NOTE =
  "Many states give buyers a statutory window after receiving the HOA/condo documents to review them and cancel the purchase. The length and trigger vary by state — don't let it lapse; have your attorney confirm your state's rule.";

/**
 * Build the HOA/condo review checklist.
 *
 * @param opts.isHoa  Whether the home is governed by a condo/HOA/co-op. When
 *   false, the checklist is "empty-but-explained" (no categories), so a buyer of
 *   a non-association home isn't shown an irrelevant wall of prompts.
 */
export function buildHoaChecklist(opts: { isHoa?: boolean } = {}): HoaChecklist {
  const applies = opts.isHoa ?? false;
  return {
    applies,
    categories: applies ? [...HOA_CATEGORIES] : [],
    ownershipNotes: OWNERSHIP_NOTES,
    reviewWindowNote: REVIEW_WINDOW_NOTE,
  };
}

/** Convenience: just the categories (used by the boundary tests). */
export function categoriesForHoa(opts: { isHoa?: boolean } = {}): HoaCategory[] {
  return buildHoaChecklist(opts).categories;
}
