/**
 * Pure offer-status reducer + expiration helpers (issue #39).
 *
 * No I/O — the hook (use-offer-status) owns persistence; everything here is a
 * pure function over the {@link OfferStatusMap} so it can be unit-tested in
 * isolation. Expiration reuses the date engine in `@/lib/deadlines` (statusFor /
 * daysBetween) rather than re-implementing calendar math.
 */

import { daysBetween, formatISO, statusFor } from "@/lib/deadlines";
import {
  type OfferStatus,
  type OfferStatusMap,
  type OfferStatusNote,
  type OfferStatusRecord,
} from "./types";

/** Fields a caller may supply when first tracking an offer for a home. */
export interface UpsertOfferInput {
  listingId: string;
  /** Defaults to "draft". */
  status?: OfferStatus;
  sentAt?: string;
  expiresAt?: string;
  note?: string;
}

/** Mutable fields on an existing record. */
export interface OfferStatusPatch {
  status?: OfferStatus;
  sentAt?: string;
  expiresAt?: string;
  /** When provided, appended to the record's note history. */
  note?: string;
}

export type OfferStatusAction =
  | { type: "upsert"; input: UpsertOfferInput; now?: string }
  | { type: "patch"; listingId: string; patch: OfferStatusPatch; now?: string }
  | {
      type: "setStatus";
      listingId: string;
      status: OfferStatus;
      note?: string;
      now?: string;
    }
  | { type: "remove"; listingId: string }
  | { type: "clear" };

function nowISO(now?: string): string {
  return now ?? new Date().toISOString();
}

function appendNote(
  record: OfferStatusRecord,
  text: string | undefined,
  status: OfferStatus,
  at: string,
): OfferStatusNote[] | undefined {
  const trimmed = text?.trim();
  if (!trimmed) return record.notes;
  const note: OfferStatusNote = { at, status, text: trimmed };
  return [...(record.notes ?? []), note];
}

/**
 * The single source of truth for how the offer-status map mutates. Always
 * returns a new map (or the same reference when nothing changed) so React state
 * updates stay predictable.
 */
export function offerStatusReducer(
  state: OfferStatusMap,
  action: OfferStatusAction,
): OfferStatusMap {
  switch (action.type) {
    case "upsert": {
      const { input } = action;
      const at = nowISO(action.now);
      const existing = state[input.listingId];
      if (existing) {
        // Treat as a patch so re-tracking never wipes history.
        return offerStatusReducer(state, {
          type: "patch",
          listingId: input.listingId,
          patch: {
            status: input.status,
            sentAt: input.sentAt,
            expiresAt: input.expiresAt,
            note: input.note,
          },
          now: at,
        });
      }
      const status = input.status ?? "draft";
      const base: OfferStatusRecord = {
        listingId: input.listingId,
        status,
        sentAt: input.sentAt,
        expiresAt: input.expiresAt,
        createdAt: at,
        updatedAt: at,
      };
      const notes = appendNote(base, input.note, status, at);
      return {
        ...state,
        [input.listingId]: notes ? { ...base, notes } : base,
      };
    }

    case "patch": {
      const existing = state[action.listingId];
      if (!existing) return state;
      const at = nowISO(action.now);
      const { patch } = action;
      const nextStatus = patch.status ?? existing.status;
      const next: OfferStatusRecord = {
        ...existing,
        status: nextStatus,
        updatedAt: at,
      };
      if (patch.sentAt !== undefined) next.sentAt = patch.sentAt;
      if (patch.expiresAt !== undefined) next.expiresAt = patch.expiresAt;
      next.notes = appendNote(existing, patch.note, nextStatus, at);
      return { ...state, [action.listingId]: next };
    }

    case "setStatus": {
      const existing = state[action.listingId];
      if (!existing) return state;
      return offerStatusReducer(state, {
        type: "patch",
        listingId: action.listingId,
        patch: { status: action.status, note: action.note },
        now: action.now,
      });
    }

    case "remove": {
      if (!state[action.listingId]) return state;
      const next = { ...state };
      delete next[action.listingId];
      return next;
    }

    case "clear":
      return {};

    default:
      return state;
  }
}

/* ------------------------------------------------------------------ *
 * Expiration clock                                                    *
 * ------------------------------------------------------------------ */

export type ExpirationUrgency =
  | "none" // no expiration set / resolved
  | "expired" // window already closed
  | "today" // closes today
  | "soon" // within the soon window
  | "upcoming"; // further out

export interface ExpirationInfo {
  /** Whether an expiration date is set on the record. */
  hasExpiration: boolean;
  /** Whole days until expiration (negative once past). Null when unset. */
  daysRemaining: number | null;
  urgency: ExpirationUrgency;
  /** True once the window has closed (and the offer isn't already resolved). */
  isExpired: boolean;
  /** Short human label, e.g. "2 days left" / "Expired 1 day ago". */
  label: string;
}

const NO_EXPIRATION: ExpirationInfo = {
  hasExpiration: false,
  daysRemaining: null,
  urgency: "none",
  isExpired: false,
  label: "No expiration set",
};

/** Extract the calendar (YYYY-MM-DD) part of an ISO datetime. */
function toISODate(value: string): string {
  return value.length >= 10 ? value.slice(0, 10) : value;
}

/**
 * Compute the expiration countdown for a record relative to a reference date.
 *
 * @param record  the offer-status record (or its expiresAt-bearing subset)
 * @param today   reference date; accepts a YYYY-MM-DD or full ISO string.
 *                Defaults to the current date.
 * @param soonWindowDays  inclusive day window that counts as "soon" (default 3).
 */
export function expirationInfo(
  record: Pick<OfferStatusRecord, "expiresAt" | "status">,
  today: string = formatISO(Date.now()),
  soonWindowDays = 3,
): ExpirationInfo {
  if (!record.expiresAt) return NO_EXPIRATION;

  const expiresDate = toISODate(record.expiresAt);
  const todayDate = toISODate(today);
  const days = daysBetween(todayDate, expiresDate);

  if (Number.isNaN(days)) return NO_EXPIRATION;

  // A resolved offer (accepted/rejected/already-expired) no longer counts down.
  const resolved =
    record.status === "accepted" ||
    record.status === "rejected" ||
    record.status === "expired";

  const milestoneStatus = statusFor(expiresDate, todayDate, soonWindowDays);
  const isExpired = milestoneStatus === "overdue" && !resolved;

  let urgency: ExpirationUrgency;
  if (resolved) urgency = "none";
  else if (milestoneStatus === "overdue") urgency = "expired";
  else if (milestoneStatus === "today") urgency = "today";
  else if (milestoneStatus === "soon") urgency = "soon";
  else urgency = "upcoming";

  return {
    hasExpiration: true,
    daysRemaining: days,
    urgency,
    isExpired,
    label: expirationLabel(days),
  };
}

function expirationLabel(days: number): string {
  if (days === 0) return "Expires today";
  if (days === 1) return "1 day left";
  if (days > 1) return `${days} days left`;
  const past = Math.abs(days);
  return past === 1 ? "Expired 1 day ago" : `Expired ${past} days ago`;
}

/**
 * Returns true when the record's window has lapsed but its status hasn't been
 * moved to a terminal outcome yet — i.e. the UI/sync should offer to flip it to
 * "expired".
 */
export function shouldAutoExpire(
  record: Pick<OfferStatusRecord, "expiresAt" | "status">,
  today?: string,
): boolean {
  return expirationInfo(record, today).isExpired;
}
