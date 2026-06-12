"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useStageTool } from "@/hooks/use-stage-tool";
import { classifyMarket } from "@/lib/market/classify";
import type { MarketStats } from "@/lib/market/types";
import { screenText } from "@/lib/ai/screening";
import { ValidatedNumberField } from "./validated-field";
import { ToolDisclaimer } from "./tool-disclaimer";
import { MarketReadCard } from "./market-read-card";
import { Term } from "@/components/term";

/**
 * Market Conditions tool (A1). MANUAL-ENTRY FIRST: the buyer types the four
 * signals and gets a live, plain-English buyer's/balanced/seller's read with the
 * underlying numbers and trade-offs. The live RentCast `/v1/markets` pull is a
 * deferred second M (default-off seam) — until it's wired and verified, this
 * tool works fully on manual entry, which carries no infra risk.
 *
 * The read is computed by the single pure `classifyMarket` (also consumed by A2)
 * — we never re-classify. Persisted via `useStageTool("market")` so the Offer
 * Builder's summary band (J4) and A2 can read the same stored stats.
 *
 * Compliance: FHA — transactional metrics only; the optional "market notes" free
 * text is screened with `screenText` before it's stored. Source + date stamped.
 * UPL — the read describes conditions + trade-offs, never a directive price.
 */

/** Persisted shape for the market tool. Numbers are 0 when unset (UI maps that). */
export interface MarketToolState {
  areaLabel: string;
  daysOnMarket: number;
  listToSaleRatio: number;
  monthsOfSupply: number;
  priceTrendPct: number;
  /** Optional neutral market notes (screened). */
  marketNotes: string;
}

const INITIAL: MarketToolState = {
  areaLabel: "",
  daysOnMarket: 0,
  listToSaleRatio: 0,
  monthsOfSupply: 0,
  priceTrendPct: 0,
  marketNotes: "",
};

/** Map a 0 ("unset") to undefined so the classifier treats it as absent. */
function present(n: number): number | undefined {
  return n > 0 ? n : undefined;
}

export function MarketConditions() {
  const { value, hydrated, save } = useStageTool<MarketToolState>(
    "market",
    INITIAL,
  );

  const stats: MarketStats = useMemo(
    () => ({
      areaLabel: value.areaLabel || undefined,
      daysOnMarket: present(value.daysOnMarket),
      listToSaleRatio: present(value.listToSaleRatio),
      // price trend can be negative, so don't gate it on > 0:
      monthsOfSupply: present(value.monthsOfSupply),
      priceTrendPct: value.priceTrendPct !== 0 ? value.priceTrendPct : undefined,
      asOf: undefined,
      source: "manual",
    }),
    [value],
  );

  const read = useMemo(() => classifyMarket(stats), [stats]);

  if (!hydrated) return <p className="text-sm text-ink-muted">Loading…</p>;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Inputs — manual entry first */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">
            Enter the numbers for your area
          </h2>
          <p className="text-sm text-ink-muted">
            Pull these from a market page on Zillow, Redfin, or Realtor.com for
            your ZIP and home type. Leave any you don&apos;t have — the read works
            on what you give it.
          </p>
        </div>

        <label className="block max-w-sm">
          <span className="text-sm font-medium text-ink-soft">
            Area / segment (optional)
          </span>
          <input
            type="text"
            className="field mt-1"
            placeholder="e.g. 78701 · single-family"
            value={value.areaLabel}
            onChange={(e) => save((p) => ({ ...p, areaLabel: e.target.value }))}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <ValidatedNumberField
            label="Months of supply"
            value={value.monthsOfSupply}
            onChange={(n) => save((p) => ({ ...p, monthsOfSupply: n }))}
            bounds={{ min: 0, softMax: 24 }}
            step={0.1}
            unit="mo"
            hint="The most-citable signal."
          />
          <ValidatedNumberField
            label="Days on market"
            value={value.daysOnMarket}
            onChange={(n) => save((p) => ({ ...p, daysOnMarket: n }))}
            bounds={{ min: 0, softMax: 365 }}
            unit="days"
          />
          <ValidatedNumberField
            label="List-to-sale ratio"
            value={value.listToSaleRatio}
            onChange={(n) => save((p) => ({ ...p, listToSaleRatio: n }))}
            bounds={{ min: 0, softMin: 80, softMax: 120 }}
            step={0.1}
            unit="%"
          />
          <ValidatedNumberField
            label="Price trend (recent % change)"
            value={value.priceTrendPct}
            onChange={(n) => save((p) => ({ ...p, priceTrendPct: n }))}
            bounds={{ softMin: -30, softMax: 30 }}
            step={0.1}
            unit="%"
          />
        </div>

        <p className="text-xs text-ink-muted">
          Glossary: <Term slug="months-of-supply">months of supply</Term>,{" "}
          <Term slug="days-on-market">days on market</Term>,{" "}
          <Term slug="list-to-sale-ratio">list-to-sale ratio</Term>.
        </p>
      </section>

      {/* Live read */}
      <section aria-live="polite" aria-label="Market read">
        <MarketReadCard read={read} />
        {read.band !== "unknown" ? (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Link
              href="/tools/offer-builder"
              className="text-sm font-semibold text-brand-700 hover:underline"
            >
              What should I offer? Carry this into your offer →
            </Link>
            <Link
              href="/tools/comps"
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              Open the Comps Worksheet →
            </Link>
          </div>
        ) : null}
        <p className="mt-3 text-xs text-ink-muted" data-testid="market-source">
          Source: figures you entered (manual). As of {today}. A live data pull
          (RentCast) is not enabled in this build.
        </p>
      </section>

      {/* Optional neutral notes — screened (FHA) */}
      <section className="space-y-2">
        <label className="block">
          <span className="text-sm font-medium text-ink-soft">
            Market notes (optional)
          </span>
          <textarea
            className="field mt-1"
            rows={2}
            placeholder="e.g. inventory rising since spring"
            value={value.marketNotes}
            onChange={(e) =>
              // Screen on the way in so protected-class phrasing never persists.
              save((p) => ({ ...p, marketNotes: screenText(e.target.value).text }))
            }
          />
        </label>
        <p className="text-xs text-ink-muted">
          Keep notes to market facts — no neighborhood &quot;desirability&quot;,
          school, or demographic framing (those aren&apos;t market data and can
          steer).
        </p>
      </section>

      <ToolDisclaimer>
        Estimates only — not advice. This describes market conditions and the
        trade-offs buyers typically weigh; it never tells you what to offer.
        Conditions move, so treat this as a snapshot.
      </ToolDisclaimer>
    </div>
  );
}
