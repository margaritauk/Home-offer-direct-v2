/**
 * Buyer tour-photo capture + downscale (UX continuity, Item 1 phase-2 / S0b).
 *
 * `useStageTool` persists to localStorage (~5 MB budget), so full-res phone
 * photos would blow the quota fast. This module:
 *  - downscales each photo client-side via a canvas (longest edge ~1280px,
 *    JPEG ~0.7) BEFORE storing, which ALSO drops EXIF/GPS as a side effect of
 *    re-encoding through the canvas — we never silently persist the buyer's
 *    location trail (called out, not "optimized away");
 *  - caps the count + total bytes per home and fails gracefully (a clear
 *    message, never a crash);
 *  - keeps the math/limits in PURE, unit-testable helpers; only the canvas
 *    encode touches the DOM.
 *
 * FHA/UDAP (enforced in the UI): the optional caption is screened through
 * `screenText` exactly like notes; photos are of the building, tagged "Your
 * photo" so they're never confused with the sample placeholder.
 */

import type { TourPhoto } from "./tour-scorecard";

/** Longest edge (px) the downscale targets. */
export const MAX_EDGE = 1280;
/** JPEG quality for the re-encode (drops EXIF/GPS as a side effect). */
export const JPEG_QUALITY = 0.7;
/** Max tour photos per home. */
export const MAX_PHOTOS_PER_HOME = 6;
/**
 * Approx max total bytes of photo data URLs per home, to respect the shared
 * localStorage quota. ~1.5 MB of base64 across all of a home's photos.
 */
export const MAX_PHOTO_BYTES_PER_HOME = 1_500_000;

/**
 * Compute the downscaled dimensions for a source image so its longest edge is
 * at most {@link MAX_EDGE}, preserving aspect ratio. Never upscales. PURE.
 */
export function fitDimensions(
  width: number,
  height: number,
  maxEdge: number = MAX_EDGE,
): { width: number; height: number } {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { width: 0, height: 0 };
  }
  const longest = Math.max(width, height);
  if (longest <= maxEdge) {
    return { width: Math.round(width), height: Math.round(height) };
  }
  const scale = maxEdge / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** Approx decoded byte length of a base64 data URL. PURE. */
export function dataUrlByteLength(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((b64.length * 3) / 4) - padding);
}

export interface PhotoBudget {
  /** Whether another photo of `nextBytes` fits within the count + size caps. */
  ok: boolean;
  /** A human reason when `ok` is false. */
  reason?: string;
}

/**
 * Whether a new photo fits the per-home count + total-bytes budget, given the
 * existing photos. PURE — the UI calls this before committing a downscaled
 * photo and shows `reason` inline when it can't.
 */
export function checkPhotoBudget(
  existing: TourPhoto[],
  nextBytes: number,
): PhotoBudget {
  if (existing.length >= MAX_PHOTOS_PER_HOME) {
    return {
      ok: false,
      reason: `You can attach up to ${MAX_PHOTOS_PER_HOME} photos per home.`,
    };
  }
  const used = existing.reduce((n, p) => n + dataUrlByteLength(p.dataUrl), 0);
  if (used + nextBytes > MAX_PHOTO_BYTES_PER_HOME) {
    return {
      ok: false,
      reason:
        "Not enough room to save this photo on this device. Remove one first.",
    };
  }
  return { ok: true };
}

/**
 * Downscale + re-encode an image File to a JPEG data URL via a canvas (browser
 * only). The canvas re-encode DROPS EXIF/GPS as a side effect. Rejects on a
 * decode failure so the caller can surface a graceful error.
 *
 * Not unit-tested directly (it needs a real canvas/Image); the math it relies on
 * ({@link fitDimensions}) is unit-tested in isolation.
 */
export async function downscaleImageFile(
  file: File,
  maxEdge: number = MAX_EDGE,
  quality: number = JPEG_QUALITY,
): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);
  const { width, height } = fitDimensions(
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    maxEdge,
  );
  if (width === 0 || height === 0) {
    throw new Error("Could not read that image.");
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process that image on this device.");
  ctx.drawImage(img, 0, 0, width, height);
  // toDataURL with image/jpeg re-encodes pixels only — EXIF/GPS is gone.
  return canvas.toDataURL("image/jpeg", quality);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load that image."));
    img.src = src;
  });
}
