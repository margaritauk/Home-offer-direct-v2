/**
 * Professional directory domain model.
 *
 * The directory connects a self-serve buyer with the pros they hand off to:
 * real estate attorneys, home inspectors, and title/escrow companies.
 *
 * DATA INTEGRITY: we never fabricate real businesses with invented contact
 * details. {@link ProProfile} entries are either explicitly marked samples
 * (`isSample: true`, illustrative only) or genuinely verified partner listings.
 * The trustworthy real handoff path is {@link FinderService} — official
 * "find a vetted pro" services (state bars, InterNACHI/ASHI, ALTA).
 */

export type ProRole = "attorney" | "inspector" | "title-escrow";

export interface ProProfile {
  id: string;
  name: string;
  role: ProRole;
  /** State codes served (uppercase, e.g. ["CA"]). Empty = nationwide. */
  states: string[];
  /** One- to two-sentence description of the service. */
  description: string;
  /** Optional city/region for display. */
  location?: string;
  /** Optional flat-fee/pricing note (e.g. "Flat $1,200 contract review"). */
  pricingNote?: string;
  website?: string;
  /**
   * Illustrative listing, NOT a real endorsement. The UI labels these clearly.
   * Defaults to treating missing as a real/verified listing.
   */
  isSample?: boolean;
}

/**
 * An official, authoritative service for finding a vetted pro of a given role.
 * These are real and linkable (the trustworthy handoff path).
 */
export interface FinderService {
  id: string;
  role: ProRole;
  name: string;
  description: string;
  website: string;
  /**
   * When true this is a per-state service whose link should be paired with the
   * buyer's state (e.g. "your state bar's lawyer referral service").
   */
  perState?: boolean;
}

export const proRoleLabels: Record<
  ProRole,
  { label: string; plural: string; icon: string; blurb: string }
> = {
  attorney: {
    label: "Real estate attorney",
    plural: "Real estate attorneys",
    icon: "⚖️",
    blurb:
      "Drafts or reviews your contract and protects your contingencies — the single best way to de-risk buying without an agent.",
  },
  inspector: {
    label: "Home inspector",
    plural: "Home inspectors",
    icon: "🔍",
    blurb:
      "Independently evaluates the home's condition so you can negotiate repairs or credits — or walk away.",
  },
  "title-escrow": {
    label: "Title / escrow company",
    plural: "Title & escrow companies",
    icon: "🏦",
    blurb:
      "Searches title, holds funds in escrow, and handles closing in non-attorney states.",
  },
};
