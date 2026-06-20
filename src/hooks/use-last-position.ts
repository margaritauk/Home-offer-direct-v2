"use client";

import { useCallback } from "react";
import { useStageTool } from "@/hooks/use-stage-tool";
import type { LastPosition } from "@/lib/journey/navigation";

/**
 * Thin wrapper over `useStageTool("__last-position")` (Item 2 part 3 / S0b).
 *
 * Persists the buyer's last-visited journey step / tool so the landing +
 * dashboard can offer "Resume: <where>". Stored under `hod:tool:__last-position:v1`,
 * so it auto-syncs to signed-in users through the existing sync rails with ZERO
 * sync edits. Never stores user free-text — only an app-controlled label.
 */
const INITIAL: { position: LastPosition | null } = { position: null };

export function useLastPosition() {
  const { value, hydrated, save } = useStageTool<{ position: LastPosition | null }>(
    "__last-position",
    INITIAL,
  );

  const record = useCallback(
    (next: Omit<LastPosition, "updatedAt">) => {
      save({ position: { ...next, updatedAt: Date.now() } });
    },
    [save],
  );

  return { position: value.position, hydrated, record };
}
