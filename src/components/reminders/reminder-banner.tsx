"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTracker } from "@/hooks/use-tracker";
import { useAuth } from "@/hooks/use-auth";
import { computeMilestones, formatISO } from "@/lib/deadlines";
import {
  computeReminders,
  armedMilestoneCount,
  REMINDER_FOOTER,
} from "@/lib/reminders/schedule";
import { dueReminders } from "@/lib/reminders/due";

/**
 * In-app reminder banner (S1-R1) — the channel that ships FIRST and needs no key.
 * Driven PURELY by the pure deriver (`computeReminders` → `dueReminders`) on load
 * and on window focus, using a localStorage "last seen" watermark so a reminder
 * shows once and doesn't re-spam. Background push is the separate, gated channel.
 *
 * States:
 *  - signed-out → a disabled "Sign in to arm reminders" control with an
 *    explanatory line (not a dead button).
 *  - no dates → renders nothing (the cockpit's empty state covers first-run).
 *  - armed, nothing due → a quiet armed-count line.
 *  - reminders due → the process nudge(s) + a dismiss that advances the watermark.
 *
 * UPL: process nudges only; the {@link REMINDER_FOOTER} states the contract is the
 * source of truth.
 */

const WATERMARK_KEY = "hod:reminders:lastSeen:v1";
const DEAL_KEY = "local"; // single-deal device scope for the in-app path

function readWatermark(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(WATERMARK_KEY) ?? "";
  } catch {
    return "";
  }
}

export function ReminderBanner() {
  const { state: tracker, hydrated } = useTracker();
  const { enabled: authEnabled, user } = useAuth();
  const [lastSeen, setLastSeen] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const [now, setNow] = useState(() => formatISO(Date.now()));

  // Refresh the watermark + now on mount and on focus (load/focus deriver).
  useEffect(() => {
    setLastSeen(readWatermark());
    const onFocus = () => {
      setLastSeen(readWatermark());
      setNow(formatISO(Date.now()));
      setDismissed(false);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const milestones = useMemo(() => {
    if (!hydrated) return [];
    return computeMilestones({
      underContractDate: tracker.underContractDate,
      closingDate: tracker.closingDate,
      offsets: tracker.offsets,
    });
  }, [hydrated, tracker]);

  const reminders = useMemo(
    () => computeReminders(milestones, { dealId: DEAL_KEY, leadDays: [3, 1, 0] }),
    [milestones],
  );

  const due = useMemo(
    () => dueReminders(reminders, lastSeen, now),
    [reminders, lastSeen, now],
  );

  const armed = armedMilestoneCount(reminders);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(WATERMARK_KEY, now);
    } catch {
      /* best-effort */
    }
    setLastSeen(now);
    setDismissed(true);
  }, [now]);

  if (!hydrated) return null;

  // Signed-out gated state: explanatory, not a dead button.
  if (authEnabled && !user) {
    if (milestones.length === 0) return null;
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm text-ink-soft">
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="font-semibold text-ink-soft"
          >
            Sign in to arm reminders
          </button>{" "}
          — your dates are saved on this device. Reminders that follow you across
          devices need an account.
        </p>
        <Link
          href="/account"
          className="mt-1 inline-flex text-sm font-medium text-brand-700 hover:underline"
        >
          Sign in →
        </Link>
      </div>
    );
  }

  if (milestones.length === 0) return null;

  // Reminders currently due — the process nudge.
  if (due.length > 0 && !dismissed) {
    return (
      <div
        role="status"
        className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-900">
              {due.length === 1 ? "A deadline is coming up" : "Deadlines coming up"}
            </p>
            <ul className="mt-1 space-y-0.5 text-sm text-amber-900">
              {due.map((r) => (
                <li key={r.dedupeKey}>{r.label}.</li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 text-sm font-medium text-amber-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label="Dismiss reminders"
          >
            Got it
          </button>
        </div>
        <p className="mt-2 text-xs text-amber-800">{REMINDER_FOOTER}</p>
      </div>
    );
  }

  // Armed, nothing due right now. role="status" announces the armed count to AT.
  return (
    <div
      role="status"
      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5"
    >
      <p className="text-sm text-ink-soft">
        <span className="font-medium text-ink">
          {armed} reminder{armed === 1 ? "" : "s"} armed
        </span>{" "}
        — we&apos;ll nudge you before each deadline. {REMINDER_FOOTER}
      </p>
    </div>
  );
}
