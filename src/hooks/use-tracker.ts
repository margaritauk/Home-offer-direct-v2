"use client";

import { useCallback, useEffect, useState } from "react";
import { defaultOffsets, type DeadlineOffsets } from "@/lib/deadlines";
import { emitLocalChange } from "@/lib/sync/local-store";

const STORAGE_KEY = "hod:tracker:v1";

/**
 * In-memory undo snapshot for the tracker (issue #152). Captured on `reset()`
 * before the state is cleared so the user can immediately undo. Not persisted —
 * lost on reload, which is acceptable for a transient affordance. Module-scoped
 * to a single tab, mirroring useStageTool's approach.
 */
let undoSnapshot: TrackerState | null = null;

export interface TrackerState {
  underContractDate: string;
  closingDate: string;
  offsets: DeadlineOffsets;
  /** Document item ids that have been gathered. */
  docs: Record<string, boolean>;
}

const empty: TrackerState = {
  underContractDate: "",
  closingDate: "",
  offsets: { ...defaultOffsets },
  docs: {},
};

function read(): TrackerState {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<TrackerState>;
    return {
      underContractDate: parsed.underContractDate ?? "",
      closingDate: parsed.closingDate ?? "",
      offsets: { ...defaultOffsets, ...(parsed.offsets ?? {}) },
      docs: parsed.docs ?? {},
    };
  } catch {
    return empty;
  }
}

/** Persists the buyer's deal dates, contingency offsets, and document status. */
export function useTracker() {
  const [state, setState] = useState<TrackerState>(empty);
  const [hydrated, setHydrated] = useState(false);
  // True after a reset until undo is used or any other mutating write happens.
  const [canUndoReset, setCanUndoReset] = useState(false);

  useEffect(() => {
    setState(read());
    setHydrated(true);
    setCanUndoReset(undoSnapshot !== null);
  }, []);

  const writeThrough = useCallback((next: TrackerState) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* best-effort */
    }
    emitLocalChange();
  }, []);

  const setDates = useCallback(
    (dates: { underContractDate?: string; closingDate?: string }) => {
      // Any manual edit invalidates a pending undo snapshot.
      undoSnapshot = null;
      setCanUndoReset(false);
      setState((prev) => {
        const next = { ...prev, ...dates };
        writeThrough(next);
        return next;
      });
    },
    [writeThrough],
  );

  const setOffset = useCallback(
    (key: keyof DeadlineOffsets, value: number) => {
      undoSnapshot = null;
      setCanUndoReset(false);
      setState((prev) => {
        const next = { ...prev, offsets: { ...prev.offsets, [key]: value } };
        writeThrough(next);
        return next;
      });
    },
    [writeThrough],
  );

  const toggleDoc = useCallback(
    (id: string) => {
      undoSnapshot = null;
      setCanUndoReset(false);
      setState((prev) => {
        const docs = { ...prev.docs };
        if (docs[id]) delete docs[id];
        else docs[id] = true;
        const next = { ...prev, docs };
        writeThrough(next);
        return next;
      });
    },
    [writeThrough],
  );

  const reset = useCallback(() => {
    setState((prev) => {
      // Snapshot the current state BEFORE clearing so undo can restore it.
      undoSnapshot = prev;
      writeThrough(empty);
      return empty;
    });
    setCanUndoReset(true);
  }, [writeThrough]);

  const undoReset = useCallback(() => {
    if (undoSnapshot === null) return;
    const snapshot = undoSnapshot;
    undoSnapshot = null;
    setCanUndoReset(false);
    setState(snapshot);
    writeThrough(snapshot);
  }, [writeThrough]);

  return {
    state,
    hydrated,
    setDates,
    setOffset,
    toggleDoc,
    reset,
    undoReset,
    canUndoReset,
  };
}
