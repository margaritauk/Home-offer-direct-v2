/**
 * Device-local "export/import my whole deal" (#163, Sprint C1).
 *
 * GUARDRAIL: this is purely client-side. `collectDeal` snapshots everything the
 * buyer has saved in localStorage (via `readLocal`) into a self-describing JSON
 * bundle; `restoreDeal` writes a bundle back into localStorage (via `writeLocal`)
 * and fires `emitLocalChange()` so the rest of the app re-reads. NOTHING here
 * touches the network, Supabase, or email — the JSON file never leaves the
 * buyer's machine, and no account is required.
 *
 * The pure collect/restore/serialize functions live here and are fully tested.
 * The Blob/FileReader browser helpers live in `./export-browser` (not unit-tested
 * because they touch document/Blob/FileReader).
 */

import { readLocal, writeLocal, emitLocalChange } from "@/lib/sync/local-store";
import type { SyncData } from "@/lib/sync/types";

/** Bump when the on-disk shape changes in a backward-incompatible way. */
export const DEAL_SCHEMA_VERSION = 1;

/** A portable snapshot of a buyer's entire deal — what the .json file contains. */
export interface DealBundle {
  /** Schema version of the bundle (starts at 1). */
  schemaVersion: number;
  /** ISO timestamp of when the bundle was produced. */
  exportedAt: string;
  /** The full local data snapshot — mirrors the localStorage stores. */
  data: SyncData;
}

/**
 * Snapshot everything in local storage into a self-describing bundle.
 * No network. Safe to call SSR-side (readLocal returns empty defaults there).
 */
export function collectDeal(): DealBundle {
  return {
    schemaVersion: DEAL_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: readLocal(),
  };
}

/**
 * Validate a parsed bundle and write its data back into local storage, then
 * notify the sync layer. Tolerant of partial `data`: any missing slice falls
 * back to the current `readLocal()` defaults, so a bundle exported before a new
 * slice existed (or a hand-trimmed file) restores without crashing.
 *
 * Never throws — malformed input returns `{ ok: false, error }`.
 */
export function restoreDeal(
  bundle: unknown,
): { ok: true } | { ok: false; error: string } {
  if (typeof bundle !== "object" || bundle === null) {
    return { ok: false, error: "Not a valid deal file (expected a JSON object)." };
  }
  const b = bundle as Record<string, unknown>;
  if (typeof b.schemaVersion !== "number") {
    return { ok: false, error: "Not a valid deal file (missing schemaVersion)." };
  }
  if (typeof b.data !== "object" || b.data === null) {
    return { ok: false, error: "Not a valid deal file (missing deal data)." };
  }

  try {
    // Merge the parsed slices over a full default base so missing keys can't
    // crash writeLocal (which expects a complete SyncData).
    const base = readLocal();
    const parsed = b.data as Partial<SyncData>;
    const merged: SyncData = {
      progress: parsed.progress ?? base.progress,
      stateCode: parsed.stateCode !== undefined ? parsed.stateCode : base.stateCode,
      tracker: parsed.tracker ?? base.tracker,
      offer: parsed.offer !== undefined ? parsed.offer : base.offer,
      showings: parsed.showings ?? base.showings,
      offerStatus: parsed.offerStatus ?? base.offerStatus,
      stageTools: parsed.stageTools ?? base.stageTools,
    };
    writeLocal(merged);
    emitLocalChange();
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not restore this deal file." };
  }
}

/** Pretty-print a bundle for download. */
export function dealToJson(bundle: DealBundle): string {
  return JSON.stringify(bundle, null, 2);
}

/**
 * Safely parse a deal-bundle JSON string. Returns `null` on any parse failure or
 * if the result is not a bundle-shaped object (so callers can branch cleanly).
 */
export function parseDealJson(text: string): DealBundle | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const p = parsed as Record<string, unknown>;
  if (typeof p.schemaVersion !== "number") return null;
  if (typeof p.data !== "object" || p.data === null) return null;
  return parsed as DealBundle;
}
