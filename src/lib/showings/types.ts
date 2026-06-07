/**
 * Showing-tracker domain model (issue #20).
 *
 * A {@link ShowingRecord} is the buyer's private notes about one listing as they
 * move it through the showing pipeline. It snapshots the listing's address/area
 * at the time it was tracked so the dashboard can group by area even if the
 * mock listing later changes or is swapped for a live feed.
 *
 * GUARDRAIL (Fair Housing, #22): only property/transaction facts live here —
 * status, schedule, a quick rating, and free-form notes the buyer keeps to
 * themselves. Nothing in this shape solicits protected-class information.
 */

/** Where a listing sits in the buyer's showing pipeline. */
export type ShowingStatus =
  | "interested"
  | "requested"
  | "scheduled"
  | "seen"
  | "passed"
  | "offer";

/** Ordered statuses for UI controls / progression. */
export const SHOWING_STATUSES: ShowingStatus[] = [
  "interested",
  "requested",
  "scheduled",
  "seen",
  "passed",
  "offer",
];

export const showingStatusLabels: Record<ShowingStatus, string> = {
  interested: "Interested",
  requested: "Requested",
  scheduled: "Scheduled",
  seen: "Seen",
  passed: "Passed",
  offer: "Offer",
};

export interface ShowingRecord {
  /** The listing this record tracks. Used as the map key. */
  listingId: string;
  /** Snapshot of the listing location at track time (for grouping by area). */
  address: string;
  city: string;
  /** Two-letter state code, uppercase. */
  state: string;

  status: ShowingStatus;
  /** ISO datetime (`datetime-local` value) of the scheduled showing, if any. */
  scheduledAt?: string;
  /** Free-form buyer notes / pros-cons. Facts only — see file header. */
  notes?: string;
  /** Quick post-visit rating, 1–5. */
  rating?: number;

  /** ISO timestamp the record was created. */
  createdAt: string;
  /** ISO timestamp of the last update. */
  updatedAt: string;
}

/** All tracked showings, keyed by listing id. */
export type ShowingMap = Record<string, ShowingRecord>;
