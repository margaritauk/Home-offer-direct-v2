"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useStageTool } from "@/hooks/use-stage-tool";
import {
  compsEstimate,
  normalizeCompsState,
  type CompsState,
} from "@/lib/tools/comps";
import { classifyMarket } from "@/lib/market/classify";
import type { MarketStats } from "@/lib/market/types";
import {
  suggestPriceBand,
  type PriceBand,
} from "@/lib/offer/suggested-price";
import {
  summarizeDiligence,
  type PreOfferDiligence,
} from "@/lib/offer/pre-offer-diligence";
import { screenText } from "@/lib/ai/screening";
import { track } from "@/lib/analytics";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { TrustCallout } from "@/components/trust-callout";
import { ValidatedNumberField } from "@/components/tools/validated-field";
import { MarketReadCard } from "@/components/tools/market-read-card";

/**
 * A2 — "What should I offer?" band/step INSIDE the Offer Builder (+ bundled I3).
 *
 * Reads the buyer's stored comps (`hod:tool:comps:v1`) and market read
 * (`hod:tool:market:v1`) — co-located inline, no cross-tool coupling beyond the
 * shared keys — and composes them with the PURE `suggestPriceBand`. It also
 * captures light I3 pre-offer diligence fields.
 *
 * HARD UPL RULE: it shows a comp-anchored RANGE with rationale and NEVER
 * auto-fills the binding offer price — the buyer types their own number in the
 * Price step. There is no "use this price" button.
 */

/** The market tool's persisted shape (mirrors market-conditions.tsx). */
interface MarketToolState {
  areaLabel?: string;
  daysOnMarket?: number;
  listToSaleRatio?: number;
  monthsOfSupply?: number;
  priceTrendPct?: number;
}

const DILIGENCE_INITIAL: PreOfferDiligence = {};

function present(n: number | undefined): number | undefined {
  return typeof n === "number" && n > 0 ? n : undefined;
}

