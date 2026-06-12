/**
 * RentCast market-statistics connector (A1 / ADR-013) — the gated, real
 * `/v1/markets` source behind the {@link MarketDataSource} seam.
 *
 * SPIKE STATUS (deferred — see backlog §6 / researcher §A1): the exact RentCast
 * `/v1/markets` field NAMES are UNVERIFIED (the docs page 403s to automated
 * fetch). So {@link mapRentCastMarket} is written DEFENSIVELY: it probes several
 * plausible field names for each metric, accepts whichever is a finite number,
 * and returns `null` for anything it can't find — never throwing, never
 * fabricating. The source is DEFAULT-OFF (`MARKET_DATA_SOURCE` unset), so this
 * code path is dormant until someone verifies the names against a live key.
 *
 * Known from the researcher brief: `/v1/markets` supplies DOM, inventory, new-
 * listing counts, and a LIST-price trend. It does NOT supply a list-to-sale
 * ratio (list-side only) or a months-of-supply sold-rate denominator — those
 * stay MANUAL fields, so the mapper leaves them undefined.
 *
 * Server-only: the API key is read from `process.env.RENTCAST_API_KEY`, never
 * hardcoded, logged, or exposed to the browser.
 */

import type { MarketDataSource, MarketQuery } from "./source";
import type { MarketStats } from "./types";

const RENTCAST_MARKETS_URL = "https://api.rentcast.io/v1/markets";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function asFiniteNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

/**
 * Probe a record for the FIRST candidate key that holds a finite number. Used to
 * tolerate the unverified `/v1/markets` field names — we accept whichever of the
 * plausible names exists. Also peeks one level into a nested `saleData` object,
 * which RentCast is documented to nest sale stats under.
 */
function pickNumber(
  obj: Record<string, unknown>,
  keys: string[],
): number | undefined {
  for (const k of keys) {
    const direct = asFiniteNumber(obj[k]);
    if (direct !== undefined) return direct;
  }
  const sale = obj.saleData;
  if (isRecord(sale)) {
    for (const k of keys) {
      const nested = asFiniteNumber(sale[k]);
      if (nested !== undefined) return nested;
    }
  }
  return undefined;
}

/**
 * Pure, DEFENSIVE mapper: a RentCast `/v1/markets` payload → our
 * {@link MarketStats} (or `null` when nothing usable is present).
 *
 * Defensive by design (unverified field names):
 *   - days on market   ← averageDaysOnMarket / medianDaysOnMarket / daysOnMarket
 *   - price trend       ← (computed externally / not always present) probes a few
 *                         "...Change" keys; left undefined if absent.
 *   - median price      ← medianPrice / medianListPrice / averagePrice
 *   - months-of-supply  ← NOT mapped (no sold-rate denominator) → manual
 *   - list-to-sale       ← NOT mapped (list-side only)          → manual
 *
 * A non-object payload → `null`. If no field resolves, → `null` (so the tool
 * falls back to manual entry rather than showing an empty/false read).
 */
export function mapRentCastMarket(
  payload: unknown,
  query: MarketQuery = {},
): MarketStats | null {
  if (!isRecord(payload)) return null;

  const daysOnMarket = pickNumber(payload, [
    "averageDaysOnMarket",
    "medianDaysOnMarket",
    "daysOnMarket",
    "averageDom",
    "medianDom",
  ]);
  const medianPrice = pickNumber(payload, [
    "medianPrice",
    "medianListPrice",
    "averagePrice",
    "averageListPrice",
  ]);
  const priceTrendPct = pickNumber(payload, [
    "priceChangePct",
    "medianPriceChangePercent",
    "priceChangePercent",
  ]);

  // Nothing usable resolved → null (manual-entry fallback).
  if (
    daysOnMarket === undefined &&
    medianPrice === undefined &&
    priceTrendPct === undefined
  ) {
    return null;
  }

  const asOf =
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
    priceTrendPct,
    // list-to-sale & months-of-supply are not available from this endpoint.
    asOf,
    source: "rentcast",
  };
}

/**
 * Live RentCast market source. Server-only. Queries `/v1/markets` by ZIP and
 * maps the response defensively. Returns `null` on ANY failure (no key, no zip,
 * non-OK response, thrown error) — it never throws and never fabricates.
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
