/**
 * Tracked RentCast kill switch.
 *
 * A single, code-level off-switch for ALL RentCast-backed data sources
 * (for-sale listings AND comps). When `RENTCAST_DISABLED` is set to a truthy
 * value, every seam falls back to its safe default (mock listings / null comps)
 * even if `LISTINGS_DATA_SOURCE`/`COMPS_DATA_SOURCE` and `RENTCAST_API_KEY` are
 * still configured.
 *
 * Why a separate flag (rather than just unsetting the source vars):
 *  - It's flippable via a tracked change / env edit without disturbing the
 *    provider config, so you can cut live data fast (cost spike, vendor outage,
 *    bad data) and restore it by flipping one value back.
 *  - It's the single thing every gate checks first, so listings and comps can
 *    never get out of sync.
 *
 * Truthy = "1" | "true" | "yes" | "on" (case-insensitive). Anything else
 * (including unset/empty) leaves RentCast enabled, preserving today's behavior.
 *
 * Server-only: reads `process.env`. Never imported by client components.
 */
export function isRentCastDisabled(): boolean {
  const raw = process.env.RENTCAST_DISABLED?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}
