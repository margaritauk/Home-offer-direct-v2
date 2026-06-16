"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useProgress } from "@/hooks/use-progress";
import { useShowings } from "@/hooks/use-showings";
import { useOfferStatus } from "@/hooks/use-offer-status";
import { useTracker } from "@/hooks/use-tracker";
import { totalTasks } from "@/lib/journey";
import { formatISO, type MilestoneStatus } from "@/lib/deadlines";
import { buildHomeRollups, type HomeRollup } from "@/lib/homes/rollup";
import {
  attentionCount,
  CONTRACT_GOVERNS_NOTE,
  rankNextActions,
  type NextAction,
} from "@/lib/cockpit/next-actions";
import { ReminderBanner } from "@/components/reminders/reminder-banner";

/**
 * CockpitBand (S1-R3) — the top band of `/dashboard` and the default landing for
 * returning signed-in users. Replaces the static `WhatsNext` strip with the 1–3
 * ranked things to do this week and why, composed PURELY from the shipped
 * selectors via {@link rankNextActions}.
 *
 * States (all from the AC): loading (skeleton until hydrated) · empty (first-run
 * prompt, never blank) · all-clear · default (ranked cards) · overdue (statusFor
 * tone + icon + text, never color alone) · per-card error (falls back to the
 * rollup's static next-action string — the cockpit never blanks the dashboard).
 *
 * UPL: process copy only; every date-bearing card carries the contract-governs
 * note. The R1 in-app reminder banner rides above the cards.
 */
export function CockpitBand() {
  const { completed, hydrated: pHydrated } = useProgress();
  const { showings, hydrated: sHydrated } = useShowings();
  const { offers, hydrated: oHydrated } = useOfferStatus();
  const { state: tracker, hydrated: tHydrated } = useTracker();

  const hydrated = pHydrated && sHydrated && oHydrated && tHydrated;
  const today = formatISO(Date.now());

  const { rollups, actions } = useMemo(() => {
    if (!hydrated) return { rollups: [] as HomeRollup[], actions: [] as NextAction[] };
    const built = buildHomeRollups({
      progress: completed,
      totalJourneyTasks: totalTasks(),
      showings,
      offers,
      tracker: {
        underContractDate: tracker.underContractDate,
        closingDate: tracker.closingDate,
        offsets: tracker.offsets,
        docs: tracker.docs,
      },
      today,
    });
    return { rollups: built, actions: rankNextActions(built, today) };
  }, [hydrated, completed, showings, offers, tracker, today]);

  // Loading: skeleton until hydrated, no SSR/client flash.
  if (!hydrated) {
    return (
      <section aria-label="Your next actions" className="space-y-4">
        <div className="grid gap-4" aria-hidden>
          {[0, 1].map((i) => (
            <div key={i} className="card">
              <div className="h-5 w-48 rounded bg-slate-100" />
              <div className="mt-3 h-3 w-full rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Empty: no deal data at all — first-run prompt, never a blank page.
  if (rollups.length === 0) {
    return (
      <section aria-label="Your next actions">
        <div className="rounded-xl border border-brand-200 bg-brand-50 px-5 py-6">
          <h2 className="text-lg font-semibold text-brand-900">
            Tell us where you are
          </h2>
          <p className="mt-1 text-sm text-brand-900">
            Once you start tracking a home, this cockpit shows the 1–3 things to do
            next and why. Pick up where you are.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/journey" className="btn-primary min-h-[44px]">
              Start: Get Ready →
            </Link>
            <Link href="/showings" className="btn-secondary min-h-[44px]">
              Track a home
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const attention = attentionCount(actions);

  // All-clear: rollups exist but nothing is ranked as needing action this week.
  if (actions.length === 0) {
    return (
      <section aria-label="Your next actions">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-6 shadow-sm">
          <h2 className="text-lg font-semibold">Nothing needs you this week</h2>
          <p className="mt-1 text-sm text-ink-soft">
            You&apos;re caught up. We&apos;ll surface the next deadline here as it
            approaches.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Your next actions" className="space-y-4">
      <ReminderBanner />

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">What needs you this week</h2>
        {/* aria-live ONLY on the attention count, not on every re-render. */}
        <p className="text-sm text-ink-soft" aria-live="polite">
          {attention === 0
            ? "Nothing urgent"
            : `${attention} need${attention === 1 ? "s" : ""} attention`}
        </p>
      </div>

      <ol className="space-y-3">
        {actions.map((action) => {
          // Per-card error fallback: if anything about this card is malformed,
          // degrade to the rollup's static next-action string rather than blank.
          const rollup = rollups.find((r) => r.listingId === action.id);
          if (!action.title) {
            return (
              <li key={action.id} className="card">
                <p className="text-sm text-ink-soft">
                  {rollup?.nextAction ?? "Open your deal to see what's next."}
                </p>
                <Link
                  href={rollup?.nextHref ?? "/dashboard"}
                  className="mt-2 inline-flex text-sm font-medium text-brand-700 hover:underline focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  Open →
                </Link>
              </li>
            );
          }
          return <ActionCard key={action.id} action={action} />;
        })}
      </ol>

      <p className="text-xs text-ink-muted">{CONTRACT_GOVERNS_NOTE}</p>
    </section>
  );
}

const URGENCY_CHIP: Record<
  MilestoneStatus,
  { label: string; icon: string; box: string }
> = {
  overdue: { label: "Overdue", icon: "⚠", box: "border-red-300 bg-red-50 text-red-900" },
  today: { label: "Due today", icon: "●", box: "border-amber-300 bg-amber-50 text-amber-900" },
  soon: { label: "Soon", icon: "›", box: "border-amber-200 bg-amber-50 text-amber-800" },
  upcoming: { label: "Upcoming", icon: "○", box: "border-slate-200 bg-slate-50 text-ink-soft" },
};

function ActionCard({ action }: { action: NextAction }) {
  const chip = action.urgency ? URGENCY_CHIP[action.urgency] : null;
  return (
    <li className="card">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-semibold">{action.title}</h3>
          <p className="mt-1 text-sm text-ink-soft">{action.why}</p>
        </div>
        {chip ? (
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${chip.box}`}
          >
            <span aria-hidden>{chip.icon}</span>
            {/* text label so urgency is never conveyed by color alone */}
            {chip.label}
            {action.dueISO ? (
              <span className="sr-only"> — due {action.dueISO}</span>
            ) : null}
          </span>
        ) : null}
      </div>
      <Link
        href={action.href}
        className="mt-3 inline-flex min-h-[44px] items-center text-sm font-semibold text-brand-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      >
        Go →
      </Link>
    </li>
  );
}
