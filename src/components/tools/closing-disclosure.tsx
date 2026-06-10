"use client";

import { useMemo } from "react";
import { useStageTool } from "@/hooks/use-stage-tool";
import { TrustCallout } from "@/components/trust-callout";
import { formatUSD } from "@/lib/savings";
import {
  BUCKET_LABELS,
  STANDARD_LINES,
  cdDeadline,
  closingDisclosureSummary,
  earliestSigningDate,
  type FeeLine,
  type ToleranceBucket,
} from "@/lib/tools/closing-disclosure";
import { ToolDisclaimer } from "./tool-disclaimer";

interface CDState {
  /** Per-line LE/CD amounts, keyed by the standard line id. */
  lines: FeeLine[];
  /** Target closing date (YYYY-MM-DD) for the 3-business-day check. */
  closingDate: string;
  /** Date the CD was received (YYYY-MM-DD), optional. */
  cdReceivedDate: string;
}

const INITIAL: CDState = {
  lines: STANDARD_LINES.map((l) => ({ ...l, le: 0, cd: 0 })),
  closingDate: "",
  cdReceivedDate: "",
};

/** Merge persisted (possibly partial/legacy) state onto the standard line set. */
function normalize(raw: CDState): CDState {
  const byId = new Map((raw.lines ?? []).map((l) => [l.id, l]));
  return {
    lines: STANDARD_LINES.map((std) => {
      const saved = byId.get(std.id);
      return {
        ...std,
        le: typeof saved?.le === "number" ? saved.le : 0,
        cd: typeof saved?.cd === "number" ? saved.cd : 0,
      };
    }),
    closingDate: typeof raw.closingDate === "string" ? raw.closingDate : "",
    cdReceivedDate:
      typeof raw.cdReceivedDate === "string" ? raw.cdReceivedDate : "",
  };
}

const BUCKET_ORDER: ToleranceBucket[] = ["zero", "ten", "none"];

const BUCKET_HELP: Record<ToleranceBucket, string> = {
  zero: "These charges cannot increase at all from your Loan Estimate. Any increase is over the allowed tolerance.",
  ten: "These are judged together as a group. A problem only arises if the group's total goes up by more than 10%.",
  none: "These can legitimately change between the estimate and closing. Shown for your awareness only.",
};

