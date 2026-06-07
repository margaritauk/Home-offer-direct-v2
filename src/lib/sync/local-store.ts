import { defaultOffsets } from "@/lib/deadlines";
import type { TrackerState } from "@/hooks/use-tracker";
import type { Offer } from "@/lib/offer/types";
import type { ShowingMap } from "@/lib/showings/types";
import type { OfferStatusMap } from "@/lib/offer-status/types";
import type { SyncData } from "./types";

// These MUST match the keys used by the individual hooks.
export const PROGRESS_KEY = "hod:progress:v1";
export const STATE_KEY = "hod:state:v1";
export const TRACKER_KEY = "hod:tracker:v1";
export const OFFER_KEY = "hod:offer:v1";
export const SHOWINGS_KEY = "hod:showings:v1";
export const OFFER_STATUS_KEY = "hod:offer-status:v1";

/** Fired after any local store changes so the sync layer can push to the cloud. */
export const LOCAL_CHANGE_EVENT = "hod:local-change";

export function emitLocalChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(LOCAL_CHANGE_EVENT));
  }
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const emptyTracker: TrackerState = {
  underContractDate: "",
  closingDate: "",
  offsets: { ...defaultOffsets },
  docs: {},
};

/** Snapshot all local stores into a single SyncData object. */
export function readLocal(): SyncData {
  if (typeof window === "undefined") {
    return {
      progress: {},
      stateCode: null,
      tracker: emptyTracker,
      offer: null,
      showings: {},
      offerStatus: {},
    };
  }
  return {
    progress: readJSON<Record<string, boolean>>(PROGRESS_KEY, {}),
    stateCode: window.localStorage.getItem(STATE_KEY) || null,
    tracker: {
      ...emptyTracker,
      ...readJSON<TrackerState>(TRACKER_KEY, emptyTracker),
      offsets: { ...defaultOffsets, ...readJSON<TrackerState>(TRACKER_KEY, emptyTracker).offsets },
    },
    offer: readJSON<Offer | null>(OFFER_KEY, null),
    showings: readJSON<ShowingMap>(SHOWINGS_KEY, {}),
    offerStatus: readJSON<OfferStatusMap>(OFFER_STATUS_KEY, {}),
  };
}

/** Write a SyncData object back into the individual local stores. */
export function writeLocal(data: SyncData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(data.progress));
    if (data.stateCode) window.localStorage.setItem(STATE_KEY, data.stateCode);
    else window.localStorage.removeItem(STATE_KEY);
    window.localStorage.setItem(TRACKER_KEY, JSON.stringify(data.tracker));
    if (data.offer) window.localStorage.setItem(OFFER_KEY, JSON.stringify(data.offer));
    else window.localStorage.removeItem(OFFER_KEY);
    window.localStorage.setItem(SHOWINGS_KEY, JSON.stringify(data.showings ?? {}));
    window.localStorage.setItem(OFFER_STATUS_KEY, JSON.stringify(data.offerStatus ?? {}));
  } catch {
    /* best-effort */
  }
}
