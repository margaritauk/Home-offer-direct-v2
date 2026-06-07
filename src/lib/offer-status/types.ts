/**
 * Offer-status pipeline domain model (issue #39).
 *
 * Tracks where each home's purchase offer sits in its lifecycle and when its
 * response window (expiration) closes, so a self-serve buyer always knows which
 * deals need action. Like the showing tracker (#20) this is the buyer's private
 * record, keyed per home, and stored as plain data so the reducer + expiration
 * helpers stay pure and fully unit-testable.
 *
 * This is NOT a contract or legal advice (UPL guardrail, #17 / epic #33): it is
 * a status worksheet the buyer maintains themselves. It never solicits or infers
 * protected-class information (Fair Housing, #22) — only transaction facts.
 */

/** Lifecycle of a single offer on one home. */
export type OfferStatus =
  | "draft"
  | "sent"
  | "submitted"
  | "countered"
  | "accepted"
  | "rejected"
  | "expired";

/**
 * Ordered "pipeline" statuses the buyer advances through. The three terminal
 * outcomes (accepted / rejected / expired) are reachable from anywhere but are
 * not part of the linear forward progression.
 */
export const OFFER_PIPELINE: OfferStatus[] = [
  "draft",
  "sent",
  "submitted",
  "countered",
];

/** Terminal outcomes — once here, the deal is resolved. */
export const OFFER_TERMINAL: OfferStatus[] = ["accepted", "rejected", "expired"];

/** Every status in canonical display order. */
export const OFFER_STATUSES: OfferStatus[] = [
  ...OFFER_PIPELINE,
  ...OFFER_TERMINAL,
];

export const offerStatusLabels: Record<OfferStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  submitted: "Submitted",
  countered: "Countered",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
};

/** True for the resolved outcomes — no further action is expected. */
export function isTerminalStatus(status: OfferStatus): boolean {
  return OFFER_TERMINAL.includes(status);
}

/** One free-form note attached to a status change, for an audit trail. */
export interface OfferStatusNote {
  /** ISO timestamp the note was added. */
  at: string;
  /** The status in effect when the note was written. */
  status: OfferStatus;
  /** The buyer's note. Facts only — see file header. */
  text: string;
}

/** The buyer's offer-status record for one home. */
export interface OfferStatusRecord {
  /** The listing / home this record tracks. Used as the map key. */
  listingId: string;
  status: OfferStatus;
  /** ISO datetime the offer was sent, if any. */
  sentAt?: string;
  /** ISO datetime the offer's response window closes, if any. */
  expiresAt?: string;
  /** Chronological notes accompanying status changes. */
  notes?: OfferStatusNote[];
  /** ISO timestamp the record was created. */
  createdAt: string;
  /** ISO timestamp of the last update. */
  updatedAt: string;
}

/** All tracked offer statuses, keyed by listing id. */
export type OfferStatusMap = Record<string, OfferStatusRecord>;
