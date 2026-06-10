/**
 * Showing-tracker domain model (issue #20).
 *
 * A {@link ShowingRecord} is the buyer's private notes about one listing as they
 * move it through the showing pipeline. It snapshots the listing's address/area
 * at the time it was tracked so the dashboard can group by area even if the
 * mock listing later changes or is swapped for a live feed.
 *
 * GUARDRAIL (Fair Housing, #22): only property/transaction facts live here —
 * status, schedule, a quick rating, free-form notes the buyer keeps to
 * themselves, plus an {@link AgentContact} the buyer copied from a public
 * listing/sign/open house and an {@link OutreachEntry} log of their own contact
 * attempts. Nothing in this shape solicits, stores, or volunteers
 * protected-class information (race, color, religion, sex, national origin,
 * familial status, disability, age, marital status, or source of income).
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

/**
 * Contact details for the listing agent, as the buyer typed them in from a
 * PUBLIC source (the listing page, a yard sign, an open-house flyer). These are
 * neutral business facts the buyer already has — we never provide, look up, or
 * transmit them.
 *
 * GUARDRAIL (Fair Housing, #22): facts-only. There is intentionally NO field
 * here for any protected class or personal characteristic of the agent, buyer,
 * seller, or household.
 */
export interface AgentContact {
  /** Listing agent's name, as published. */
  name?: string;
  /** Phone number from the public listing/sign. */
  phone?: string;
  /** Email address from the public listing. */
  email?: string;
  /** Brokerage / firm name. */
  brokerage?: string;
  /** How/where the buyer found this contact (e.g. "Zillow", "yard sign"). */
  source?: string;
}

/** The channel the buyer used (or plans to use) to reach the agent. */
export type OutreachChannel = "email" | "phone" | "in-person" | "other";

/**
 * One logged contact attempt the buyer made on their own. Free-text fields
 * (`outcome`, `notes`) are screened for protected-class signals before they are
 * stored/used (see `agent-outreach.tsx`).
 *
 * GUARDRAIL (Fair Housing, #22): a neutral activity log of transaction facts —
 * when, how, and what happened. No protected-class fields.
 */
export interface OutreachEntry {
  /** Stable id for list rendering / dedupe. */
  id: string;
  /** ISO datetime the attempt was logged. */
  date: string;
  channel: OutreachChannel;
  /** Short result, e.g. "left voicemail", "showing booked". Free text, screened. */
  outcome?: string;
  /** Optional extra notes. Free text, screened. Facts only. */
  notes?: string;
}

export interface ShowingRecord {
  /** The listing this record tracks. Used as the map key. */
  listingId: string;
  /** Snapshot of the listing location at track time (for grouping by area). */
  address: string;
  city: string;
  /** Two-letter state code, uppercase. */
  state: string;

  status: ShowingStatus;
  /** True for properties the buyer added by hand (no real listing page to link). */
  manual?: boolean;
  /** ISO datetime (`datetime-local` value) of the scheduled showing, if any. */
  scheduledAt?: string;
  /** Free-form buyer notes / pros-cons. Facts only — see file header. */
  notes?: string;
  /** Quick post-visit rating, 1–5. */
  rating?: number;
  /** Listing-agent contact the buyer entered from a public source. */
  agent?: AgentContact;
  /** Log of the buyer's own outreach attempts to the agent. */
  outreach?: OutreachEntry[];

  /** ISO timestamp the record was created. */
  createdAt: string;
  /** ISO timestamp of the last update. */
  updatedAt: string;
}

/** All tracked showings, keyed by listing id. */
export type ShowingMap = Record<string, ShowingRecord>;
