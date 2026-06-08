"use client";

import { useMemo } from "react";
import { useStageTool } from "@/hooks/use-stage-tool";
import { formatUSD } from "@/lib/savings";
import { TrustCallout } from "@/components/trust-callout";
import {
  WIRE_FRAUD_CHECKLIST,
  checklistStatus,
  escrowStatus,
  type ChecklistItem,
  type EscrowTracker as EscrowTrackerState,
} from "@/lib/tools/escrow";
import { ToolDisclaimer } from "./tool-disclaimer";

interface EscrowState {
  checklist: ChecklistItem[];
  tracker: EscrowTrackerState;
}

const INITIAL: EscrowState = {
  checklist: WIRE_FRAUD_CHECKLIST.map((i) => ({ ...i, done: false })),
  tracker: { amount: 0, holder: "", dateSent: "", confirmationReceived: false },
};

const STATUS_LABEL: Record<ReturnType<typeof escrowStatus>, string> = {
  "not-sent": "Not sent yet",
  sent: "Sent — awaiting confirmation",
  confirmed: "Confirmed received",
};

export function EscrowTracker() {
  const { value, hydrated, save, reset } = useStageTool<EscrowState>(
    "escrow",
    INITIAL,
  );

  // Re-merge against the canonical checklist so a future checklist change still
  // shows new items (matched by id), preserving the buyer's checked state.
  const checklist = useMemo<ChecklistItem[]>(
    () =>
      WIRE_FRAUD_CHECKLIST.map((canonical) => {
        const saved = value.checklist.find((c) => c.id === canonical.id);
        return { ...canonical, done: saved?.done ?? false };
      }),
    [value.checklist],
  );

  const status = useMemo(() => checklistStatus(checklist), [checklist]);
  const escrow = escrowStatus(value.tracker);

  const toggle = (id: string) =>
    save((prev) => ({
      ...prev,
      checklist: WIRE_FRAUD_CHECKLIST.map((canonical) => {
        const saved = prev.checklist.find((c) => c.id === canonical.id);
        const done =
          canonical.id === id
            ? !(saved?.done ?? false)
            : saved?.done ?? false;
        return { ...canonical, done };
      }),
    }));

  const setTracker = (patch: Partial<EscrowTrackerState>) =>
    save((prev) => ({ ...prev, tracker: { ...prev.tracker, ...patch } }));

  if (!hydrated) return <p className="text-sm text-ink-muted">Loading…</p>;

  return (
    <div className="space-y-8">
      {/* Wire-fraud warning — trust-critical, kept first and prominent. */}
      <TrustCallout tone="danger" title="Wire fraud is the #1 closing scam">
        Criminals spoof your escrow/title company&apos;s email and send fake
        wiring instructions right before closing. Once you wire to the wrong
        account, the money is usually gone for good.{" "}
        <strong>
          Never trust wiring instructions you receive by email or text.
        </strong>{" "}
        Always verify by phone first, using the steps below.
      </TrustCallout>

      <section className="card space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">
            Forced verification checklist
          </h2>
          <span className="text-sm text-ink-soft">
            {status.completed}/{status.total} done
          </span>
        </div>

        <ul className="space-y-3">
          {checklist.map((item) => (
            <li key={item.id} className="flex gap-3">
              <input
                id={`wf-${item.id}`}
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300"
                checked={item.done}
                onChange={() => toggle(item.id)}
              />
              <label
                htmlFor={`wf-${item.id}`}
                className={`text-sm leading-relaxed ${
                  item.critical ? "font-medium text-ink" : "text-ink-soft"
                }`}
              >
                {item.critical ? (
                  <span className="mr-1 rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-red-800">
                    Verify by phone
                  </span>
                ) : null}
                {item.label}
              </label>
            </li>
          ))}
        </ul>

        {!status.criticalComplete ? (
          <TrustCallout tone="warning" title="Don't wire until you've verified by phone">
            Do not send any funds until you&apos;ve checked the{" "}
            <strong>&ldquo;Verify by phone&rdquo;</strong> step on an
            independently verified number.
          </TrustCallout>
        ) : (
          <TrustCallout tone="info" title="Verbal verification confirmed">
            You&apos;ve confirmed the wiring instructions verbally. Re-verify by
            phone if anything changes.
          </TrustCallout>
        )}
      </section>

      <section className="card space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Escrow deposit tracker</h2>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              escrow === "confirmed"
                ? "bg-emerald-100 text-emerald-800"
                : escrow === "sent"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-700"
            }`}
          >
            {STATUS_LABEL[escrow]}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">
              Earnest-money amount
            </span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={value.tracker.amount || ""}
              onChange={(e) => setTracker({ amount: Number(e.target.value) })}
            />
            {value.tracker.amount > 0 ? (
              <span className="mt-1 block text-xs text-ink-muted">
                {formatUSD(value.tracker.amount)}
              </span>
            ) : null}
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">
              Escrow / title holder
            </span>
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Company holding the funds"
              value={value.tracker.holder}
              onChange={(e) => setTracker({ holder: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">Date sent</span>
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={value.tracker.dateSent}
              onChange={(e) => setTracker({ dateSent: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-3 sm:mt-6">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300"
              checked={value.tracker.confirmationReceived}
              onChange={(e) =>
                setTracker({ confirmationReceived: e.target.checked })
              }
            />
            <span className="text-sm font-medium text-ink-soft">
              Holder confirmed receipt (by phone)
            </span>
          </label>
        </div>
      </section>

      <div className="flex justify-end">
        <button type="button" className="btn-secondary" onClick={reset}>
          Reset tool
        </button>
      </div>

      <ToolDisclaimer>
        This is a <strong>safety checklist, not a guarantee</strong> and not
        legal or financial advice. Always confirm wiring instructions directly
        with your escrow/title company by phone on a number you verified
        independently.
      </ToolDisclaimer>
    </div>
  );
}
