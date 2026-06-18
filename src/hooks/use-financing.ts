"use client";

import { useStageTool } from "@/hooks/use-stage-tool";
import {
  EMPTY_FINANCING_DATES,
  type FinancingDates,
} from "@/lib/financing/milestones";

/**
 * Persisted state for the financing-milestone tracker (S5-F1).
 *
 * Stored under the per-stage tool key `hod:tool:financing:v1` via
 * {@link useStageTool}, so it auto-syncs across tabs and a future "sync per-stage
 * tools to the deal" story picks it up for free. The shape is just the buyer's
 * financing dates plus an optional property label; the milestone math is pure
 * (`computeFinancingMilestones`).
 */
export interface FinancingState {
  /** Optional label for the home this loan is for. */
  property?: string;
  dates: FinancingDates;
}

export const FINANCING_TOOL_ID = "financing";

export const INITIAL_FINANCING_STATE: FinancingState = {
  property: "",
  dates: { ...EMPTY_FINANCING_DATES },
};

/** Read/write the financing tool's persisted dates. Thin wrapper over useStageTool. */
export function useFinancing() {
  return useStageTool<FinancingState>(
    FINANCING_TOOL_ID,
    INITIAL_FINANCING_STATE,
  );
}
