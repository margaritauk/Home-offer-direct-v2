import type { TrackerState } from "@/hooks/use-tracker";
import type { Offer } from "@/lib/offer/types";
import type { ShowingMap } from "@/lib/showings/types";
import type { OfferStatusMap } from "@/lib/offer-status/types";

/** The full set of data we sync per user — mirrors the localStorage stores. */
export interface SyncData {
  /** Completed task map (only `true` values are stored). */
  progress: Record<string, boolean>;
  /** Selected state code, or null. */
  stateCode: string | null;
  /** Deal dates, contingency offsets, and document statuses. */
  tracker: TrackerState;
  /** The offer worksheet, or null if none started. */
  offer: Offer | null;
  /** Tracked showings, keyed by listing id. */
  showings: ShowingMap;
  /** Offer-status records, keyed by listing id. */
  offerStatus: OfferStatusMap;
}