export function SuggestedRangeStep({ listPrice }: { listPrice?: number }) {
  const { value: compsRaw, hydrated: compsHydrated } = useStageTool<CompsState>(
    "comps",
    { homes: [] },
  );
  const { value: market, hydrated: marketHydrated } =
    useStageTool<MarketToolState>("market", {});
  const {
    value: diligence,
    hydrated: dilHydrated,
    save: saveDiligence,
  } = useStageTool<PreOfferDiligence>("pre-offer-diligence", DILIGENCE_INITIAL);

  const [showSource, setShowSource] = useState(false);

  // Comps estimate from the first home that has usable comps.
  const estimate = useMemo(() => {
    const state = normalizeCompsState(compsRaw);
    for (const home of state.homes) {
      const est = compsEstimate({ sqft: home.sqft }, home.comps);
      if (est.usableCount > 0 && est.estimatedLow !== null) return est;
    }
    return null;
  }, [compsRaw]);

  const marketRead = useMemo(() => {
    const stats: MarketStats = {
      daysOnMarket: present(market.daysOnMarket),
      listToSaleRatio: present(market.listToSaleRatio),
      monthsOfSupply: present(market.monthsOfSupply),
      priceTrendPct:
        typeof market.priceTrendPct === "number" && market.priceTrendPct !== 0
          ? market.priceTrendPct
          : undefined,
      source: "manual",
    };
    return classifyMarket(stats);
  }, [market]);

  const band: PriceBand = useMemo(
    () =>
      suggestPriceBand({
        compsEstimate: estimate,
        marketRead,
        listPrice,
      }),
    [estimate, marketRead, listPrice],
  );

  const diligenceSummary = useMemo(
    () => summarizeDiligence(diligence),
    [diligence],
  );

  // Funnel: fire "suggested_range_viewed" once, when a real band is shown.
  const firedRef = useRef(false);
  useEffect(() => {
    if (!compsHydrated || !marketHydrated) return;
    if (band.basis.hasComps && !firedRef.current) {
      firedRef.current = true;
      track("suggested_range_viewed", {
        hasComps: band.basis.hasComps,
        hasMarket: band.basis.hasMarket,
        emphasis: band.emphasis,
      });
    }
  }, [compsHydrated, marketHydrated, band]);

  if (!compsHydrated || !marketHydrated || !dilHydrated) {
    return <p className="text-sm text-ink-muted">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Suggested price range</h3>
        <p className="mt-1 text-sm text-ink-soft">
          A starting reference built from your comps and your market read. It&apos;s
          a range, not a number — you decide what to offer in the Price step.
        </p>
      </div>

      {/* The band (or the empty/partial prompt) */}
      <section
        aria-live="polite"
        aria-label="Suggested price range"
        className="rounded-2xl border border-slate-200 p-5"
      >
        {band.basis.hasComps && band.low !== null && band.high !== null ? (
          <div>
            <p className="text-sm font-medium text-ink-muted">
              Comps suggest a range of
            </p>
            <p className="text-2xl font-bold text-ink">
              ${Math.round(band.low).toLocaleString("en-US")} – $
              {Math.round(band.high).toLocaleString("en-US")}
            </p>
          </div>
        ) : (
          <p className="font-medium text-ink">
            {band.basis.hasMarket
              ? "Add comps to see a suggested range."
              : "Add comps and a market read to see a suggested range."}
          </p>
        )}

        <ul className="mt-3 space-y-2 text-sm text-ink-soft">
          {band.rationale.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>

        {/* Prompts for whatever input is missing */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {!band.basis.hasComps ? (
            <Link
              href="/tools/comps"
              className="font-semibold text-brand-700 hover:underline"
            >
              Open Comps Worksheet →
            </Link>
          ) : null}
          {!band.basis.hasMarket ? (
            <Link
              href="/tools/market"
              className="font-semibold text-brand-700 hover:underline"
            >
              Add a market read →
            </Link>
          ) : null}
          <Link
            href="/tools/offer-help"
            className="font-medium text-brand-700 hover:underline"
          >
            Competitive tactics &amp; appraisal-gap →
          </Link>
        </div>

        {/* "Where this comes from" transparency disclosure */}
        {band.basis.hasComps || band.basis.hasMarket ? (
          <div className="mt-4">
            <button
              type="button"
              className="text-sm font-medium text-brand-700 hover:underline"
              aria-expanded={showSource}
              onClick={() => setShowSource((v) => !v)}
            >
              {showSource ? "Hide" : "Where this comes from"}
            </button>
            {showSource ? (
              <div className="mt-3 space-y-4 rounded-lg bg-slate-50 p-4">
                {band.basis.hasComps && estimate ? (
                  <p className="text-sm text-ink-soft">
                    Comps math: {estimate.usableCount} usable comp
                    {estimate.usableCount === 1 ? "" : "s"} →{" "}
                    {estimate.minPricePerSqft !== null
                      ? `$${Math.round(estimate.minPricePerSqft)}–$${Math.round(
                          estimate.maxPricePerSqft ?? 0,
                        )}/sqft adjusted, applied to your subject's size.`
                      : "—"}
                  </p>
                ) : null}
                {band.basis.hasMarket ? (
                  <MarketReadCard read={marketRead} compact />
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {/* I3 — pre-offer due diligence (light, FHA-neutral) */}
      <section className="space-y-4 rounded-2xl border border-slate-200 p-5">
        <div>
          <h3 className="text-base font-semibold">
            Pre-offer context (optional)
          </h3>
          <p className="mt-1 text-sm text-ink-soft">
            A few facts agents pull before offering. They can nudge where in the
            range you come in — you still decide.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ValidatedNumberField
            label="Days on market"
            value={diligence.daysOnMarket ?? 0}
            onChange={(n) =>
              saveDiligence((p) => ({ ...p, daysOnMarket: n }))
            }
            bounds={{ min: 0 }}
            unit="days"
          />
          <ValidatedNumberField
            label="Price changes on this listing"
            value={diligence.priceChangeCount ?? 0}
            onChange={(n) =>
              saveDiligence((p) => ({ ...p, priceChangeCount: n }))
            }
            bounds={{ min: 0 }}
          />
          <ValidatedNumberField
            label="Last sold price"
            value={diligence.lastSoldPrice ?? 0}
            onChange={(n) =>
              saveDiligence((p) => ({ ...p, lastSoldPrice: n }))
            }
            bounds={{ min: 0 }}
            unit="$"
          />
          <ValidatedNumberField
            label="Tax assessment"
            value={diligence.taxAssessment ?? 0}
            onChange={(n) =>
              saveDiligence((p) => ({ ...p, taxAssessment: n }))
            }
            bounds={{ min: 0 }}
            unit="$"
          />
        </div>

        <label className="block">
          <span className="text-sm font-medium text-ink-soft">
            Why selling, if known (unverified)
          </span>
          <textarea
            className="field mt-1"
            rows={2}
            placeholder="e.g. relocating for work"
            value={diligence.sellerMotivation ?? ""}
            onChange={(e) =>
              // Screen on the way in (FHA) so protected-class phrasing never
              // persists or reaches any template.
              saveDiligence((p) => ({
                ...p,
                sellerMotivation: screenText(e.target.value).text,
              }))
            }
          />
          <span className="mt-1 block text-xs text-ink-muted">
            Seller motivation is often hearsay — treat it as unverified context,
            never fact. Keep it to transactional facts.
          </span>
        </label>

        {!diligenceSummary.empty ? (
          <div className="space-y-2 text-sm">
            {diligenceSummary.lines.map((l) => (
              <p key={l.id} className="text-ink-soft">
                <span className="font-medium text-ink">{l.label}:</span>{" "}
                {l.value}
                {l.note ? (
                  <span className="block text-xs text-ink-muted">{l.note}</span>
                ) : null}
              </p>
            ))}
            {diligenceSummary.bandNudge ? (
              <TrustCallout tone="info" title="Where this might point">
                {diligenceSummary.bandNudge}
              </TrustCallout>
            ) : null}
          </div>
        ) : null}
      </section>

      <DisclaimerBanner>
        This range is informational, not a recommendation — it combines your comps
        and market read and never tells you what to offer or auto-fills your price.
        You type your own number, and contract terms should be reviewed with a
        licensed attorney.
      </DisclaimerBanner>
    </div>
  );
}
