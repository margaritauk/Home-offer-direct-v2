"use client";

import { useCallback, useEffect, useState } from "react";
import { defaultOffsets, type DeadlineOffsets } from "@/lib/deadlines";
import { emitLocalChange } from "@/lib/sync/local-store";

const STORAGE_KEY = "hod:tracker:v1";

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

  useEffect(() => {
    setState(read());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: TrackerState) => {
    setState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* best-effort */
    }
    emitLocalChange();
  }, []);

  const setDates = useCallback(
    (dates: { underContractDate?: string; closingDate?: string }) => {
      setState((prev) => {
        const next = { ...prev, ...dates };
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* best-effort */
        }
        emitLocalChange();
        return next;
      });
    },
    [],
  );

  const setOffset = useCallback((key: keyof DeadlineOffsets, value: number) => {
    setState((prev) => {
      const next = { ...prev, offsets: { ...prev.offsets, [key]: value } };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* best-effort */
      }
      emitLocalChange();
      return next;
    });
  }, []);

  const toggleDoc = useCallback((id: string) => {
    setState((prev) => {
      const docs = { ...prev.docs };
      if (docs[id]) delete docs[id];
      else docs[id] = true;
      const next = { ...prev, docs };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* best-effort */
      }
      emitLocalChange();
      return next;
    });
  }, []);

  const reset = useCallback(() => persist(empty), [persist]);

  return { state, hydrated, setDates, setOffset, toggleDoc, reset };
}
