/**
 * Per-home dashboard rollup (issue #38).
 *
 * Pure aggregation: given the buyer's existing stores (journey progress,
 * showings, offer status, the deal tracker, and document status) it produces one
 * {@link HomeRollup} per home the buyer is engaging, plus a single-line "next
 * action" hint and deep links into the relevant tool.
 *
 * No I/O and no React — fully unit-testable. The dashboard component just maps
 * the result to cards.
 *
 * Note on scope: journey progress, the deal-date tracker, and the document
 * checklist are currently single-deal (device-wide) stores, so those columns are
 * shared across homes. They still surface per card so the buyer sees the whole
 * picture; the offer + showing columns are genuinely per-home.
 */

import {
  daysToClosing,
  statusFor,
  type DeadlineInput,
  type Milestone,
  type MilestoneStatus,
} from "@/lib/deadlines";
import { allDealMilestones } from "@/lib/milestones/all-milestones";
import type { FinancingDates } from "@/lib/financing/milestones";
import { totalDocuments } from "@/lib/documents";
import {
  expirationInfo,
  type ExpirationInfo,
} from "@/lib/offer-status/reducer";
import type {
  OfferStatus,
  OfferStatusMap,
  OfferStatusRecord,
} from "@/lib/offer-status/types";
import type {
  ShowingMap,
  ShowingRecord,
  ShowingStatus,
} from "@/lib/showings/types";

/** Snapshot of the deal-date tracker needed for the deadline column. */
export interface TrackerSnapshot {
  underContractDate: string;
  closingDate: string;
  offsets: DeadlineInput["offsets"];
  docs: Record<string, boolean>;
  /**
   * The financing tool's persisted dates (S5-F1). When present, financing
   * milestones are unioned into the deadline stream so they surface in the cockpit
   * as "do this now" cards. Omitted ⇒ tracker milestones only (unchanged S1 path).
   */
  financing?: FinancingDates;
}

export interface RollupInput {
  /** Completed-task map from useProgress (`stage/step/task` keys). */
  progress: Record<string, boolean>;
  /** Total number of journey tasks (from `totalTasks()`); used for the %. */
  totalJourneyTasks: number;
  showings: ShowingMap;
  offers: OfferStatusMap;
  tracker: TrackerSnapshot;
  /** Reference date (YYYY-MM-DD) for deadline/expiration math. */
  today: string;
}

export interface NextDeadline {
  id: string;
  label: string;
  date: string;
  status: MilestoneStatus;
  daysAway: number;
}

export interface HomeRollup {
  listingId: string;
  /** Display title (address) when known, else the listing id. */
  title: string;
  city?: string;
  state?: string;

  /** Whole-journey completion percentage (device-wide store; see file note). */
  journeyPct: number;
  journeyDone: number;
  journeyTotal: number;

  showingStatus?: ShowingStatus;
  offerStatus?: OfferStatus;
  expiration?: ExpirationInfo;

  nextDeadline?: NextDeadline;
  /** Count of document-checklist items not yet gathered (device-wide store). */
  outstandingDocs: number;

  /**
   * Tracker closing date (YYYY-MM-DD) when set, and the signed days-to-closing
   * from `today` (positive = remaining, 0 = today, negative = past). Both are
   * absent when no valid closing date is set. Device-wide store (see file note).
   */
  closingDate?: string;
  closingDays?: number;

  /** One-line "what to do next" hint. */
  nextAction: string;
  /** Deep link target for the next action. */
  nextHref: string;
}

const MS_PER_DAY = 86_400_000;

/** Route for the offer-creation wizard (#37 / offer builder). */
const OFFER_BUILDER_HREF = "/tools/offer-builder";

function journeyProgress(
  progress: Record<string, boolean>,
  total: number,
): { done: number; total: number; pct: number } {
  const done = Object.values(progress).filter(Boolean).length;
  const safeTotal = total > 0 ? total : 0;
  const pct = safeTotal ? Math.round((done / safeTotal) * 100) : 0;
  // Never report more done than exist (defensive against stale keys).
  return { done: Math.min(done, safeTotal || done), total: safeTotal, pct };
}

function computeNextDeadline(
  tracker: TrackerSnapshot,
  today: string,
): { next?: NextDeadline; milestones: Milestone[] } {
  const milestones = allDealMilestones({
    underContractDate: tracker.underContractDate,
    closingDate: tracker.closingDate,
    offsets: tracker.offsets,
    financing: tracker.financing,
  });
  if (milestones.length === 0) return { milestones };

  // First milestone that isn't comfortably in the past — prefer the soonest
  // upcoming/today, falling back to the most recent overdue one if all passed.
  const dated = milestones
    .map((m) => ({
      m,
      diff: Math.round(
        (Date.parse(`${m.date}T00:00:00Z`) -
          Date.parse(`${today}T00:00:00Z`)) /
          MS_PER_DAY,
      ),
    }))
    .filter((x) => !Number.isNaN(x.diff));

  if (dated.length === 0) return { milestones };

  const upcoming = dated.filter((x) => x.diff >= 0).sort((a, b) => a.diff - b.diff);
  const chosen = upcoming[0] ?? dated.sort((a, b) => b.diff - a.diff)[0];

  return {
    milestones,
    next: {
      id: chosen.m.id,
      label: chosen.m.label,
      date: chosen.m.date,
      status: statusFor(chosen.m.date, today),
      daysAway: chosen.diff,
    },
  };
}

