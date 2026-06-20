"use client";

import { useEffect, useState } from "react";
import {
  LOCAL_CHANGE_EVENT,
  TOOL_KEY_PREFIX,
  TOOL_KEY_SUFFIX,
} from "@/lib/sync/local-store";

/**
 * Reads every per-stage tool blob into a `{ toolId: parsedValue }` map
 * (Item 2 / S0b), for the tri-state completion surfaces (journey overview +
 * `/tools` index) that need to know which tools have saved data. Re-reads on the
 * local-change event + cross-tab `storage` so it stays live as the buyer works.
 *
 * Reads only structural data (the parsed blobs); the status derivation
 * (`toolHasData`) inspects counts/non-empty, never note content (FHA).
 */
function readAllToolData(): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  const out: Record<string, unknown> = {};
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (!k || !k.startsWith(TOOL_KEY_PREFIX) || !k.endsWith(TOOL_KEY_SUFFIX)) {
      continue;
    }
    const toolId = k.slice(
      TOOL_KEY_PREFIX.length,
      k.length - TOOL_KEY_SUFFIX.length,
    );
    try {
      const raw = window.localStorage.getItem(k);
      if (raw) out[toolId] = JSON.parse(raw);
    } catch {
      /* skip unparseable blob */
    }
  }
  return out;
}

export function useToolData(): {
  toolData: Record<string, unknown>;
  hydrated: boolean;
} {
  const [toolData, setToolData] = useState<Record<string, unknown>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const refresh = () => setToolData(readAllToolData());
    refresh();
    setHydrated(true);
    window.addEventListener(LOCAL_CHANGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(LOCAL_CHANGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return { toolData, hydrated };
}
