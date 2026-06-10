"use client";

import { useMemo } from "react";
import { useStageTool } from "@/hooks/use-stage-tool";
import { TrustCallout } from "@/components/trust-callout";
import {
  STANDARD_WALKTHROUGH_ITEMS,
  negotiatedRepairItems,
  type WalkthroughItem,
  type WalkthroughStatus,
} from "@/lib/tools/final-walkthrough";
import { ToolDisclaimer } from "./tool-disclaimer";

/** One recorded status + optional note, keyed by item id in the saved map. */
interface ItemResult {
  status: WalkthroughStatus;
  notes?: string;
}

/** The walkthrough's own persisted state: itemId → result. */
type WalkthroughState = Record<string, ItemResult>;

const INITIAL: WalkthroughState = {};

/** Initial value used only to READ the repair-request tool's blob. */
const REPAIR_INITIAL = { items: [] };

const STATUSES: { id: WalkthroughStatus; label: string }[] = [
  { id: "pass", label: "Pass" },
  { id: "fail", label: "Fail" },
  { id: "n-a", label: "N/A" },
];

export function FinalWalkthrough() {
  const { value, hydrated, save, reset } = useStageTool<WalkthroughState>(
    "final-walkthrough",
    INITIAL,
  );

  // Read the repair-request tool's persisted blob via the shared store and run
  // it through the pure helper to auto-list negotiated repairs.
  const { value: repairState } = useStageTool("repair-request", REPAIR_INITIAL);
  const repairItems = useMemo(
    () => negotiatedRepairItems(repairState),
    [repairState],
  );

  const patch = (id: string, next: Partial<ItemResult>) =>
    save((prev) => ({
      ...prev,
      [id]: {
        status: next.status ?? prev[id]?.status ?? "pass",
        notes: next.notes ?? prev[id]?.notes,
      },
    }));

  const failedCount = useMemo(() => {
    const allIds = [
      ...STANDARD_WALKTHROUGH_ITEMS.map((i) => i.id),
      ...repairItems.map((i) => i.id),
    ];
    return allIds.filter((id) => value[id]?.status === "fail").length;
  }, [value, repairItems]);

  const hasAnyStatus = Object.keys(value).length > 0;

  if (!hydrated) return <p className="text-sm text-ink-muted">Loading…</p>;

  return (
    <div className="space-y-8">
      <TrustCallout tone="info" title="Your last check before closing">
        Walk the home 24–48 hours before closing and confirm nothing changed.
        Mark each item pass, fail, or not applicable. Anything you mark failed is
        flagged below so you can raise it before you sign.
      </TrustCallout>

      {failedCount > 0 ? (
        <div data-testid="attention-summary">
          <TrustCallout tone="warning" title="Items need attention">
            {failedCount} item{failedCount === 1 ? "" : "s"} still need
            {failedCount === 1 ? "s" : ""} attention before closing. Document the
            problem with photos and raise it before you sign — your leverage
            largely disappears after closing.
          </TrustCallout>
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Standard walkthrough checks</h2>
          {hasAnyStatus ? (
            <button type="button" className="btn-secondary" onClick={reset}>
              Reset checklist
            </button>
          ) : null}
        </div>
        <div className="space-y-3">
          {STANDARD_WALKTHROUGH_ITEMS.map((item) => (
            <ChecklistRow
              key={item.id}
              item={item}
              result={value[item.id]}
              onPatch={(next) => patch(item.id, next)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Negotiated repairs to verify</h2>
          <p className="text-sm text-ink-soft">
            Auto-listed from your Repair request tool. Confirm each repair you
            negotiated was actually completed. (Credits aren&apos;t listed here —
            they show up as money on your Closing Disclosure.)
          </p>
        </div>

        {repairItems.length === 0 ? (
          <div className="card text-center text-sm text-ink-soft">
            No negotiated repairs found — add them in the{" "}
            <a className="font-medium text-brand-600" href="/tools/repair-request">
              Repair request tool
            </a>
            .
          </div>
        ) : (
          <div className="space-y-3">
            {repairItems.map((item) => (
              <ChecklistRow
                key={item.id}
                item={item}
                result={value[item.id]}
                onPatch={(next) => patch(item.id, next)}
              />
            ))}
          </div>
        )}
      </section>

      <ToolDisclaimer>
        This checklist is an <strong>education aid, not a substitute</strong> for
        your own walkthrough or your agent&apos;s, and not legal advice. It
        doesn&apos;t replace a professional inspection. Use your own judgment and
        document anything you find before you sign.
      </ToolDisclaimer>
    </div>
  );
}

function ChecklistRow({
  item,
  result,
  onPatch,
}: {
  item: WalkthroughItem;
  result: ItemResult | undefined;
  onPatch: (next: Partial<ItemResult>) => void;
}) {
  const status = result?.status;
  const failed = status === "fail";

  return (
    <div
      className={`card space-y-3 ${failed ? "border-amber-300 bg-amber-50" : ""}`}
    >
      <p className="text-sm font-medium text-ink">{item.label}</p>
      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={status === s.id}
            onClick={() => onPatch({ status: s.id })}
            className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition ${
              status === s.id
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-slate-300 bg-white text-ink hover:border-brand-300"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <label className="block">
        <span className="text-sm font-medium text-ink-soft">Notes</span>
        <input
          type="text"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Optional — what you saw, anything to follow up on."
          value={result?.notes ?? ""}
          onChange={(e) => onPatch({ notes: e.target.value })}
        />
      </label>
    </div>
  );
}
