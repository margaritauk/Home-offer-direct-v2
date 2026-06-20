"use client";

import { useRef, useState } from "react";
import { screenText } from "@/lib/ai/screening";
import {
  checkPhotoBudget,
  dataUrlByteLength,
  downscaleImageFile,
  MAX_PHOTOS_PER_HOME,
} from "@/lib/tools/tour-photos";
import type { TourPhoto } from "@/lib/tools/tour-scorecard";

/**
 * Buyer's-own tour photos for a scored home (UX continuity, Item 1 phase-2 /
 * S0b). A camera-first upload (`capture="environment"` opens the rear camera on
 * mobile) that client-side downscales + re-encodes each photo (dropping EXIF/GPS
 * as a side effect — see {@link downscaleImageFile}), respects a per-home
 * count/size budget, and screens optional captions through `screenText`.
 *
 * The buyer's photo is "Your photo" (provenance honest — never confused with the
 * "Sample photo" placeholder). Delete is ≥44px. Fails gracefully: a too-big /
 * unreadable photo shows an inline message, never a crash.
 */
function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `photo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function TourPhotos({
  photos,
  homeLabel,
  onChange,
}: {
  photos: TourPhoto[];
  /** The home's address/label, for accessible alt text. */
  homeLabel: string;
  onChange: (next: TourPhoto[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setBusy(true);
    let current = photos;
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        let dataUrl: string;
        try {
          dataUrl = await downscaleImageFile(file);
        } catch {
          setError("Couldn't read one of those photos. Try another.");
          continue;
        }
        const budget = checkPhotoBudget(current, dataUrlByteLength(dataUrl));
        if (!budget.ok) {
          setError(budget.reason ?? "Couldn't save that photo on this device.");
          break;
        }
        current = [
          ...current,
          { id: newId(), dataUrl, addedAt: new Date().toISOString() },
        ];
      }
      onChange(current);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const setCaption = (id: string, raw: string) => {
    const caption = screenText(raw).text;
    onChange(
      photos.map((p) => (p.id === id ? { ...p, caption } : p)),
    );
  };

  const remove = (id: string) => {
    setError(null);
    onChange(photos.filter((p) => p.id !== id));
  };

  const atCap = photos.length >= MAX_PHOTOS_PER_HOME;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn-secondary inline-flex min-h-[44px] items-center"
          onClick={() => inputRef.current?.click()}
          disabled={busy || atCap}
        >
          {busy ? "Adding…" : "+ Add tour photos"}
        </button>
        <span className="text-xs text-ink-muted">
          Your own photos. We shrink them on this device and drop location data —
          up to {MAX_PHOTOS_PER_HOME}.
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="sr-only"
          aria-label="Add tour photos"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="status">
          {error}
        </p>
      ) : null}

      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p, i) => (
            <li key={p.id} className="space-y-1">
              <div className="relative overflow-hidden rounded-lg border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.dataUrl}
                  alt={p.caption || `${homeLabel} tour photo ${i + 1}`}
                  className="aspect-[4/3] w-full object-cover"
                />
                <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Your photo
                </span>
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  aria-label={`Remove tour photo ${i + 1}`}
                  className="absolute right-1 top-1 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-ink-soft hover:text-red-600"
                >
                  ✕
                </button>
              </div>
              <label className="block">
                <span className="sr-only">Caption for tour photo {i + 1}</span>
                <input
                  type="text"
                  className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs"
                  placeholder="Caption (optional)"
                  defaultValue={p.caption ?? ""}
                  onBlur={(e) => setCaption(p.id, e.target.value)}
                />
              </label>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