export function ClosingDisclosureTool() {
  const { value, hydrated, save, reset } = useStageTool<CDState>(
    "closing-disclosure",
    INITIAL,
  );

  const state = useMemo(() => normalize(value), [value]);
  const summary = useMemo(
    () => closingDisclosureSummary(state.lines),
    [state.lines],
  );

  const deadline = useMemo(
    () => (state.closingDate ? cdDeadline(state.closingDate) : ""),
    [state.closingDate],
  );
  const earliest = useMemo(
    () => (state.cdReceivedDate ? earliestSigningDate(state.cdReceivedDate) : ""),
    [state.cdReceivedDate],
  );

  const patchLine = (id: string, patch: Partial<Pick<FeeLine, "le" | "cd">>) =>
    save((prev) => {
      const cur = normalize(prev);
      return {
        ...cur,
        lines: cur.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      };
    });

  if (!hydrated) return <p className="text-sm text-ink-muted">Loading…</p>;

  const deltaByLine = new Map(summary.lines.map((l) => [l.id, l]));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-ink-soft">
          Enter the figures from your Loan Estimate (LE) and your Closing
          Disclosure (CD) for each standard line. We&apos;ll show the change and
          flag any increase that goes beyond the CFPB tolerance limits so you
          know what to ask your lender or closing agent about.
        </p>
        <button type="button" className="btn-secondary" onClick={reset}>
          Clear all
        </button>
      </div>

      {summary.hasViolations ? (
        <TrustCallout tone="warning" title="Possible tolerance issue">
          One or more charges increased beyond what CFPB rules allow. This may
          mean your lender owes a refund (a &ldquo;tolerance cure&rdquo;).{" "}
          <strong>Ask your lender or closing agent before you sign</strong> —
          they are the authority on whether a cure is owed.
        </TrustCallout>
      ) : null}

      {BUCKET_ORDER.map((bucket) => {
        const lines = state.lines.filter((l) => l.bucket === bucket);
        if (lines.length === 0) return null;
        return (
          <section
            key={bucket}
            className="space-y-4 rounded-2xl border border-slate-200 p-5"
          >
            <div>
              <h2 className="text-lg font-semibold">{BUCKET_LABELS[bucket]}</h2>
              <p className="text-sm text-ink-soft">{BUCKET_HELP[bucket]}</p>
            </div>

            <div className="space-y-4">
              {lines.map((line) => {
                const d = deltaByLine.get(line.id);
                const flagged = d?.flagged ?? false;
                const delta = d?.delta ?? 0;
                return (
                  <div
                    key={line.id}
                    className={`card space-y-3 ${
                      flagged ? "border-amber-300 bg-amber-50" : ""
                    }`}
                  >
                    <p className="text-sm font-medium text-ink">{line.label}</p>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <AmountField
                        label="Loan Estimate"
                        value={line.le}
                        onChange={(n) => patchLine(line.id, { le: n })}
                      />
                      <AmountField
                        label="Closing Disclosure"
                        value={line.cd}
                        onChange={(n) => patchLine(line.id, { cd: n })}
                      />
                      <div className="flex flex-col justify-end">
                        <span className="text-sm font-medium text-ink-soft">
                          Change
                        </span>
                        <span
                          className={`mt-1 text-sm font-semibold ${
                            flagged
                              ? "text-amber-800"
                              : delta > 0
                                ? "text-ink"
                                : "text-ink-soft"
                          }`}
                        >
                          {delta > 0 ? "+" : ""}
                          {formatUSD(delta)}
                        </span>
                      </div>
                    </div>
                    {flagged ? (
                      <p className="text-sm font-medium text-amber-800">
                        ⚠️ Exceeds the allowed tolerance — ask your lender or
                        closer about a refund.
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {bucket === "ten" ? (
              <div
                className={`rounded-lg border p-3 text-sm ${
                  summary.tenPercent.exceeds
                    ? "border-amber-300 bg-amber-50 text-amber-900"
                    : "border-slate-200 bg-slate-50 text-ink-soft"
                }`}
              >
                Group total: {formatUSD(summary.tenPercent.totalLE)} (LE) →{" "}
                {formatUSD(summary.tenPercent.totalCD)} (CD) ={" "}
                <strong>
                  {summary.tenPercent.percentIncrease >= 0 ? "+" : ""}
                  {summary.tenPercent.percentIncrease.toFixed(1)}%
                </strong>
                {summary.tenPercent.exceeds
                  ? " — over the 10% limit. Ask your lender about a tolerance cure."
                  : " — within the 10% limit."}
              </div>
            ) : null}
          </section>
        );
      })}

      <section
        aria-label="Totals"
        className="rounded-xl bg-brand-600 p-6 text-white"
      >
        <p className="text-sm font-medium text-brand-100">All lines</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <Total label="Loan Estimate total" value={summary.totalLE} />
          <Total label="Closing Disclosure total" value={summary.totalCD} />
          <Total label="Total change" value={summary.totalDelta} signed />
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 p-5">
        <div>
          <h2 className="text-lg font-semibold">
            3-business-day rule
          </h2>
          <p className="text-sm text-ink-soft">
            By law you must receive the Closing Disclosure at least three
            business days before closing. (Business days here are every day
            except Sundays and federal holidays.)
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">
              Target closing date
            </span>
            <input
              type="date"
              className="field mt-1"
              value={state.closingDate}
              onChange={(e) =>
                save((prev) => ({
                  ...normalize(prev),
                  closingDate: e.target.value,
                }))
              }
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">
              Date you received the CD (optional)
            </span>
            <input
              type="date"
              className="field mt-1"
              value={state.cdReceivedDate}
              onChange={(e) =>
                save((prev) => ({
                  ...normalize(prev),
                  cdReceivedDate: e.target.value,
                }))
              }
            />
          </label>
        </div>
        {deadline ? (
          <p className="text-sm text-ink">
            To close on {state.closingDate}, you must receive the CD{" "}
            <strong>on or before {deadline}</strong>.
          </p>
        ) : null}
        {earliest ? (
          <p className="text-sm text-ink">
            Having received the CD on {state.cdReceivedDate}, the earliest you
            can sign / close is <strong>{earliest}</strong>.
          </p>
        ) : null}
      </section>

      <ToolDisclaimer>
        This is an <strong>estimate and education, not legal or financial
        advice</strong>. Tolerance buckets are simplified for learning. Your
        lender and closing agent are the authority on whether a tolerance cure
        is owed and on your final figures.
      </ToolDisclaimer>
    </div>
  );
}

function AmountField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-soft">{label}</span>
      <input
        type="number"
        min={0}
        inputMode="decimal"
        className="field mt-1"
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Total({
  label,
  value,
  signed,
}: {
  label: string;
  value: number;
  signed?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-brand-100">{label}</p>
      <p className="text-2xl font-bold">
        {signed && value > 0 ? "+" : ""}
        {formatUSD(value)}
      </p>
    </div>
  );
}
