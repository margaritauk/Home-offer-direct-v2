/**
 * RentCast market-statistics connector (A1 / ADR-013) — the gated, real
 * `/v1/markets` source behind the {@link MarketDataSource} seam.
 *
 * SPIKE STATUS (CLOSED): a live `GET /v1/markets?zipCode=NNNNN&dataType=Sale`
 * response has been captured, so {@link mapRentCastMarket} now maps the
 * CONFIRMED schema rather than probing guessed field names. The confirmed shape
 * nests sale stats under `saleData`:
 *
 *   saleData.medianDaysOnMarket / averageDaysOnMarket   → days on market
 *   saleData.medianPrice / averagePrice                 → price context
 *   saleData.totalListings / newListings                → inventory context
 *   saleData.history { "YYYY-MM": { medianPrice, ... } } → price trend (computed)
 *
 * Confirmed NOT available from this endpoint (active-listing data only — no
 * closed-sale ratio and no absorption/sold-rate denominator):
 *   - list-to-sale ratio  → stays MANUAL (left null)
 *   - months-of-supply    → stays MANUAL (left null)
 *
 * The source stays DEFAULT-OFF (`MARKET_DATA_SOURCE` unset) and gated by
 * `RENTCAST_API_KEY` + `isRentCastDisabled()` via {@link getMarketDataSource}.
 * The mapper never throws and never fabricates: anything it can't resolve stays
 * undefined, and a payload with nothing usable maps to `null` (manual fallback).
 *
 * Server-only: the API key is read from `process.env.RENTCAST_API_KEY`, never
 * hardcoded, logged, or exposed to the browser.
 */

import type { MarketDataSource, MarketQuery } from "./source";
import type { MarketStats } from "./types";

const RENTCAST_MARKETS_URL = "https://api.rentcast.io/v1/markets";

/** Price moves within ±this percent read as "flat" (neither side leans). */
const TREND_FLAT_BAND_PCT = 2;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function asFiniteNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

/** First key in `keys` that holds a finite number on `obj`, else undefined. */
function pickNumber(
  obj: Record<string, unknown>,
  keys: string[],
): number | undefined {
  for (const k of keys) {
    const n = asFiniteNumber(obj[k]);
    if (n !== undefined) return n;
  }
  return undefined;
}

/** Outcome of {@link computePriceTrend}: a signed % change, or null if unknown. */
export interface PriceTrend {
  /** Signed percent change earliest → latest month (e.g. +24.5). */
  pct: number;
  /** Direction label from the ±{@link TREND_FLAT_BAND_PCT}% flat band. */
  label: "rising" | "flat" | "falling";
}

/**
 * Compute a price trend from a confirmed `saleData.history` map of
 * `{ "YYYY-MM": { medianPrice } }`. PURE.
 *
 * Sorts the month keys lexically (ISO `YYYY-MM` sorts chronologically), then
 * compares the EARLIEST available month's `medianPrice` to the LATEST month's.
 * Returns `null` when there are fewer than two months with a usable
 * `medianPrice`, or when the earliest median is non-positive (can't form a %).
 */
export function computePriceTrend(history: unknown): PriceTrend | null {
  if (!isRecord(history)) return null;

  const points: Array<{ month: string; medianPrice: number }> = [];
  for (const [month, entry] of Object.entries(history)) {
    if (!isRecord(entry)) continue;
    const medianPrice = asFiniteNumber(entry.medianPrice);
    if (medianPrice === undefined) continue;
    points.push({ month, medianPrice });
  }

  // Need at least two usable history points to compute a trend.
  if (points.length < 2) return null;

  points.sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));
  const earliest = points[0].medianPrice;
  const latest = points[points.length - 1].medianPrice;

  // Guard division by a non-positive base.
  if (!(earliest > 0)) return null;

  const pct = ((latest - earliest) / earliest) * 100;
  const label: PriceTrend["label"] =
    pct > TREND_FLAT_BAND_PCT
      ? "rising"
      : pct < -TREND_FLAT_BAND_PCT
        ? "falling"
        : "flat";

  return { pct, label };
}

