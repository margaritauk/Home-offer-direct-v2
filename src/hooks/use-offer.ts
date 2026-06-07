"use client";

import { useCallback, useEffect, useState } from "react";
import { emitLocalChange } from "@/lib/sync/local-store";
import {
  CONTINGENCIES,
  type ContingencyId,
} from "@/lib/offer/contingencies";
import type { ContingencySelection, Offer } from "@/lib/offer/types";

const STORAGE_KEY = "hod:offer:v1";

/** Build the default contingency map (all included, at their default windows). */
function defaultContingencies(): Record<ContingencyId, ContingencySelection> {
  return CONTINGENCIES.reduce(
    (acc, c) => {
      acc[c.id] = { included: true, days: c.defaultDays };
      return acc;
    },
    {} as Record<ContingencyId, ContingencySelection>,
  );
}

/** A fresh, empty offer worksheet with sensible defaults. */
export function emptyOffer(): Offer {
  return {
    price: 0,
    earnestMoney: 1,
    isPercent: true,
    financingType: "conventional",
    downPaymentPercent: 10,
    closingDate: "",
    possession: "At closing",
    fixturesIncluded: "",
    fixturesExcluded: "",
    closingCostPreference: "buyer-pays",
    contingencies: defaultContingencies(),
    concession: { type: "price-reduction", percent: 2.5 },
    updatedAt: "",
  };
}

function read(): Offer {
  if (typeof window === "undefined") return emptyOffer();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyOffer();
    const parsed = JSON.parse(raw) as Partial<Offer>;
    const base = emptyOffer();
    return {
      ...base,
      ...parsed,
      // Merge contingencies so a stored partial map still covers all ids.
      contingencies: { ...base.contingencies, ...(parsed.contingencies ?? {}) },
      concession: { ...base.concession, ...(parsed.concession ?? {}) },
    };
  } catch {
    return emptyOffer();
  }
}

/**
 * Persists the buyer's offer worksheet in localStorage (key `hod:offer:v1`).
 * Every write stamps `updatedAt` and fires the local-change event so the sync
 * layer can push to the cloud when signed in. Hydrates after mount to avoid an
 * SSR/client mismatch (see use-tracker.ts).
 */
export function useOffer() {
  const [offer, setOffer] = useState<Offer>(emptyOffer);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setOffer(read());
    setHydrated(true);
  }, []);

  // Keep in sync across tabs.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setOffer(read());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /** Apply a partial update, stamp updatedAt, persist, and emit. */
  const update = useCallback((patch: Partial<Offer>) => {
    setOffer((prev) => {
      const next: Offer = {
        ...prev,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* best-effort */
      }
      emitLocalChange();
      return next;
    });
  }, []);

  /** Update a single contingency selection. */
  const setContingency = useCallback(
    (id: ContingencyId, patch: Partial<ContingencySelection>) => {
      setOffer((prev) => {
        const current = prev.contingencies[id];
        const next: Offer = {
          ...prev,
          contingencies: {
            ...prev.contingencies,
            [id]: { ...current, ...patch },
          },
          updatedAt: new Date().toISOString(),
        };
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

  const reset = useCallback(() => {
    const fresh = { ...emptyOffer(), updatedAt: new Date().toISOString() };
    setOffer(fresh);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      /* best-effort */
    }
    emitLocalChange();
  }, []);

  return { offer, hydrated, update, setContingency, reset };
}
