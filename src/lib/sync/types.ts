import type { TrackerState } from "@/hooks/use-tracker";

/** The full set of data we sync per user — mirrors the localStorage stores. */
export interface SyncData {
  /** Completed task map (only `true` values are stored). */
  progress: Record<string, boolean>;
  /** Selected state code, or null. */
  stateCode: string | null;
  /** Deal dates, contingency offsets, and document statuses. */
  tracker: TrackerState;
}
