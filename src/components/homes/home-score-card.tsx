"use client";

import { useState } from "react";
import { ListingImage } from "@/components/listing-image";
import { TourPhotos } from "@/components/homes/tour-photos";
import { screenText } from "@/lib/ai/screening";
import { formatUSD } from "@/lib/savings";
import { propertyTypeLabels } from "@/lib/listings/types";
import {
  DEFAULT_CRITERIA,
  type ScoredHome,
  type TourPhoto,
} from "@/lib/tools/tour-scorecard";

/**
 * The reusable scoring-card body (UX continuity, Item 1 phase-2 / S0b): the
 * photo/facts (or buyer-photo) header, the native-radio rubric, the screened
 * notes textarea, and the buyer's tour photos. Shared by the scorecard tool and
 * the `/listings/[id]` INLINE scoring panel so a buyer can score the home they're
 * viewing without leaving the page.
 *
 * FHA: rubric criteria are property facts; notes AND photo captions both route
 * through `screenText`. UDAP: a buyer photo is tagged "Your photo"; the
 * placeholder keeps its "Sample photo" badge — never co-present on one image.
 */
const RATINGS = [1, 2, 3, 4, 5];

/** The facts row drawn from a home's snapshot. */
function SnapshotFacts({
  snapshot,
}: {
  snapshot: NonNullable<ScoredHome["snapshot"]>;
}) {
  const facts: string[] = [];
  if (typeof snapshot.beds === "number") facts.push(`${snapshot.beds} bd`);
  if (typeof snapshot.baths === "number") facts.push(`${snapshot.baths} ba`);
  if (typeof snapshot.sqft === "number")
    facts.push(`${snapshot.sqft.toLocaleString()} sqft`);
  if (snapshot.propertyType) facts.push(propertyTypeLabels[snapshot.propertyType]);
  return (
    <div className="text-sm text-ink-soft">
      {[snapshot.city, snapshot.state].filter(Boolean).join(", ")}
      {(snapshot.city || snapshot.state) && facts.length > 0 ? " · " : ""}
      {facts.join(" · ")}
    </div>
  );
}

export interface HomeScoreCardProps {
  home: ScoredHome;
  onLabel?: (label: string) => void;
  onRating: (criterionId: string, rating: number) => void;
  onNotes: (notes: string) => void;
  onTourPhotos: (photos: TourPhoto[]) => void;
  onRemove?: () => void;
  /** Hide the card chrome (used inline on the detail page). */
  bare?: boolean;
}

