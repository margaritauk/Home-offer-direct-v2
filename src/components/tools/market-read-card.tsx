import type { MarketBand, MarketRead } from "@/lib/market/types";

/**
 * Presentational read-only view of a {@link MarketRead} (A1 + J4 summary band).
 *
 * Reused in two places so the read is computed ONCE (A1's `classifyMarket`) and
 * surfaced consistently: the full Market Conditions tool and the compact summary
 * band at the top of the Offer Builder.
 *
 * Accessibility: the gauge is NOT color-only — it carries a text band label and
 * an `sr-only` summary. The container is wrapped by the caller in an
 * `aria-live="polite"` region so updates are announced.
 */

/** Position 0–100 (buyer → seller) for the gauge marker. */
const BAND_POSITION: Record<MarketBand, number> = {
  "strong-buyer": 8,
  buyer: 30,
  balanced: 50,
  seller: 70,
  "strong-seller": 92,
  unknown: 50,
};

const BAND_TONE: Record<MarketBand, string> = {
  "strong-buyer": "bg-emerald-500",
  buyer: "bg-emerald-400",
  balanced: "bg-slate-400",
  seller: "bg-amber-400",
  "strong-seller": "bg-amber-500",
  unknown: "bg-slate-300",
};

const LEAN_LABEL: Record<string, string> = {
  buyer: "Favors buyers",
  seller: "Favors sellers",
  balanced: "Neutral",
  unknown: "Unclear",
};

export function MarketReadCard({
  read,
  compact = false,
}: {
  read: MarketRead;
  compact?: boolean;
}) {
  const isUnknown = read.band === "unknown";

  return (
    <div className="space-y-4">
      {/* Headline + gauge */}
      <div className="rounded-xl border border-slate-200 p-5">
        <p className="text-sm font-medium text-ink-muted">Market read</p>
        <p className="mt-1 text-lg font-semibold text-ink">{read.headline}</p>

        {/* Gauge — buyer (left) ↔ seller (right). Text label + sr-only below. */}
        <div className="mt-4" aria-hidden>
          <div className="flex justify-between text-xs text-ink-muted">
            <span>Buyer&apos;s market</span>
            <span>Seller&apos;s market</span>
          </div>
          <div className="relative mt-1 h-2 w-full rounded-full bg-gradient-to-r from-emerald-200 via-slate-200 to-amber-200">
            <span
              className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ${BAND_TONE[read.band]}`}
              style={{ left: `${BAND_POSITION[read.band]}%` }}
            />
          </div>
        </div>
        <p className="sr-only">
          {isUnknown
            ? "Market read: not enough data yet."
            : `Market read: ${read.headline}.`}
        </p>
        {read.lowConfidence && !isUnknown ? (
          <p className="mt-2 text-xs font-medium text-amber-700">
            Low confidence — based on limited data.
          </p>
        ) : null}
      </div>

      {/* Per-signal trade-offs (the underlying numbers, never just a label) */}
      {read.factors.length > 0 ? (
        <ul className={compact ? "space-y-2" : "space-y-3"}>
          {read.factors.map((f) => (
            <li
              key={f.id}
              className="rounded-lg border border-slate-200 p-3 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-ink">{f.label}</span>
                <span className="font-semibold text-ink">{f.display}</span>
              </div>
              <p className="mt-0.5 text-xs font-medium text-ink-muted">
                {LEAN_LABEL[f.lean] ?? ""}
              </p>
              {!compact ? (
                <p className="mt-1 text-ink-soft">{f.meaning}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {/* Caveats — snapshot / low-confidence / missing-signal */}
      {read.caveats.length > 0 ? (
        <ul className="space-y-1 text-xs text-ink-muted">
          {read.caveats.map((c, i) => (
            <li key={i}>• {c}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
