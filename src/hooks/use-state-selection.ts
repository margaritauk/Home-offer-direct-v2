"use client";

import { useCallback, useEffect, useState } from "react";
import { emitLocalChange } from "@/lib/sync/local-store";

const STORAGE_KEY = "hod:state:v1";

/**
 * In-tab subscribers. The browser `storage` event only fires in *other* tabs,
 * so we keep a module-level listener set to keep every hook instance in the
 * same document in sync when the selection changes (e.g. the picker and the
 * guide rendered on the same page).
 */
const listeners = new Set<(code: string | null) => void>();

function read(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Persists the buyer's selected state (two-letter code) in localStorage so the
 * journey can render state-aware guidance everywhere. No account required.
 * Updates propagate to all instances in the current tab and across other tabs.
 */
export function useStateSelection() {
  const [stateCode, setStateCode] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStateCode(read());
    setHydrated(true);

    // Same-tab sync between hook instances.
    const listener = (code: string | null) => setStateCode(code);
    listeners.add(listener);

    // Cross-tab sync.
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setStateCode(read());
    };
    window.addEventListener("storage", onStorage);

    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const selectState = useCallback((code: string | null) => {
    try {
      if (code) window.localStorage.setItem(STORAGE_KEY, code);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* best-effort */
    }
    // Notify every instance in this tab (including the caller).
    listeners.forEach((l) => l(code));
    emitLocalChange();
  }, []);

  return { stateCode, hydrated, selectState };
}
