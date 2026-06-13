"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStageTool } from "@/hooks/use-stage-tool";
import { screenText } from "@/lib/ai/screening";
import { TrustCallout } from "@/components/trust-callout";
import {
  SUGGESTED_CRITERIA,
  groupByTier,
  toScorecardRubric,
  type Criterion,
  type CriteriaState,
  type CriterionTier,
} from "@/lib/tools/criteria";
import { ToolDisclaimer } from "./tool-disclaimer";

const INITIAL: CriteriaState = { criteria: [] };

const TIERS: { id: CriterionTier; title: string; blurb: string }[] = [
  {
    id: "must",
    title: "Must-haves",
    blurb: "Non-negotiable needs. These weigh most when you score tours.",
  },
  {
    id: "nice",
    title: "Nice-to-haves",
    blurb: "Bonuses you'd like but can compromise on.",
  },
  {
    id: "deal-breaker",
    title: "Deal-breakers",
    blurb:
      "Hard stops that rule a home out (pass/fail — not scored on a 1–5 scale).",
  },
];

function freshId(prefix: string): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function CriteriaWorksheet() {
  const { value, hydrated, save, reset } = useStageTool<CriteriaState>(
    "criteria",
    INITIAL,
  );

  const groups = useMemo(() => groupByTier(value.criteria), [value.criteria]);
  const rubric = useMemo(
    () => toScorecardRubric(value.criteria),
    [value.criteria],
  );

  if (!hydrated) return <p className="text-sm text-ink-muted">Loading…</p>;

  const addCriterion = (tier: CriterionTier, label: string) => {
    const screened = screenText(label).text.trim();
    if (!screened) return;
    save((prev) => ({
      criteria: [
        ...prev.criteria,
        { id: freshId("crit"), label: screened, tier },
      ],
    }));
  };

  const removeCriterion = (id: string) =>
    save((prev) => ({
      criteria: prev.criteria.filter((c) => c.id !== id),
    }));

  const moveCriterion = (id: string, tier: CriterionTier) =>
    save((prev) => ({
      criteria: prev.criteria.map((c) => (c.id === id ? { ...c, tier } : c)),
    }));

  const usedSuggestions = new Set(
    value.criteria.map((c) => c.label.toLowerCase()),
  );

  return (
    <div className="space-y-8" data-testid="criteria-worksheet">
      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">Quick-add objective criteria</h2>
        <p className="text-sm text-ink-soft">
          Start from common <strong>property and logistics</strong> facts. Tap
          one to add it as a must-have, then re-sort it below. You can also type
          your own (it&apos;s screened to keep things neutral).
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_CRITERIA.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={usedSuggestions.has(s.label.toLowerCase())}
              onClick={() => addCriterion("must", s.label)}
              title={s.hint}
              className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-ink transition hover:border-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              + {s.label}
            </button>
          ))}
        </div>
        <CustomAdder onAdd={(label) => addCriterion("must", label)} />
        {value.criteria.length > 0 ? (
          <button type="button" className="btn-secondary" onClick={reset}>
            Clear worksheet
          </button>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {TIERS.map((tier) => (
          <section
            key={tier.id}
            aria-labelledby={`tier-${tier.id}`}
            className="space-y-3 rounded-2xl border border-slate-200 p-4"
          >
            <div>
              <h3 id={`tier-${tier.id}`} className="text-base font-semibold">
                {tier.title}
              </h3>
              <p className="text-xs text-ink-muted">{tier.blurb}</p>
            </div>
            {groups[tier.id].length === 0 ? (
              <p className="text-sm text-ink-muted">Nothing here yet.</p>
            ) : (
              <ul className="space-y-2">
                {groups[tier.id].map((c) => (
                  <CriterionRow
                    key={c.id}
                    criterion={c}
                    onRemove={() => removeCriterion(c.id)}
                    onMove={(t) => moveCriterion(c.id, t)}
                  />
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {/* Navigational hand-off to the Tour Scorecard — no cross-tool storage. */}
      <section
        aria-live="polite"
        className="rounded-xl border border-brand-300 bg-brand-50 p-5"
      >
        <h2 className="text-lg font-semibold text-brand-800">
          Score tours against your own criteria
        </h2>
        <p className="mt-1 text-sm text-brand-900">
          {rubric.length > 0
            ? `Your must-haves and nice-to-haves become a ${rubric.length}-criterion rubric you can use on every tour — must-haves weigh more than nice-to-haves.`
            : "Add a must-have or nice-to-have above, then carry it into the scorecard to rate every home you tour."}
        </p>
        <Link
          href="/tools/tour-scorecard"
          className="mt-2 inline-block text-sm font-semibold text-brand-700 underline hover:text-brand-800"
          data-testid="tour-scorecard-link"
        >
          Open the Tour Scorecard →
        </Link>
      </section>

      <TrustCallout tone="info" title="Keep your criteria objective">
        This worksheet records <strong>your own</strong> property and logistics
        filters — beds, commute, budget ceiling, condition. Keep it to the home
        and the trip, not the neighbors: criteria that proxy who lives somewhere
        can steer a search in ways fair-housing law prohibits. Your budget
        ceiling is your number, not a recommended price.
      </TrustCallout>

      <ToolDisclaimer>
        This is an organizational worksheet, not advice. It helps you stay
        disciplined and score tours consistently — it doesn&apos;t pick a home or
        a price for you.
      </ToolDisclaimer>
    </div>
  );
}

function CustomAdder({ onAdd }: { onAdd: (label: string) => void }) {
  const [draft, setDraft] = useState("");
  const submit = () => {
    if (!draft.trim()) return;
    onAdd(draft);
    setDraft("");
  };
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="block flex-1">
        <span className="text-sm font-medium text-ink-soft">
          Add your own (objective) criterion
        </span>
        <input
          type="text"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="e.g. Home office, first-floor bedroom, fenced yard"
          value={draft}
          aria-label="Add your own criterion"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
      </label>
      <button type="button" className="btn-secondary" onClick={submit}>
        Add
      </button>
    </div>
  );
}

function CriterionRow({
  criterion,
  onRemove,
  onMove,
}: {
  criterion: Criterion;
  onRemove: () => void;
  onMove: (tier: CriterionTier) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2">
      <span className="text-sm text-ink">{criterion.label}</span>
      <div className="flex shrink-0 items-center gap-1">
        <label className="sr-only" htmlFor={`tier-select-${criterion.id}`}>
          Move {criterion.label} to a different tier
        </label>
        <select
          id={`tier-select-${criterion.id}`}
          className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
          value={criterion.tier}
          onChange={(e) => onMove(e.target.value as CriterionTier)}
        >
          <option value="must">Must-have</option>
          <option value="nice">Nice-to-have</option>
          <option value="deal-breaker">Deal-breaker</option>
        </select>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${criterion.label}`}
          className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-ink-muted hover:text-ink"
        >
          ✕
        </button>
      </div>
    </li>
  );
}
