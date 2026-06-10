"use client";

import { useMemo } from "react";
import { useStageTool } from "@/hooks/use-stage-tool";
import { TrustCallout } from "@/components/trust-callout";
import { formatUSD } from "@/lib/savings";
import {
  STANDARD_CLOSING_DAY_ITEMS,
  cashToClose,
  type CashToCloseInput,
} from "@/lib/tools/closing-day";
import { ToolDisclaimer } from "./tool-disclaimer";

interface ClosingDayState {
  /** Checklist item id → done. */
  checked: Record<string, boolean>;
  /** Cash-to-close line items. */
  cash: CashToCloseInput;
}

const INITIAL: ClosingDayState = {
  checked: {},
  cash: {
    downPayment: 0,
    closingCosts: 0,
    lenderCredit: 0,
    sellerCredit: 0,
    earnestMoneyPaid: 0,
  },
};

/** Tolerate partial/legacy persisted state. */
function normalize(raw: ClosingDayState): ClosingDayState {
  const cash = raw.cash ?? INITIAL.cash;
  const n = (v: unknown) => (typeof v === "number" ? v : 0);
  return {
    checked: raw.checked && typeof raw.checked === "object" ? raw.checked : {},
    cash: {
      downPayment: n(cash.downPayment),
      closingCosts: n(cash.closingCosts),
      lenderCredit: n(cash.lenderCredit),
      sellerCredit: n(cash.sellerCredit),
      earnestMoneyPaid: n(cash.earnestMoneyPaid),
    },
  };
}

const CASH_FIELDS: { key: keyof CashToCloseInput; label: string; credit?: boolean }[] = [
  { key: "downPayment", label: "Down payment" },
  { key: "closingCosts", label: "Buyer closing costs" },
  { key: "lenderCredit", label: "Lender credit", credit: true },
  { key: "sellerCredit", label: "Seller credit / concession", credit: true },
  { key: "earnestMoneyPaid", label: "Earnest money already paid", credit: true },
];

export function ClosingDayTool() {
  const { value, hydrated, save, reset } = useStageTool<ClosingDayState>(
    "closing-day",
    INITIAL,
  );

  const state = useMemo(() => normalize(value), [value]);
  const cash = useMemo(() => cashToClose(state.cash), [state.cash]);

  const doneCount = STANDARD_CLOSING_DAY_ITEMS.filter(
    (i) => state.checked[i.id],
  ).length;

  const toggle = (id: string) =>
    save((prev) => {
      const cur = normalize(prev);
      return {
        ...cur,
        checked: { ...cur.checked, [id]: !cur.checked[id] },
      };
    });

  const patchCash = (key: keyof CashToCloseInput, n: number) =>
    save((prev) => {
      const cur = normalize(prev);
      return { ...cur, cash: { ...cur.cash, [key]: n } };
    });

  if (!hydrated) return <p className="text-sm text-ink-muted">Loading…</p>;

  return (
    <div className="space-y-8">
      {/* Wire-fraud warning — trust-critical, kept first and prominent. */}
      <TrustCallout tone="danger" title="Verify wiring instructions before you send a cent">
        Wire fraud is the #1 closing scam: criminals spoof emails with
        last-minute &ldquo;updated&rdquo; wiring instructions. Before wiring,{" "}
        <strong>
          call your title/escrow company on a number you independently verified
        </strong>{" "}
        (not one from the email) and confirm the account details. Once a wire is
        sent to the wrong account, the money is almost never recovered.
      </TrustCallout>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            Closing-day checklist{" "}
            <span className="text-sm font-normal text-ink-muted">
              ({doneCount}/{STANDARD_CLOSING_DAY_ITEMS.length})
            </span>
          </h2>
          <button type="button" className="btn-secondary" onClick={reset}>
            Reset
          </button>
        </div>
        <ul className="space-y-2">
          {STANDARD_CLOSING_DAY_ITEMS.map((item) => {
            const done = Boolean(state.checked[item.id]);
            return (
              <li key={item.id}>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:border-brand-300">
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-brand-600"
                    checked={done}
                    onChange={() => toggle(item.id)}
                  />
                  <span
                    className={`text-sm ${done ? "text-ink-muted line-through" : "text-ink"}`}
                  >
                    {item.label}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 p-5">
        <div>
          <h2 className="text-lg font-semibold">Cash-to-close estimate</h2>
          <p className="text-sm text-ink-soft">
            What you&apos;ll bring to the table: down payment + closing costs,
            minus any lender/seller credits and the earnest money you already
            paid. Your closer&apos;s Closing Disclosure is the official figure.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {CASH_FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="text-sm font-medium text-ink-soft">
                {f.label}
                {f.credit ? (
                  <span className="ml-1 text-xs text-ink-muted">(subtracted)</span>
                ) : null}
              </span>
              <input
                type="number"
                min={0}
                inputMode="decimal"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={state.cash[f.key] || ""}
                onChange={(e) => patchCash(f.key, Number(e.target.value))}
              />
            </label>
          ))}
        </div>
        <div className="rounded-xl bg-brand-600 p-6 text-white">
          <p className="text-sm font-medium text-brand-100">
            Estimated cash to close
          </p>
          <p className="mt-1 text-3xl font-bold">{formatUSD(cash.total)}</p>
          <p className="mt-2 text-sm text-brand-100">
            {formatUSD(cash.downPayment + cash.closingCosts)} gross −{" "}
            {formatUSD(
              cash.lenderCredit + cash.sellerCredit + cash.earnestMoneyPaid,
            )}{" "}
            in credits &amp; earnest money
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
        <h2 className="text-sm font-semibold text-ink">
          Electronic signing &amp; remote online notarization
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Coming soon. Many closings still sign in person with a notary; e-sign /
          RON availability varies by state and lender — ask your closer what your
          closing will use.
        </p>
      </section>

      <ToolDisclaimer>
        This is a <strong>checklist and estimate, not legal or financial
        advice</strong>. Your lender and closing/settlement agent produce the
        official cash-to-close on your Closing Disclosure and tell you exactly
        what to bring.
      </ToolDisclaimer>
    </div>
  );
}