export function HomeScoreCard({
  home,
  onLabel,
  onRating,
  onNotes,
  onTourPhotos,
  onRemove,
  bare = false,
}: HomeScoreCardProps) {
  // Local note state so screening runs on blur (not every keystroke).
  const [note, setNote] = useState(home.notes ?? "");

  const commitNote = () => {
    const screened = screenText(note).text;
    if (screened !== note) setNote(screened);
    onNotes(screened);
  };

  const linked = Boolean(home.snapshot);
  const buyerPhoto = home.tourPhotos?.[0];
  const headerLabel = home.snapshot?.address || home.label || "this home";

  return (
    <div className={bare ? "space-y-5" : "card space-y-5"}>
      {buyerPhoto ? (
        // Buyer's own photo promoted to the header (their photo is the real one).
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-4">
            <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={buyerPhoto.dataUrl}
                alt={`${headerLabel} — your tour photo`}
                className="h-full w-full object-cover"
              />
              <span className="absolute left-1 top-1 rounded bg-black/60 px-1 py-0.5 text-[10px] font-medium text-white">
                Your photo
              </span>
            </div>
            <div className="min-w-0">
              {typeof home.snapshot?.price === "number" ? (
                <p className="text-lg font-bold text-ink">
                  {formatUSD(home.snapshot.price)}
                </p>
              ) : null}
              <p className="truncate font-medium text-ink">{headerLabel}</p>
              {home.snapshot ? <SnapshotFacts snapshot={home.snapshot} /> : null}
            </div>
          </div>
          {onRemove ? (
            <button
              type="button"
              className="btn-secondary shrink-0"
              onClick={onRemove}
              aria-label={`Remove ${headerLabel}`}
            >
              Remove
            </button>
          ) : null}
        </div>
      ) : linked && home.snapshot ? (
        // Linked snapshot header: placeholder photo + facts.
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-4">
            <ListingImage
              id={home.listingId ?? home.id}
              propertyType={home.snapshot.propertyType ?? "single-family"}
              className="h-20 w-28 shrink-0 rounded-lg"
            />
            <div className="min-w-0">
              {typeof home.snapshot.price === "number" ? (
                <p className="text-lg font-bold text-ink">
                  {formatUSD(home.snapshot.price)}
                </p>
              ) : null}
              <p className="truncate font-medium text-ink">
                {home.snapshot.address}
              </p>
              <SnapshotFacts snapshot={home.snapshot} />
              {home.listingId ? (
                <a
                  href={`/listings/${home.listingId}`}
                  className="mt-1 inline-block text-sm font-medium text-brand-700 hover:underline"
                >
                  View listing →
                </a>
              ) : null}
            </div>
          </div>
          {onRemove ? (
            <button
              type="button"
              className="btn-secondary shrink-0"
              onClick={onRemove}
              aria-label={`Remove ${home.snapshot.address}`}
            >
              Remove
            </button>
          ) : null}
        </div>
      ) : (
        // Manual header: an editable address input (the only place typing remains).
        <div className="flex items-start justify-between gap-4">
          <label className="block flex-1">
            <span className="text-sm font-medium text-ink-soft">Home / address</span>
            <input
              type="text"
              className="field mt-1"
              placeholder="123 Maple St"
              value={home.label}
              onChange={(e) => onLabel?.(e.target.value)}
            />
          </label>
          {onRemove ? (
            <button
              type="button"
              className="btn-secondary mt-6 shrink-0"
              onClick={onRemove}
              aria-label={`Remove ${home.label || "home"}`}
            >
              Remove
            </button>
          ) : null}
        </div>
      )}

      <div className="space-y-3">
        {DEFAULT_CRITERIA.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-2"
          >
            <span className="text-sm">
              <span className="font-medium text-ink">{c.label}</span>
              {c.hint ? (
                <span className="ml-2 text-xs text-ink-muted">{c.hint}</span>
              ) : null}
            </span>
            <div
              className="flex gap-1"
              role="radiogroup"
              aria-label={`${c.label} rating`}
            >
              {RATINGS.map((r) => {
                const active = (home.ratings[c.id] ?? 0) === r;
                const inputId = `rating-${home.id}-${c.id}-${r}`;
                return (
                  <span key={r}>
                    <input
                      type="radio"
                      id={inputId}
                      name={`rating-${home.id}-${c.id}`}
                      value={r}
                      checked={active}
                      aria-label={`${c.label} — ${r}`}
                      onChange={() => onRating(c.id, r)}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor={inputId}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-semibold text-ink transition hover:border-brand-300 peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-1"
                    >
                      {r}
                    </label>
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <label className="block">
        <span className="text-sm font-medium text-ink-soft">Notes (facts only)</span>
        <textarea
          className="field mt-1"
          rows={2}
          placeholder="Roof recently replaced; busy street; small kitchen…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={commitNote}
        />
      </label>

      <div className="border-t border-slate-100 pt-4">
        <p className="text-sm font-medium text-ink-soft">Your tour photos</p>
        <p className="mb-2 text-xs text-ink-muted">
          The photos that matter are the ones you took — captions are screened
          for fair-housing safety, just like notes.
        </p>
        <TourPhotos
          photos={home.tourPhotos ?? []}
          homeLabel={headerLabel}
          onChange={onTourPhotos}
        />
      </div>
    </div>
  );
}
