"use client";

import { useMemo, useState } from "react";
import { useStageTool } from "@/hooks/use-stage-tool";
import { screenText } from "@/lib/ai/screening";
import { formatUSD } from "@/lib/savings";
import { TrustCallout } from "@/components/trust-callout";
import {
  SEVERITIES,
  summarizeFindings,
  type Finding,
  type FindingDecision,
  type Severity,
} from "@/lib/tools/inspection";
import { ToolDisclaimer } from "./tool-disclaimer";

interface InspectionState {
  scheduledDate: string;
  findings: Finding[];
}

const INITIAL: InspectionState = { scheduledDate: "", findings: [] };

const SEVERITY_LABEL: Record<Severity, string> = {
  minor: "Minor",
  moderate: "Moderate",
  major: "Major",
  safety: "Safety",
};

const DECISIONS: { id: FindingDecision; label: string }[] = [
  { id: "request-repair", label: "Request repair" },
  { id: "request-credit", label: "Request credit" },
  { id: "accept", label: "Accept as-is" },
  { id: "consider-walking", label: "Consider walking" },
];

function newFinding(): Finding {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `find-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    item: "",
    severity: "minor",
    estCost: 0,
    decision: "accept",
    notes: "",
  };
}

export function InspectionFindings() {
  const { value, hydrated, save, reset } = useStageTool<InspectionState>(
    "inspection",
    INITIAL,
  );

  const summary = useMemo(
    () => summarizeFindings(value.findings),
    [value.findings],
  );

  const addFinding = () =>
    save((prev) => ({ ...prev, findings: [...prev.findings, newFinding()] }));
  const removeFinding = (id: string) =>
    save((prev) => ({
      ...prev,
      findings: prev.findings.filter((f) => f.id !== id),
    }));
  const patchFinding = (id: string, patch: Partial<Finding>) =>
    save((prev) => ({
      ...prev,
      findings: prev.findings.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));

  if (!hydrated) return <p className="text-sm text-ink-muted">Loading…</p>;

  return (
    <div className="space-y-8">
      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">Inspection schedule</h2>
        <label className="block sm:max-w-xs">
          <span className="text-sm font-medium text-ink-soft">
            Scheduled inspection date
          </span>
          <input
            type="date"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={value.scheduledDate}
            onChange={(e) => save((prev) => ({ ...prev, scheduledDate: e.target.value }))}
          />
        </label>
      </section>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Findings</h2>
          <div className="flex gap-2">
            <button type="button" className="btn-primary" onClick={addFinding}>
              Add a finding
            </button>
            {value.findings.length > 0 ? (
              <button type="button" className="btn-secondary" onClick={reset}>
                Clear all
              </button>
            ) : null}
          </div>
        </div>

        {value.findings.length === 0 ? (
          <div className="card text-center text-sm text-ink-soft">
            Log each inspection finding to build a fact-based summary.
          </div>
        ) : (
          <div className="space-y-3">
            {value.findings.map((finding) => (
              <FindingCard
                key={finding.id}
                finding={finding}
                onPatch={(patch) => patchFinding(finding.id, patch)}
                onRemove={() => removeFinding(finding.id)}
              />
            ))}
          </div>
        )}
      </div>

      {summary.total > 0 ? (
        <section
          aria-label="Findings summary"
          className="rounded-xl bg-brand-600 p-6 text-white"
        >
          <p className="text-sm font-medium text-brand-100">Summary</p>
          <p className="mt-1 text-3xl font-bold">
            {formatUSD(summary.totalEstCost)} estimated
          </p>
          <p className="mt-2 text-sm text-brand-100">
            {SEVERITIES.map(
              (s) => `${summary.countsBySeverity[s]} ${SEVERITY_LABEL[s].toLowerCase()}`,
            ).join(" · ")}{" "}
            · {summary.total} total
          </p>
          {summary.hasMajorOrSafety ? (
            <div className="mt-4">
              <TrustCallout tone="warning" title="Major / safety items flagged">
                {summary.flaggedCount} finding
                {summary.flaggedCount === 1 ? "" : "s"} marked major or safety.
                These are worth a closer look before you decide how to proceed.
              </TrustCallout>
            </div>
          ) : null}
        </section>
      ) : null}

      <ToolDisclaimer>
        This worksheet is <strong>not a substitute for a licensed inspector</strong>{" "}
        and not legal or financial advice. Severities and costs are your own
        estimates. Rely on your inspector&apos;s report for the official
        findings.
      </ToolDisclaimer>
    </div>
  );
}

function FindingCard({
  finding,
  onPatch,
  onRemove,
}: {
  finding: Finding;
  onPatch: (patch: Partial<Finding>) => void;
  onRemove: () => void;
}) {
  const [note, setNote] = useState(finding.notes ?? "");

  const commitNote = () => {
    const screened = screenText(note).text;
    if (screened !== note) setNote(screened);
    onPatch({ notes: screened });
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-start justify-between gap-4">
        <label className="block flex-1">
          <span className="text-sm font-medium text-ink-soft">Item / system</span>
          <input
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="e.g. Roof, Water heater, Electrical panel"
            value={finding.item}
            onChange={(e) => onPatch({ item: e.target.value })}
          />
        </label>
        <button
          type="button"
          className="btn-secondary mt-6 shrink-0"
          onClick={onRemove}
        >
          Remove
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="text-sm font-medium text-ink-soft">Severity</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={finding.severity}
            onChange={(e) => onPatch({ severity: e.target.value as Severity })}
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {SEVERITY_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink-soft">Est. cost</span>
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={finding.estCost || ""}
            onChange={(e) => onPatch({ estCost: Number(e.target.value) })}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink-soft">Decision</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={finding.decision}
            onChange={(e) => onPatch({ decision: e.target.value as FindingDecision })}
          >
            {DECISIONS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-ink-soft">Notes</span>
        <textarea
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Facts from the inspection (screened)."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={commitNote}
        />
      </label>
    </div>
  );
}
