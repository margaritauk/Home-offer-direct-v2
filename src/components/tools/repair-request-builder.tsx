"use client";

import { useMemo, useState } from "react";
import { useStageTool } from "@/hooks/use-stage-tool";
import { screenText } from "@/lib/ai/screening";
import { formatUSD } from "@/lib/savings";
import { TrustCallout } from "@/components/trust-callout";
import type { Finding } from "@/lib/tools/inspection";
import {
  buildRequestSummary,
  repairTotals,
  type RepairItem,
  type RepairResolution,
} from "@/lib/tools/repair-request";
import { ToolDisclaimer } from "./tool-disclaimer";

interface RepairState {
  items: RepairItem[];
}

const INITIAL: RepairState = { items: [] };

function newItem(partial?: Partial<RepairItem>): RepairItem {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `repair-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    item: partial?.item ?? "",
    resolution: partial?.resolution ?? "repair",
    requestedAmount: partial?.requestedAmount ?? 0,
    notes: partial?.notes ?? "",
  };
}

/** Read the inspection tool's stored findings (#105) for import, if present. */
function readInspectionFindings(): Finding[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("hod:tool:inspection:v1");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { findings?: Finding[] };
    return Array.isArray(parsed.findings) ? parsed.findings : [];
  } catch {
    return [];
  }
}

const RESOLUTIONS: { id: RepairResolution; label: string }[] = [
  { id: "repair", label: "Request repair" },
  { id: "credit", label: "Request credit" },
];

export function RepairRequestBuilder() {
  const { value, hydrated, save, reset } = useStageTool<RepairState>(
    "repair-request",
    INITIAL,
  );

  const totals = useMemo(() => repairTotals(value.items), [value.items]);
  const summary = useMemo(() => buildRequestSummary(value.items), [value.items]);

  const [copied, setCopied] = useState(false);

  const addManual = () =>
    save((prev) => ({ ...prev, items: [...prev.items, newItem()] }));

  const importFromInspection = () => {
    const findings = readInspectionFindings();
    if (findings.length === 0) return;
    const imported = findings
      .filter((f) => f.item.trim() !== "")
      .map((f) =>
        newItem({
          item: f.item,
          resolution: f.decision === "request-credit" ? "credit" : "repair",
          requestedAmount: f.decision === "request-credit" ? f.estCost : 0,
          notes: f.notes ? screenText(f.notes).text : "",
        }),
      );
    save((prev) => ({ ...prev, items: [...prev.items, ...imported] }));
  };

  const removeItem = (id: string) =>
    save((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== id) }));
  const patchItem = (id: string, patch: Partial<RepairItem>) =>
    save((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));

  const copySummary = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable; the textarea below is selectable as a fallback */
    }
  };

  if (!hydrated) return <p className="text-sm text-ink-muted">Loading…</p>;

  return (
    <div className="space-y-8">
      <TrustCallout tone="info" title="A worksheet, not a legal notice">
        This builds a neutral, factual summary you can share with the seller. It
        states the items and what you&apos;re asking for — no demands,
        deadlines, or legal language.
      </TrustCallout>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Repair / credit items</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary" onClick={importFromInspection}>
              Import from inspection
            </button>
            <button type="button" className="btn-primary" onClick={addManual}>
              Add item
            </button>
            {value.items.length > 0 ? (
              <button type="button" className="btn-secondary" onClick={reset}>
                Clear all
              </button>
            ) : null}
          </div>
        </div>

        {value.items.length === 0 ? (
          <div className="card text-center text-sm text-ink-soft">
            Import your inspection findings or add items manually to build a
            request.
          </div>
        ) : (
          <div className="space-y-3">
            {value.items.map((item) => (
              <RepairCard
                key={item.id}
                item={item}
                onPatch={(patch) => patchItem(item.id, patch)}
                onRemove={() => removeItem(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {totals.total > 0 ? (
        <section
          aria-label="Request totals"
          className="rounded-xl bg-brand-600 p-6 text-white"
        >
          <p className="text-sm font-medium text-brand-100">Total requested credit</p>
          <p className="mt-1 text-3xl font-bold">{formatUSD(totals.totalCredit)}</p>
          <p className="mt-2 text-sm text-brand-100">
            {totals.repairCount} repair{totals.repairCount === 1 ? "" : "s"} ·{" "}
            {totals.creditCount} credit{totals.creditCount === 1 ? "" : "s"} ·{" "}
            {totals.total} item{totals.total === 1 ? "" : "s"}
          </p>
        </section>
      ) : null}

      {summary ? (
        <section className="card space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Request summary</h2>
            <button type="button" className="btn-secondary" onClick={copySummary}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <textarea
            readOnly
            rows={Math.min(16, summary.split("\n").length + 1)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
            value={summary}
          />
        </section>
      ) : null}

      <ToolDisclaimer>
        This is a <strong>worksheet, not a legal notice</strong> and not legal
        advice. How you request repairs or credits is governed by your purchase
        contract and state rules — consult a licensed professional for the
        formal process.
      </ToolDisclaimer>
    </div>
  );
}

function RepairCard({
  item,
  onPatch,
  onRemove,
}: {
  item: RepairItem;
  onPatch: (patch: Partial<RepairItem>) => void;
  onRemove: () => void;
}) {
  const [note, setNote] = useState(item.notes ?? "");

  const commitNote = () => {
    const screened = screenText(note).text;
    if (screened !== note) setNote(screened);
    onPatch({ notes: screened });
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-start justify-between gap-4">
        <label className="block flex-1">
          <span className="text-sm font-medium text-ink-soft">Item</span>
          <input
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="e.g. Roof — missing shingles"
            value={item.item}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-ink-soft">Resolution</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={item.resolution}
            onChange={(e) =>
              onPatch({ resolution: e.target.value as RepairResolution })
            }
          >
            {RESOLUTIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        {item.resolution === "credit" ? (
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">
              Requested credit
            </span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={item.requestedAmount || ""}
              onChange={(e) => onPatch({ requestedAmount: Number(e.target.value) })}
            />
          </label>
        ) : null}
      </div>

      <label className="block">
        <span className="text-sm font-medium text-ink-soft">Notes</span>
        <textarea
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Factual context (screened)."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={commitNote}
        />
      </label>
    </div>
  );
}
