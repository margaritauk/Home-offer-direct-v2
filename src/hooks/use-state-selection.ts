"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "hod:state:v1";

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
 */
export function useStateSelection() {
  const [stateCode, setStateCode] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStateCode(read());
    setHydrated(true);
  }, []);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setStateCode(read());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const selectState = useCallback((code: string | null) => {
    setStateCode(code);
    try {
      if (code) window.localStorage.setItem(STORAGE_KEY, code);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* best-effort */
    }
  }, []);

  return { stateCode, hydrated, selectState };
}