/**
 * Pure mapper: a CONFIRMED RentCast `/v1/markets` payload → our
 * {@link MarketStats} (or `null` when nothing usable is present).
 *
 * Confirmed field mapping (all under `saleData`, null-safe):
 *   - days on market    ← medianDaysOnMarket (primary) → averageDaysOnMarket
 *                         (fallback). MEDIAN leads — averages are skewed by the
 *                         long tail (maxDaysOnMarket runs into the hundreds).
 *   - price trend (%)    ← computed from `saleData.history` (earliest → latest
 *                         month medianPrice); null with < 2 history points.
 *   - median / avg price ← medianPrice → averagePrice (context only).
 *   - inventory context  ← totalListings, newListings (context only).
 *   - list-to-sale ratio ← NOT in this endpoint (active-listing data, no closed-
 *                         sale price) → left null → stays MANUAL.
 *   - months-of-supply   ← NOT in this endpoint (no absorption / sold-rate
 *                         denominator) → left null → stays MANUAL.
 *
 * A non-object payload → `null`. If nothing usable resolves, → `null` (so the
 * tool falls back to manual entry rather than showing an empty/false read).
 */
export function mapRentCastMarket(
  payload: unknown,
  query: MarketQuery = {},
): MarketStats | null {
  if (!isRecord(payload)) return null;

  // Confirmed shape nests sale stats under `saleData`.
  const sale = isRecord(payload.saleData) ? payload.saleData : payload;

  const daysOnMarket = pickNumber(sale, [
    "medianDaysOnMarket",
    "averageDaysOnMarket",
  ]);
  const medianPrice = pickNumber(sale, ["medianPrice", "averagePrice"]);
  const averagePrice = asFiniteNumber(sale.averagePrice);
  const totalListings = asFiniteNumber(sale.totalListings);
  const newListings = asFiniteNumber(sale.newListings);

  const trend = computePriceTrend(sale.history);
  const priceTrendPct = trend?.pct;

  // Nothing usable resolved → null (manual-entry fallback).
  if (
    daysOnMarket === undefined &&
    medianPrice === undefined &&
    priceTrendPct === undefined &&
    totalListings === undefined &&
    newListings === undefined
  ) {
    return null;
  }

  const asOf =
    asString(sale.lastUpdatedDate) ??
    asString(payload.lastUpdatedDate) ??
    asString(payload.date) ??
    new Date().toISOString().slice(0, 10);

  const areaLabel =
    query.areaLabel ??
    asString(payload.zipCode) ??
    asString(payload.id) ??
    query.zip;

  return {
    areaLabel,
    daysOnMarket,
    medianPrice,
    averagePrice,
    totalListings,
    newListings,
    priceTrendPct,
    // list-to-sale & months-of-supply are NOT available from /v1/markets
    // (active-listing data only) — left undefined so they stay MANUAL.
    asOf,
    source: "rentcast",
  };
}

/**
 * Live RentCast market source. Server-only. Queries `/v1/markets` by ZIP and
 * maps the confirmed response shape. Returns `null` on ANY failure (no key, no
 * zip, non-OK response, thrown error) — it never throws and never fabricates.
 */
export class RentCastMarketDataSource implements MarketDataSource {
  async fetchMarketStats(query: MarketQuery): Promise<MarketStats | null> {
    const apiKey = process.env.RENTCAST_API_KEY;
    const zip = query.zip?.trim();

    // No key or no zip → can't query; return null rather than guess.
    if (!apiKey || !zip) return null;

    const url = `${RENTCAST_MARKETS_URL}?zipCode=${encodeURIComponent(
      zip,
    )}&dataType=Sale`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { "X-Api-Key": apiKey },
      });
      if (!res.ok) return null;
      return mapRentCastMarket(await res.json(), query);
    } catch {
      return null;
    }
  }
}
