"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useShowings } from "@/hooks/use-showings";
import {
  SHOWING_STATUSES,
  showingStatusLabels,
  type ShowingRecord,
  type ShowingStatus,
} from "@/lib/showings/types";

function StatusSelect({
  record,
  onChange,
}: {
  record: ShowingRecord;
  onChange: (status: ShowingStatus) => void;
}) {
  return (
    <label className="block">
      <span className="sr-only">Status for {record.address}</span>
      <select
        value={record.status}
        onChange={(e) => onChange(e.target.value as ShowingStatus)}
        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
      >
        {SHOWING_STATUSES.map((s) => (
          <option key={s} value={s}>
            {showingStatusLabels[s]}
          </option>
        ))}
      </select>
    </label>
  );
}

function RatingControl({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (rating: number | undefined) => void;
}) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? undefined : n)}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          aria-pressed={value !== undefined && n <= value}
          className={
            value !== undefined && n <= value
              ? "text-lg text-amber-500"
              : "text-lg text-slate-300 hover:text-amber-300"
          }
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ShowingCard({ record }: { record: ShowingRecord }) {
  const { setStatus, update, remove } = useShowings();

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            href={`/listings/${record.listingId}`}
            className="font-medium text-brand-700 hover:underline"
          >
            {record.address}
          </Link>
          <p className="text-sm text-ink-muted">
            {record.city}, {record.state}
          </p>
        </div>
        <StatusSelect
          record={record}
          onChange={(status) => setStatus(record.listingId, status)}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-muted">
            Scheduled date/time
          </span>
          <input
            type="datetime-local"
            value={record.scheduledAt ?? ""}
            onChange={(e) =>
              update(record.listingId, { scheduledAt: e.target.value })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </label>
        <div>
          <span className="mb-1 block text-xs font-medium text-ink-muted">
            Post-visit rating
          </span>
          <RatingControl
            value={record.rating}
            onChange={(rating) => update(record.listingId, { rating })}
          />
        </div>
      </div>

      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-medium text-ink-muted">
          Notes / pros &amp; cons
        </span>
        <textarea
          value={record.notes ?? ""}
          onChange={(e) => update(record.listingId, { notes: e.target.value })}
          rows={2}
          placeholder="Layout, condition, location notes — facts only."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      </label>

      <button
        type="button"
        onClick={() => remove(record.listingId)}
        className="mt-2 text-xs font-medium text-ink-muted hover:text-red-600"
      >
        Remove from tracker
      </button>
    </div>
  );
}

/** Dashboard list of tracked showings, grouped + filterable by area. */
export function ShowingsTracker() {
  const { records, hydrated } = useShowings();
  const [areaFilter, setAreaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ShowingStatus | "">("");

  const areas = useMemo(() => {
    const set = new Set(records.map((r) => `${r.city}, ${r.state}`));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [records]);

  const filtered = useMemo(
    () =>
      records.filter((r) => {
        if (areaFilter && `${r.city}, ${r.state}` !== areaFilter) return false;
        if (statusFilter && r.status !== statusFilter) return false;
        return true;
      }),
    [records, areaFilter, statusFilter],
  );

  const groups = useMemo(() => {
    const byArea = new Map<string, ShowingRecord[]>();
    for (const r of filtered) {
      const key = `${r.city}, ${r.state}`;
      const list = byArea.get(key) ?? [];
      list.push(r);
      byArea.set(key, list);
    }
    return [...byArea.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  if (!hydrated) {
    return (
      <div className="card" aria-hidden>
        <div className="h-6 w-40 rounded bg-slate-100" />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="card text-center">
        <p className="text-ink-soft">No showings tracked yet.</p>
        <p className="mt-1 text-sm text-ink-muted">
          Open a listing and choose &ldquo;Track this showing&rdquo; to start
          organizing your search.
        </p>
        <Link href="/listings" className="btn-primary mt-4 inline-flex">
          Browse listings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-muted">
            Area
          </span>
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            <option value="">All areas</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-muted">
            Status
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ShowingStatus | "")}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            <option value="">All statuses</option>
            {SHOWING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {showingStatusLabels[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-sm text-ink-muted" aria-live="polite">
        {filtered.length} showing{filtered.length === 1 ? "" : "s"}
        {areaFilter ? ` in ${areaFilter}` : ""}
      </p>

      {groups.map(([area, list]) => (
        <section key={area}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
            {area}{" "}
            <span className="font-normal text-ink-muted">({list.length})</span>
          </h2>
          <div className="grid gap-4">
            {list.map((r) => (
              <ShowingCard key={r.listingId} record={r} />
            ))}
          </div>
        </section>
      ))}

      {filtered.length === 0 ? (
        <p className="text-ink-muted">No showings match the current filters.</p>
      ) : null}
    </div>
  );
}
