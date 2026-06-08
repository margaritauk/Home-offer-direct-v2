import { defaultOffsets, type DeadlineOffsets } from "@/lib/deadlines";
import type { TrackerState } from "@/hooks/use-tracker";
import type { Offer } from "@/lib/offer/types";
import type { ShowingMap } from "@/lib/showings/types";
import type { OfferStatusMap } from "@/lib/offer-status/types";
import type { SyncData } from "./types";

/**
 * Merge two completion maps (progress or document statuses). Both store only
 * `true` values, so the union — anything done in either side — is correct.
 */
export function mergeFlags(
  a: Record<string, boolean>,
  b: Record<string, boolean>,
): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const k of Object.keys(a)) if (a[k]) out[k] = true;
  for (const k of Object.keys(b)) if (b[k]) out[k] = true;
  return out;
}

function mergeTracker(local: TrackerState, remote: TrackerState): TrackerState {
  // If the account already has deal dates, treat it as the source for dates and
  // offsets; otherwise adopt whatever is on this device. Documents always union.
  const remoteHasDates = Boolean(remote.underContractDate || remote.closingDate);
  const base = remoteHasDates ? remote : local;
  return {
    underContractDate: base.underContractDate ?? "",
    closingDate: base.closingDate ?? "",
    offsets: { ...defaultOffsets, ...(base.offsets as Partial<DeadlineOffsets>) },
    docs: mergeFlags(local.docs ?? {}, remote.docs ?? {}),
  };
}

/** The offer with the more recent `updatedAt` wins; null-safe. */
export function mergeOffer(local: Offer | null, remote: Offer | null): Offer | null {
  if (!local) return remote;
  if (!remote) return local;
  return (remote.updatedAt ?? "") >= (local.updatedAt ?? "") ? remote : local;
}

/** Union two id-keyed maps of records; per id, the newer `updatedAt` wins. */
function mergeByUpdatedAt<T extends { updatedAt?: string }>(
  local: Record<string, T>,
  remote: Record<string, T>,
): Record<string, T> {
  const out: Record<string, T> = { ...(local ?? {}) };
  for (const [id, rec] of Object.entries(remote ?? {})) {
    const cur = out[id];
    if (!cur || (rec.updatedAt ?? "") >= (cur.updatedAt ?? "")) out[id] = rec;
  }
  return out;
}

/** Union showings by listing id; per id, the more recently updated record wins. */
export function mergeShowings(local: ShowingMap, remote: ShowingMap): ShowingMap {
  return mergeByUpdatedAt(local, remote);
}

/** Union offer-status records by listing id; per id, the newer record wins. */
export function mergeOfferStatus(
  local: OfferStatusMap,
  remote: OfferStatusMap,
): OfferStatusMap {
  return mergeByUpdatedAt(local, remote);
}

/**
 * Union per-stage tool blobs by toolId. The blobs are opaque (no per-tool
 * timestamp), so on a key conflict the account (remote) wins while local fills
 * any gaps — consistent with how scalars like stateCode resolve on first
 * sign-in. A brand-new account has none, so the device's tools carry over.
 */
export function mergeStageTools(
  local: Record<string, unknown>,
  remote: Record<string, unknown>,
): Record<string, unknown> {
  return { ...(local ?? {}), ...(remote ?? {}) };
}

/**
 * Merge the device's local data with the account's remote data. Used on first
 * sign-in so a buyer never loses progress they made before creating an account.
 * Returns `local` unchanged when there is no remote row yet.
 */
export function mergeSyncData(local: SyncData, remote: SyncData | null): SyncData {
  if (!remote) return local;
  return {
    progress: mergeFlags(local.progress, remote.progress),
    stateCode: remote.stateCode ?? local.stateCode,
    tracker: mergeTracker(local.tracker, remote.tracker),
    offer: mergeOffer(local.offer, remote.offer),
    showings: mergeShowings(local.showings, remote.showings),
    offerStatus: mergeOfferStatus(local.offerStatus, remote.offerStatus),
    stageTools: mergeStageTools(local.stageTools, remote.stageTools),
  };
}
