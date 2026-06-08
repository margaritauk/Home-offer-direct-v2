"use client";

import { useCallback, useEffect, useState } from "react";
import { emitLocalChange } from "@/lib/sync/local-store";

/**
 * Generic localStorage persistence for the per-stage interactive tools
 * (epic #64+). Each tool gets a namespaced key `hod:tool:<toolId>:v1` and a
 * value of its own shape. Shared in-tab store (module listeners + the `storage`
 * event) so multiple instances stay in sync, mirroring useShowings.
 *
 * Persistence is device-local for now; `emitLocalChange()` is fired on writes so
 * a future "sync per-stage tools to the deal" story can pick them up without
 * touching each tool.
 */
const listeners = new Set<() => void>();
function notifyAll() {
  listeners.forEach((l) => l());
}

function keyFor(toolId: string) {
  return `hod:tool:${toolId}:v1`;
}

function read<T>(toolId: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(keyFor(toolId));
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useStageTool<T>(toolId: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValue(read<T>(toolId, initial));
    setHydrated(true);
    const sync = () => setValue(read<T>(toolId, initial));
    listeners.add(sync);
    const onStorage = (e: StorageEvent) => {
      if (e.key === keyFor(toolId)) setValue(read<T>(toolId, initial));
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(sync);
      window.removeEventListener("storage", onStorage);
    };
    // toolId is stable per usage; initial is a default only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolId]);

  /** Save a new value (or update via a function of the previous value). */
  const save = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(keyFor(toolId), JSON.stringify(resolved));
        } catch {
          /* best-effort */
        }
        notifyAll();
        emitLocalChange();
        return resolved;
      });
    },
    [toolId],
  );

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(keyFor(toolId));
    } catch {
      /* best-effort */
    }
    setValue(initial);
    notifyAll();
    emitLocalChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolId]);

  return { value, hydrated, save, reset };
}
