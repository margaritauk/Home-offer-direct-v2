"use client";

import { useMemo, useState } from "react";
import { useStageTool } from "@/hooks/use-stage-tool";
import { screenText } from "@/lib/ai/screening";
import { formatUSD } from "@/lib/savings";
import { PropertyField } from "@/components/homes/property-field";
import { TrustCallout } from "@/components/trust-callout";
import {
  ROUND_STATUSES,
  currentTerms,
  type Party,
  type Round,
  type RoundStatus,
} from "@/lib/tools/counter-offer";
import { ToolDisclaimer } from "./tool-disclaimer";

interface CounterState {
  /** Optional label for the home this negotiation is about (#112). */
  property?: string;
  /** Private walk-away max price — never shared. */
  maxPrice: number;
  rounds: Round[];
}

const INITIAL: CounterState = { property: "", maxPrice: 0, rounds: [] };

const STATUS_LABEL: Record<RoundStatus, string> = {
  sent: "Sent",
  received: "Received",
  accepted: "Accepted",
  rejected: "Rejected",
  countered: "Countered",
};

function newRound(): Round {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `round-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    who: "buyer",
    price: 0,
    termChanges: "",
    date: new Date().toISOString().slice(0, 10),
    status: "sent",
  };
}

export function CounterOfferTracker() {
  const { value, hydrated, save, reset } = useStageTool<CounterState>(
    "counter-offer",
    INITIAL,
  );

  const terms = useMemo(() => currentTerms(value.rounds), [value.rounds]);

  const overMax =
    value.maxPrice > 0 &&
    terms.livePrice !== null &&
    terms.livePrice > value.maxPrice;

  const addRound = () =>
    save((prev) => ({ ...prev, rounds: [...prev.rounds, newRound()] }));
  const removeRound = (id: string) =>
    save((prev) => ({ ...prev, rounds: prev.rounds.filter((r) => r.id !== id) }));
  const patchRound = (id: string, patch: Partial<Round>) =>
    save((prev) => ({
      ...prev,
      rounds: prev.rounds.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));

  if (!hydrated) return <p className="text-sm text-ink-muted">Loading…</p>;

  return (
    <div className="space-y-8">
      <PropertyField
        value={value.property ?? ""}
        onChange={(property) => save((prev) => ({ ...prev, property }))}
      />

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">Your walk-away max (private)</h2>
        <TrustCallout tone="warning" title="Keep this number to yourself">
          This is your private planning anchor. Never share your max with the
          seller or their agent — once they know it, you lose your negotiating
          room.
        </TrustCallout>
        <label className="block sm:max-w-xs">
          <span className="text-sm font-medium text-ink-soft">
            Maximum price you&apos;ll pay
          </span>
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={value.maxPrice || ""}
            onChange={(e) => save((prev) => ({ ...prev, maxPrice: Number(e.target.value) }))}
          />
        </label>
        {overMax ? (
          <p className="text-sm font-medium text-red-700">
            The live price ({formatUSD(terms.livePrice ?? 0)}) is above your max
            of {formatUSD(value.maxPrice)}.
          </p>
        ) : null}
      </section>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Rounds</h2>
          <div className="flex gap-2">
            <button type="button" className="btn-primary" onClick={addRound}>
              Add a round
            </button>
            {value.rounds.length > 0 ? (
              <button type="button" className="btn-secondary" onClick={reset}>
                Clear all
              </button>
            ) : null}
          </div>
        </div>

        {value.rounds.length === 0 ? (
          <div className="card text-center text-sm text-ink-soft">
            Log each round of the back-and-forth to see the current live terms.
          </div>
        ) : (
          <div className="space-y-3">
            {value.rounds.map((round, index) => (
              <RoundCard
                key={round.id}
                index={index + 1}
                round={round}
                onPatch={(patch) => patchRound(round.id, patch)}
                onRemove={() => removeRound(round.id)}
              />
            ))}
          </div>
        )}
      </div>

      {terms.roundCount > 0 ? (
        <section
          aria-label="Current live terms"
          className="rounded-xl bg-brand-600 p-6 text-white"
        >
          <p className="text-sm font-medium text-brand-100">Current live terms</p>
          <p className="mt-1 text-3xl font-bold">
            {terms.livePrice !== null ? formatUSD(terms.livePrice) : "—"}
          </p>
          <p className="mt-2 text-sm text-brand-100">
            {terms.accepted
              ? "Accepted — the negotiation has landed."
              : terms.rejected
                ? "The latest round was rejected."
                : terms.ballWith
                  ? `The ball is with the ${terms.ballWith}.`
                  : "Awaiting the next move."}{" "}
            {terms.roundCount} round{terms.roundCount === 1 ? "" : "s"} logged.
          </p>
        </section>
      ) : null}

      <ToolDisclaimer>
        This tracker is for your own organization — <strong>facts only</strong>,
        not legal or financial advice and not a negotiation script. Your
        purchase contract governs the actual terms.
      </ToolDisclaimer>
    </div>
  );
}

function RoundCard({
  index,
  round,
  onPatch,
  onRemove,
}: {
  index: number;
  round: Round;
  onPatch: (patch: Partial<Round>) => void;
  onRemove: () => void;
}) {
  const [terms, setTerms] = useState(round.termChanges ?? "");

  const commitTerms = () => {
    const screened = screenText(terms).text;
    if (screened !== terms) setTerms(screened);
    onPatch({ termChanges: screened });
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold text-ink-soft">Round {index}</h3>
        <button type="button" className="btn-secondary" onClick={onRemove}>
          Remove
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <label className="block">
          <span className="text-sm font-medium text-ink-soft">Who</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={round.who}
            onChange={(e) => onPatch({ who: e.target.value as Party })}
          >
            <option value="buyer">Buyer (you)</option>
            <option value="seller">Seller</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink-soft">Price</span>
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={round.price || ""}
            onChange={(e) => onPatch({ price: Number(e.target.value) })}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink-soft">Date</span>
          <input
            type="date"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={round.date}
            onChange={(e) => onPatch({ date: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink-soft">Status</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={round.status}
            onChange={(e) => onPatch({ status: e.target.value as RoundStatus })}
          >
            {ROUND_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-ink-soft">
          Key term / contingency / credit changes
        </span>
        <textarea
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Facts only (screened)."
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          onBlur={commitTerms}
        />
      </label>
    </div>
  );
}