function outstandingDocCount(docs: Record<string, boolean>): number {
  const gathered = Object.values(docs).filter(Boolean).length;
  return Math.max(0, totalDocuments() - gathered);
}

/**
 * Decide the single most useful next step for a home and where it links.
 * Priority: resolve an offer needing action > advance the offer > deadlines >
 * showing follow-through.
 */
function deriveNextAction(args: {
  showing?: ShowingRecord;
  offer?: OfferStatusRecord;
  expiration?: ExpirationInfo;
  nextDeadline?: NextDeadline;
}): { nextAction: string; nextHref: string } {
  const { showing, offer, expiration, nextDeadline } = args;

  if (offer) {
    if (offer.status === "accepted") {
      if (nextDeadline) {
        return {
          nextAction: `Offer accepted — next deadline: ${nextDeadline.label}.`,
          nextHref: "/tracker",
        };
      }
      return {
        nextAction: "Offer accepted — set your dates in the deadline tracker.",
        nextHref: "/tracker",
      };
    }
    if (offer.status === "rejected") {
      return {
        nextAction: "Offer rejected — consider another home or a new offer.",
        nextHref: "/showings",
      };
    }
    if (offer.status === "expired" || expiration?.isExpired) {
      return {
        nextAction: "Offer window has expired — follow up or re-send.",
        nextHref: "/offer-status",
      };
    }
    if (expiration && expiration.urgency === "today") {
      return {
        nextAction: "Offer expires today — confirm the seller's response.",
        nextHref: "/offer-status",
      };
    }
    if (expiration && expiration.urgency === "soon") {
      return {
        nextAction: `Offer ${expiration.label.toLowerCase()} — chase a response.`,
        nextHref: "/offer-status",
      };
    }
    if (offer.status === "countered") {
      return {
        nextAction: "Counter received — respond to the seller's terms.",
        nextHref: "/offer-status",
      };
    }
    if (offer.status === "draft") {
      return {
        nextAction: "Finish and send your offer.",
        nextHref: OFFER_BUILDER_HREF,
      };
    }
    // sent / submitted, no urgent expiry
    return {
      nextAction: "Offer is out — watch for the seller's response.",
      nextHref: "/offer-status",
    };
  }

  // No offer yet — drive from the showing pipeline.
  if (showing) {
    switch (showing.status) {
      case "interested":
        return {
          nextAction: "Request a showing for this home.",
          nextHref: "/showings",
        };
      case "requested":
        return {
          nextAction: "Awaiting a showing time — confirm with the agent.",
          nextHref: "/showings",
        };
      case "scheduled":
        return {
          nextAction: "Showing scheduled — prep your questions.",
          nextHref: "/showings",
        };
      case "seen":
        return {
          nextAction: "You've toured this home — draft an offer if it's the one.",
          nextHref: OFFER_BUILDER_HREF,
        };
      case "offer":
        return {
          nextAction: "Ready to offer — start tracking the offer status.",
          nextHref: "/offer-status",
        };
      case "passed":
        return {
          nextAction: "You passed on this home.",
          nextHref: "/showings",
        };
    }
  }

  return { nextAction: "Keep your search moving.", nextHref: "/showings" };
}

/**
 * Build the per-home rollups. The home list is the union of homes the buyer is
 * engaging via tracked showings and/or offer-status records, sorted by most
 * recently touched.
 */
export function buildHomeRollups(input: RollupInput): HomeRollup[] {
  const journey = journeyProgress(input.progress, input.totalJourneyTasks);
  const { next: nextDeadline } = computeNextDeadline(input.tracker, input.today);
  const outstandingDocs = outstandingDocCount(input.tracker.docs);
  const closingDays = daysToClosing(input.tracker.closingDate, input.today);
  const closingDate =
    closingDays === null ? undefined : input.tracker.closingDate;

  const ids = new Set<string>([
    ...Object.keys(input.showings),
    ...Object.keys(input.offers),
  ]);

  const rollups: HomeRollup[] = [];

  for (const listingId of ids) {
    const showing = input.showings[listingId];
    const offer = input.offers[listingId];
    const expiration = offer
      ? expirationInfo(offer, input.today)
      : undefined;

    const action = deriveNextAction({
      showing,
      offer,
      expiration,
      nextDeadline,
    });

    rollups.push({
      listingId,
      title: showing?.address ?? listingId,
      city: showing?.city,
      state: showing?.state,
      journeyPct: journey.pct,
      journeyDone: journey.done,
      journeyTotal: journey.total,
      showingStatus: showing?.status,
      offerStatus: offer?.status,
      expiration,
      nextDeadline,
      outstandingDocs,
      closingDate,
      closingDays: closingDays ?? undefined,
      nextAction: action.nextAction,
      nextHref: action.nextHref,
    });
  }

  // Sort by most-recently-updated across either store.
  const updatedAt = (r: HomeRollup): string => {
    const s = input.showings[r.listingId]?.updatedAt ?? "";
    const o = input.offers[r.listingId]?.updatedAt ?? "";
    return s > o ? s : o;
  };
  rollups.sort((a, b) => updatedAt(b).localeCompare(updatedAt(a)));

  return rollups;
}
