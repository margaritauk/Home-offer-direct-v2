"use client";

import Link from "next/link";
import { formatUSD } from "@/lib/savings";
import { concessionAtStake, concessionScript } from "@/lib/offer/term-sheet";
import type { ConcessionType, Offer } from "@/lib/offer/types";

/**
 * Commission-savings / seller-concession ask step (issue #14).
 *
 * Computes the at-stake amount (via the savings logic, applied to the offer
 * price), lets the buyer choose a price-reduction vs closing-credit framing, and
 * surfaces adaptable, non-personalized script language. UPL guardrail (#17):
 * templated/educational wording, "subject to attorney review".
 */
const TYPE_OPTIONS: { value: ConcessionType; label: string; blurb: string }[] = [
  {
    value: "price-reduction",
    label: "Price reduction",
    blurb: "Lower the purchase price by the amount — reduces your loan and long-term interest.",
  },
  {
    value: "closing-credit",
    label: "Closing-cost credit",
    blurb: "Seller credits the amount toward your closing costs — frees up cash at the table.",
  },
  {
    value: "none",
    label: "Not asking right now",
    blurb: "Leave the ask off the worksheet for now.",
  },
];

export function ConcessionStep({
  offer,
  onChange,
  hydrated,
}: {
  offer: Offer;
  onChange: (patch: Pick<Offer, "concession">) => void;
  hydrated: boolean;
}) {
  const atStake = concessionAtStake(offer);
  const script = concessionScript(offer);

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-soft">
        Because you&apos;re unrepresented, there&apos;s no buyer-side commission
        to pay — historically about 2.5% of the price. Post-2024-NAR-settlement
        that money isn&apos;t automatic; you only capture it if you ask. You can
        frame the ask as a price reduction or a closing-cost credit.
      </p>

      <div className="rounded-xl bg-brand-600 p-6 text-white">
        <p className="text-sm font-medium text-brand-100">Estimated amount at stake</p>
        <p className="mt-1 text-4xl font-bold" data-testid="concession-at-stake">
          {offer.concession.type === "none" ? formatUSD(0) : formatUSD(atStake)}
        </p>
        <p className="mt-2 text-sm text-brand-100">
          {offer.concession.percent}% of {formatUSD(offer.price)}
        </p>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-soft">
          Percent of price to ask for
        </span>
        <input
          type="number"
          min={0}
          max={4}
          step={0.1}
          className="w-32 rounded-lg border border-slate-300 px-3 py-2.5"
          value={hydrated ? offer.concession.percent : 0}
          onChange={(e) =>
            onChange({ concession: { ...offer.concession, percent: Number(e.target.value) } })
          }
          aria-label="Percent of price to ask for"
          suppressHydrationWarning
        />
        <span className="ml-2 text-sm text-ink-muted">% (national average ~2.5%)</span>
      </label>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-ink-soft">How to frame the ask</legend>
        {TYPE_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
          >
            <input
              type="radio"
              name="concession-type"
              className="mt-1 h-4 w-4 accent-brand-600"
              checked={hydrated ? offer.concession.type === opt.value : opt.value === "price-reduction"}
              onChange={() => onChange({ concession: { ...offer.concession, type: opt.value } })}
              suppressHydrationWarning
            />
            <span>
              <span className="block font-medium text-ink">{opt.label}</span>
              <span className="block text-xs text-ink-muted">{opt.blurb}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {script ? (
        <div>
          <p className="text-sm font-medium text-ink-soft">Adaptable script language</p>
          <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm italic text-ink-soft">
            &ldquo;{script}&rdquo;
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Template wording only — adapt it and have your attorney put it in writing.
          </p>
        </div>
      ) : null}

      <p className="text-xs text-ink-muted">
        Want to model your full cash-to-close?{" "}
        <Link href="/tools/savings-calculator" className="text-brand-700 underline">
          Open the commission savings calculator
        </Link>
        .
      </p>
    </div>
  );
}
