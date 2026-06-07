/**
 * ⚠️ LEGAL-REVIEW GATE (#76) ⚠️
 *
 * ALL user-facing wording about agency representation and financial-data consent
 * is centralized HERE so counsel can replace it in one place. Until legal signs
 * off, every screen that renders this copy MUST show the DRAFT banner
 * (`LEGAL_DRAFT_BANNER`). Do not present this copy as binding.
 *
 * When counsel approves, flip `LEGAL_REVIEW_APPROVED` to true (and ideally gate
 * it on a build flag / dated approval record).
 */

import type { AgencyRelationship } from "./types";

/** Flip to true ONLY when counsel has signed off on the wording below. */
export const LEGAL_REVIEW_APPROVED = false;

/** Banner shown above any representation/consent copy while unapproved. */
export const LEGAL_DRAFT_BANNER =
  "DRAFT — pending legal review. This wording is placeholder copy and is not " +
  "legally binding. Do not rely on it; final language will be provided by counsel.";

/** Human-readable labels for each agency relationship option. */
export const AGENCY_RELATIONSHIP_LABELS: Record<AgencyRelationship, string> = {
  represents_buyer: "This agent represents me as the buyer",
  listing_side: "This agent is on the listing side (seller / dual)",
  unrepresented: "I am unrepresented (no agent represents me)",
  unknown: "Not specified yet",
};

/** Short explanatory copy for each relationship (placeholder, legal-gated). */
export const AGENCY_RELATIONSHIP_HELP: Record<AgencyRelationship, string> = {
  represents_buyer:
    "An agent collaborating in your workspace does not by itself create " +
    "representation — representation exists only if you sign an agreement.",
  listing_side:
    "If this agent is on the listing side, they do not represent your " +
    "interests. Be aware of dual-agency rules, which vary by state and are " +
    "prohibited in some.",
  unrepresented:
    "You remain unrepresented. The platform will keep your guardrails and " +
    "will not treat collaboration as legal or agency advice.",
  unknown:
    "Please capture the representation relationship so it is clear on this deal.",
};

/** Consent prompt for sharing financial data with an agent (placeholder). */
export const FINANCIAL_CONSENT_PROMPT =
  "Share my financial data (budget and offer financing details) with the " +
  "agent on this deal. This is off by default. You can revoke it at any time, " +
  "which immediately cuts off access.";

/** Privacy note shown alongside the consent toggle (placeholder, legal-gated). */
export const FINANCIAL_CONSENT_PRIVACY_NOTE =
  "Your financial information is sensitive. We only share it with members you " +
  "explicitly consent to, and never with viewers. (Placeholder GLBA-style " +
  "notice — pending legal review.)";
