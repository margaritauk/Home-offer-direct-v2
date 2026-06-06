import { defaultOffsets } from "@/lib/deadlines";
import type { TrackerState } from "@/hooks/use-tracker";
import type { SyncData } from "./types";

// These MUST match the keys used by the individual hooks.
export const PROGRESS_KEY = "hod:progress:v1";
export const STATE_KEY = "hod:state:v1";
export const TRACKER_KEY = "hod:tracker:v1";

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
    return { progress: {}, stateCode: null, tracker: emptyTracker };
  }
  return {
    progress: readJSON<Record<string, boolean>>(PROGRESS_KEY, {}),
    stateCode: window.localStorage.getItem(STATE_KEY) || null,
    tracker: {
      ...emptyTracker,
      ...readJSON<TrackerState>(TRACKER_KEY, emptyTracker),
      offsets: { ...defaultOffsets, ...readJSON<TrackerState>(TRACKER_KEY, emptyTracker).offsets },
    },
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
  } catch {
    /* best-effort */
  }
}
