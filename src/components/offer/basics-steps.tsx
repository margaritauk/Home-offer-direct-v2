"use client";

import { formatUSD } from "@/lib/savings";
import type { FinancingType, ClosingCostPreference, Offer } from "@/lib/offer/types";
import { earnestMoneyDollars } from "@/lib/offer/term-sheet";
import { CurrencyField, DateField, NumberField, SelectField, TextField } from "./fields";

type Patch = (patch: Partial<Offer>) => void;

/** Price & earnest-money step (issue #12). */
export function PriceStep({
  offer,
  onChange,
  hydrated,
}: {
  offer: Offer;
  onChange: Patch;
  hydrated: boolean;
}) {
  return (
    <div className="space-y-6">
      <CurrencyField
        label="Purchase price"
        explainer="The price you're offering for the home. Everything else is calculated from this."
        value={offer.price}
        onChange={(price) => onChange({ price })}
        placeholder="e.g. 700,000"
        hydrated={hydrated}
      />
      {offer.isPercent ? (
        <NumberField
          label="Earnest money (% of price)"
          explainer="A good-faith deposit (typically 1–3% of price) held in escrow that signals you're serious. It's applied at closing or refunded if you properly invoke a contingency."
          value={offer.earnestMoney}
          onChange={(earnestMoney) => onChange({ earnestMoney })}
          min={0}
          step={0.5}
          suffix="%"
          hydrated={hydrated}
        />
      ) : (
        <CurrencyField
          label="Earnest money ($)"
          explainer="A good-faith deposit (typically 1–3% of price) held in escrow that signals you're serious. It's applied at closing or refunded if you properly invoke a contingency."
          value={offer.earnestMoney}
          onChange={(earnestMoney) => onChange({ earnestMoney })}
          placeholder="e.g. 10,000"
          hydrated={hydrated}
        />
      )}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4 accent-brand-600"
          checked={hydrated ? offer.isPercent : true}
          onChange={(e) => onChange({ isPercent: e.target.checked })}
          suppressHydrationWarning
        />
        Enter earnest money as a percent of price
      </label>
      <p className="text-sm text-ink-soft">
        Earnest money works out to{" "}
        <span className="font-semibold text-ink">{formatUSD(earnestMoneyDollars(offer))}</span>.
      </p>
    </div>
  );
}

const FINANCING_OPTIONS: { value: FinancingType; label: string }[] = [
  { value: "conventional", label: "Conventional loan" },
  { value: "fha", label: "FHA loan" },
  { value: "va", label: "VA loan" },
  { value: "cash", label: "Cash (no financing)" },
];

/** Financing & down-payment step (issue #12). */
export function FinancingStep({
  offer,
  onChange,
  hydrated,
}: {
  offer: Offer;
  onChange: Patch;
  hydrated: boolean;
}) {
  return (
    <div className="space-y-6">
      <SelectField
        label="Financing type"
        explainer="How you'll pay. Conventional, FHA, and VA are loan types; cash means no mortgage and no financing contingency."
        value={offer.financingType}
        onChange={(financingType) => onChange({ financingType })}
        options={FINANCING_OPTIONS}
        hydrated={hydrated}
      />
      {offer.financingType !== "cash" ? (
        <NumberField
          label="Down payment (% of price)"
          explainer="The share of the price you pay up front. The rest is your loan amount. Median is around 10% in 2025."
          value={offer.downPaymentPercent}
          onChange={(downPaymentPercent) => onChange({ downPaymentPercent })}
          min={0}
          max={100}
          step={1}
          suffix="%"
          hydrated={hydrated}
        />
      ) : null}
    </div>
  );
}

/** Closing & possession dates step (issue #12). */
export function DatesStep({
  offer,
  onChange,
  hydrated,
}: {
  offer: Offer;
  onChange: Patch;
  hydrated: boolean;
}) {
  return (
    <div className="space-y-6">
      <DateField
        label="Target closing date"
        explainer="The day ownership transfers — you sign, bring funds, and get the keys. Drives your closing-side deadlines."
        value={offer.closingDate}
        onChange={(closingDate) => onChange({ closingDate })}
        hydrated={hydrated}
      />
      <TextField
        label="Possession"
        explainer="When you actually take possession. Usually at closing, but it can differ (e.g. a seller rent-back). Longer rent-backs can create loan and insurance issues — discuss them with your attorney."
        value={offer.possession}
        onChange={(possession) => onChange({ possession })}
        placeholder="At closing"
        hydrated={hydrated}
      />
    </div>
  );
}

const COST_OPTIONS: { value: ClosingCostPreference; label: string }[] = [
  { value: "buyer-pays", label: "Buyer pays their own closing costs" },
  { value: "seller-credit", label: "Asking the seller for a closing-cost credit" },
  { value: "split", label: "Split per local custom" },
];

/** Fixtures & cost-allocation step (issue #12). */
export function PropertyStep({
  offer,
  onChange,
  hydrated,
}: {
  offer: Offer;
  onChange: Patch;
  hydrated: boolean;
}) {
  return (
    <div className="space-y-6">
      <TextField
        label="Fixtures & personal property included"
        explainer="Items you expect to convey with the home — appliances, window treatments, etc. Listing them avoids disputes later."
        value={offer.fixturesIncluded}
        onChange={(fixturesIncluded) => onChange({ fixturesIncluded })}
        placeholder="Refrigerator, washer/dryer, window treatments"
        hydrated={hydrated}
      />
      <TextField
        label="Items excluded"
        explainer="Anything you understand the seller is keeping, so there's no confusion."
        value={offer.fixturesExcluded}
        onChange={(fixturesExcluded) => onChange({ fixturesExcluded })}
        placeholder="Dining room chandelier"
        hydrated={hydrated}
      />
      <SelectField
        label="Closing-cost allocation"
        explainer="Who you're proposing pays closing costs. Allocation varies by state custom and is negotiable."
        value={offer.closingCostPreference}
        onChange={(closingCostPreference) => onChange({ closingCostPreference })}
        options={COST_OPTIONS}
        hydrated={hydrated}
      />
    </div>
  );
}
