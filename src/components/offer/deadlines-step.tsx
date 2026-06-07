"use client";

import { useMemo, useState } from "react";
import { formatISO, isValidDate, type DeadlineOffsets } from "@/lib/deadlines";
import { useTracker } from "@/hooks/use-tracker";
import {
  DEFAULT_EXPIRATION_HOURS,
  computeOfferMilestonesWithStatus,
  offerExpirationDate,
} from "@/lib/offer/deadlines";
import type { ContingencyId } from "@/lib/offer/contingencies";
import type { Offer } from "@/lib/offer/types";

/** Map offer contingency ids to the tracker's offset keys (where they overlap). */
const OFFSET_MAP: Partial<Record<ContingencyId, keyof DeadlineOffsets>> = {
  inspection: "inspectionContingencyDays",
  appraisal: "appraisalContingencyDays",
  financing: "financingContingencyDays",
  title: "titleReviewDays",
};

function formatHuman(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Offer deadlines & expiration step (issue #25).
 *
 * Previews the computed milestones (contingency windows + the editable offer
 * response/expiration clock) and writes the key dates into the existing tracker
 * store so they render on /tracker. Idempotent: writing simply overwrites the
 * tracker's dates/offsets rather than appending, so re-running updates in place.
 */
export function DeadlinesStep({ offer }: { offer: Offer }) {
  const { state, hydrated, setDates, setOffset } = useTracker();
  const [underContractDate, setUnderContractDate] = useState("");
  const [expirationHours, setExpirationHours] = useState(DEFAULT_EXPIRATION_HOURS);
  const [synced, setSynced] = useState(false);

  const today = formatISO(Date.now());

  const milestones = useMemo(
    () =>
      computeOfferMilestonesWithStatus(
        { offer, underContractDate, submittedDate: underContractDate, expirationHours },
        today,
      ),
    [offer, underContractDate, expirationHours, today],
  );

  const expiration = offerExpirationDate({
    offer,
    underContractDate,
    submittedDate: underContractDate,
    expirationHours,
  });

  const canSync = isValidDate(underContractDate) && isValidDate(offer.closingDate);

  function syncToTracker() {
    if (!canSync) return;
    // Idempotent: set dates + per-contingency offsets directly on the tracker.
    setDates({ underContractDate, closingDate: offer.closingDate });
    for (const [id, key] of Object.entries(OFFSET_MAP) as [
      ContingencyId,
      keyof DeadlineOffsets,
    ][]) {
      const sel = offer.contingencies[id];
      if (sel?.included) setOffset(key, sel.days);
    }
    setSynced(true);
    setTimeout(() => setSynced(false), 3000);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-soft">
        Once you know (or expect) your acceptance date, we&apos;ll turn your
        chosen windows into concrete deadlines — plus the response clock on the
        offer itself — and add them to your tracker so you never miss one.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-soft">
            Date under contract (expected)
          </span>
          <input
            type="date"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
            value={underContractDate}
            onChange={(e) => setUnderContractDate(e.target.value)}
            aria-label="Date under contract"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-soft">
            Offer response window (hours)
          </span>
          <input
            type="number"
            min={1}
            max={168}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
            value={expirationHours}
            onChange={(e) => setExpirationHours(Number(e.target.value))}
            aria-label="Offer response window in hours"
          />
          <span className="mt-1 block text-xs text-ink-muted">
            Offers typically expire in 24–72 hours unless extended.
          </span>
        </label>
      </div>

      {expiration ? (
        <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-900">
          <span className="font-semibold">Offer response deadline: </span>
          {formatHuman(expiration)} (about {expirationHours}h after submitting).
        </p>
      ) : null}

      {milestones.length > 0 ? (
        <ol className="space-y-2">
          {milestones.map((m) => (
            <li key={m.id} className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 p-3 text-sm">
              <div>
                <span className="font-medium text-ink">{m.label}</span>
                {m.critical ? (
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-ink-soft">
                    critical
                  </span>
                ) : null}
                <p className="mt-0.5 text-xs text-ink-muted">{m.description}</p>
              </div>
              <span className="flex-shrink-0 font-medium text-ink-soft">{formatHuman(m.date)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-ink-muted">
          Enter your under-contract date above to preview your deadlines.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn-primary"
          onClick={syncToTracker}
          disabled={!hydrated || !canSync}
        >
          Add these dates to my tracker
        </button>
        {synced ? <span className="text-sm font-medium text-green-700">Saved to your tracker.</span> : null}
      </div>
      {!canSync ? (
        <p className="text-xs text-ink-muted">
          Set a closing date (in the Dates step) and an under-contract date above
          to enable syncing.
        </p>
      ) : null}
      {hydrated && (state.underContractDate || state.closingDate) ? (
        <p className="text-xs text-ink-muted">
          Your tracker currently has dates set. Re-syncing here will update them.
        </p>
      ) : null}
    </div>
  );
}
