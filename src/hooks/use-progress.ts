"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "hod:progress:v1";

/**
 * Set of completed task ids, namespaced as `${stageSlug}/${stepSlug}/${taskId}`
 * so ids only need to be unique within their step.
 */
export type CompletedTasks = Record<string, boolean>;

export function taskKey(stageSlug: string, stepSlug: string, taskId: string) {
  return `${stageSlug}/${stepSlug}/${taskId}`;
}

function read(): CompletedTasks {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CompletedTasks) : {};
  } catch {
    return {};
  }
}

/**
 * Tracks per-task completion in localStorage. No account required — progress is
 * per-device. Returns the completed map plus helpers to toggle and query it.
 */
export function useProgress() {
  const [completed, setCompleted] = useState<CompletedTasks>({});
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from storage after mount to avoid SSR/client mismatch.
  useEffect(() => {
    setCompleted(read());
    setHydrated(true);
  }, []);

  // Keep in sync across tabs.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setCompleted(read());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: CompletedTasks) => {
    setCompleted(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage may be unavailable (private mode); progress is best-effort */
    }
  }, []);

  const toggleTask = useCallback(
    (key: string) => {
      setCompleted((prev) => {
        const next = { ...prev };
        if (next[key]) delete next[key];
        else next[key] = true;
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* best-effort */
        }
        return next;
      });
    },
    [],
  );

  const isDone = useCallback((key: string) => Boolean(completed[key]), [completed]);

  const reset = useCallback(() => persist({}), [persist]);

  return { completed, hydrated, toggleTask, isDone, reset };
}
