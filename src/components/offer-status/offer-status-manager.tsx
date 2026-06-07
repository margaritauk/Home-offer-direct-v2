"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useOfferStatus } from "@/hooks/use-offer-status";
import { useShowings } from "@/hooks/use-showings";
import { expirationInfo } from "@/lib/offer-status/reducer";
import {
  OFFER_STATUSES,
  offerStatusLabels,
  type OfferStatus,
  type OfferStatusRecord,
} from "@/lib/offer-status/types";
import { OfferStatusBadge } from "./offer-status-badge";

const URGENCY_CLASSES: Record<string, string> = {
  expired: "text-rose-700",
  today: "text-rose-600",
  soon: "text-amber-600",
  upcoming: "text-ink-muted",
  none: "text-ink-muted",
};

function ExpirationCountdown({ record }: { record: OfferStatusRecord }) {
  const info = expirationInfo(record);
  if (!info.hasExpiration) {
    return <span className="text-xs text-ink-muted">No expiration set</span>;
  }
  return (
    <span
      className={`text-xs font-medium ${URGENCY_CLASSES[info.urgency]}`}
      aria-live="polite"
    >
      {info.label}
      {info.isExpired ? " — needs action" : ""}
    </span>
  );
}

function OfferRow({ record }: { record: OfferStatusRecord }) {
  const { setStatus, patch, remove } = useOfferStatus();
  const { showings } = useShowings();
  const [note, setNote] = useState("");

  const showing = showings[record.listingId];
  const title = showing?.address ?? record.listingId;

  return (
    <div className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/listings/${record.listingId}`}
            className="font-medium text-brand-700 hover:underline"
          >
            {title}
          </Link>
          {showing ? (
            <p className="text-sm text-ink-muted">
              {showing.city}, {showing.state}
            </p>
          ) : null}
        </div>
        <OfferStatusBadge status={record.status} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-muted">
            Status
          </span>
          <select
            value={record.status}
            onChange={(e) =>
              setStatus(record.listingId, e.target.value as OfferStatus)
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            {OFFER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {offerStatusLabels[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-muted">
            Sent date
          </span>
          <input
            type="date"
            value={record.sentAt ? record.sentAt.slice(0, 10) : ""}
            onChange={(e) =>
              patch(record.listingId, { sentAt: e.target.value })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-muted">
            Expires (response window)
          </span>
          <input
            type="date"
            value={record.expiresAt ? record.expiresAt.slice(0, 10) : ""}
            onChange={(e) =>
              patch(record.listingId, { expiresAt: e.target.value })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </label>
        <div className="flex items-end">
          <ExpirationCountdown record={record} />
        </div>
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const text = note.trim();
          if (!text) return;
          patch(record.listingId, { note: text });
          setNote("");
        }}
      >
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note for this status change…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <button type="submit" className="btn-secondary px-3 py-2 text-sm">
          Add note
        </button>
      </form>

      {record.notes && record.notes.length > 0 ? (
        <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
          {[...record.notes].reverse().map((n, i) => (
            <li key={`${n.at}-${i}`} className="text-xs text-ink-muted">
              <span className="font-medium text-ink">
                {offerStatusLabels[n.status]}
              </span>{" "}
              <span>· {new Date(n.at).toLocaleDateString()}</span>
              <span className="block">{n.text}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        onClick={() => remove(record.listingId)}
        className="mt-3 text-xs font-medium text-ink-muted hover:text-red-600"
      >
        Remove offer
      </button>
    </div>
  );
}

/**
 * Standalone manager for the offer-status pipeline (#39). Lets the buyer create
 * an offer record per tracked home, advance its status, set sent/expiry dates,
 * and keep per-change notes. Cloud sync of `hod:offer-status:v1` is wired by the
 * lead.
 */
export function OfferStatusManager() {
  const { records, hydrated, upsert } = useOfferStatus();
  const { records: showingRecords } = useShowings();
  const [selected, setSelected] = useState("");

  // Homes that are tracked as showings but have no offer record yet.
  const addable = useMemo(() => {
    const withOffers = new Set(records.map((r) => r.listingId));
    return showingRecords.filter((s) => !withOffers.has(s.listingId));
  }, [records, showingRecords]);

  if (!hydrated) {
    return (
      <div className="card" aria-hidden>
        <div className="h-6 w-40 rounded bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold">Start tracking an offer</h2>
        <p className="mt-1 text-sm text-ink-muted">
          This is a personal worksheet to track where each offer stands — not a
          contract or legal advice.
        </p>
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!selected) return;
            upsert({ listingId: selected, status: "draft" });
            setSelected("");
          }}
        >
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="min-w-[16rem] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            <option value="">
              {addable.length
                ? "Choose a tracked home…"
                : "No untracked homes available"}
            </option>
            {addable.map((s) => (
              <option key={s.listingId} value={s.listingId}>
                {s.address} — {s.city}, {s.state}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="btn-primary"
            disabled={!selected}
          >
            Add offer
          </button>
        </form>
        {showingRecords.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">
            Track a home in the{" "}
            <Link href="/showings" className="text-brand-700 hover:underline">
              showings tracker
            </Link>{" "}
            first.
          </p>
        ) : null}
      </div>

      {records.length === 0 ? (
        <div className="card text-center">
          <p className="text-ink-soft">No offers tracked yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {records.map((r) => (
            <OfferRow key={r.listingId} record={r} />
          ))}
        </div>
      )}
    </div>
  );
}
