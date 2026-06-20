/**
 * Photon (komoot) geocode source (UX continuity, Item 4 / S0a) — the FIRST,
 * default geocode source behind the {@link GeocodeSource} seam. Photon is
 * KEYLESS and free (`https://photon.komoot.io/api/?q=...`), so the seam ships
 * gate-free with no env config. A production swap to a keyed provider (Radar /
 * Geoapify) is one new `source-*.ts` + one `GEOCODE_SOURCE` value.
 *
 * Like the RentCast connector: a PURE mapper ({@link mapPhotonResponse}) plus a
 * fetch that returns `[]` on ANY failure rather than throwing, and NEVER
 * fabricates a place.
 *
 * Photon response schema (GeoJSON FeatureCollection):
 *   {
 *     features: [
 *       {
 *         geometry: { coordinates: [lng, lat] },
 *         properties: {
 *           osm_key, osm_value, type,          // "city" | "district" | "state" | ...
 *           name, street, housenumber,
 *           postcode, city, county, state,
 *           countrycode                        // "US"
 *         }
 *       }
 *     ]
 *   }
 *
 * FHA (geography only): we map ONLY to the five geographic kinds
 * (zip · address · city · state · county). A Photon feature whose `type` is a
 * neighborhood/district (a steering vector) is NOT emitted as a neighborhood —
 * it's either folded to its city or skipped. No demographic field is read.
 */

import type {
  GeocodeKind,
  GeocodeSource,
  GeocodeSuggestion,
} from "./types";

const PHOTON_URL = "https://photon.komoot.io/api/";
/** How many suggestions to ask Photon for. */
const PHOTON_LIMIT = 8;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;
}

function asFiniteNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

/** Two-letter US state codes Photon may return as a full name → code. */
function stateCode(props: Record<string, unknown>): string | undefined {
  // Photon US results carry a two-letter `state` only sometimes; more often the
  // full state name. We accept a 2-letter code as-is and leave longer names as
  // the display state (geography only; no lookup table needed for correctness).
  const raw = asString(props.state);
  if (!raw) return undefined;
  if (raw.length === 2) return raw.toUpperCase();
  return raw;
}

/**
 * Decide a feature's geographic {@link GeocodeKind} from its Photon `type` /
 * osm tags. Returns `undefined` for kinds we deliberately don't surface
 * (notably neighborhoods/districts — an FHA steering vector).
 */
function kindFor(props: Record<string, unknown>): GeocodeKind | undefined {
  const hasHouse = Boolean(asString(props.housenumber) || asString(props.street));
  const hasPostcode = Boolean(asString(props.postcode));
  const type = asString(props.type)?.toLowerCase();
  const osmKey = asString(props.osm_key)?.toLowerCase();
  const osmValue = asString(props.osm_value)?.toLowerCase();

  // A street address (house number or street present).
  if (hasHouse) return "address";

  switch (type) {
    case "house":
    case "street":
      return "address";
    case "postcode":
      return "zip";
    case "city":
    case "town":
    case "village":
    case "municipality":
      return "city";
    case "county":
      return "county";
    case "state":
    case "region":
      return "state";
    // Neighborhoods / districts / localities are FHA steering vectors — not
    // surfaced as their own kind.
    case "district":
    case "locality":
    case "neighbourhood":
    case "suburb":
      return undefined;
    default:
      break;
  }

  // Fall back to osm tags when `type` is absent/unknown.
  if (osmKey === "place") {
    if (osmValue === "city" || osmValue === "town" || osmValue === "village")
      return "city";
    if (osmValue === "county") return "county";
    if (osmValue === "state" || osmValue === "region") return "state";
    if (osmValue === "suburb" || osmValue === "neighbourhood") return undefined;
  }
  if (osmKey === "boundary" && osmValue === "administrative") {
    // Ambiguous admin boundary — only surface when we can name a state/county.
    if (asString(props.county)) return "county";
    if (asString(props.state) && !asString(props.city)) return "state";
  }
  if (hasPostcode && asString(props.name)?.match(/^\d{5}$/)) return "zip";

  return undefined;
}

function labelFor(
  kind: GeocodeKind,
  props: Record<string, unknown>,
): string | undefined {
  const name = asString(props.name);
  switch (kind) {
    case "address": {
      const num = asString(props.housenumber);
      const street = asString(props.street) ?? name;
      if (street && num) return `${num} ${street}`;
      return street ?? name;
    }
    case "zip":
      return asString(props.postcode) ?? name;
    case "city":
      return name ?? asString(props.city);
    case "county":
      return name ?? asString(props.county);
    case "state":
      return name ?? asString(props.state);
  }
}

/**
 * PURE: map a Photon GeoJSON payload → typed {@link GeocodeSuggestion}[].
 *
 * - Only US features with valid coordinates + a recognized geographic kind are
 *   emitted (neighborhood/district features are skipped — FHA).
 * - Absent fields stay `undefined`; nothing is fabricated.
 * - Any garbage / non-FeatureCollection payload yields `[]`. Never throws.
 */
export function mapPhotonResponse(payload: unknown): GeocodeSuggestion[] {
  if (!isRecord(payload)) return [];
  const features = payload.features;
  if (!Array.isArray(features)) return [];

  const out: GeocodeSuggestion[] = [];
  const seen = new Set<string>();

  for (const feature of features) {
    if (!isRecord(feature)) continue;
    const props = isRecord(feature.properties) ? feature.properties : undefined;
    const geometry = isRecord(feature.geometry) ? feature.geometry : undefined;
    if (!props || !geometry) continue;

    // US only (geography we serve; avoids leaking foreign places into a US box).
    const country = asString(props.countrycode)?.toUpperCase();
    if (country && country !== "US") continue;

    const coords = geometry.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) continue;
    const lng = asFiniteNumber(coords[0]);
    const lat = asFiniteNumber(coords[1]);
    if (lat === undefined || lng === undefined) continue;

    const kind = kindFor(props);
    if (!kind) continue;

    const label = labelFor(kind, props);
    if (!label) continue;

    const state = stateCode(props);
    const county = asString(props.county);
    const city = asString(props.city);
    const zip = asString(props.postcode);

    // Secondary context line: county + state where we have them.
    const contextParts = [
      kind !== "city" ? city : undefined,
      kind !== "county" ? county : undefined,
      kind !== "state" ? state : undefined,
    ].filter(Boolean);
    const context = contextParts.length > 0 ? contextParts.join(" · ") : undefined;

    const id = `${kind}:${lat.toFixed(4)},${lng.toFixed(4)}:${label.toLowerCase()}`;
    if (seen.has(id)) continue;
    seen.add(id);

    out.push({
      id,
      kind,
      label,
      ...(context ? { context } : {}),
      lat,
      lng,
      ...(zip ? { zip } : {}),
      ...(city ? { city } : {}),
      ...(state ? { state } : {}),
      ...(county ? { county } : {}),
    });
  }

  return out;
}

/**
 * The keyless Photon source. Server-usable (the route wraps it). Returns `[]`
 * for an empty query and on ANY fetch/parse failure (never throws), so the box
 * degrades gracefully to free-text entry when the geocoder is unreachable.
 */
export class PhotonGeocodeSource implements GeocodeSource {
  async suggest(query: string): Promise<GeocodeSuggestion[]> {
    const q = query.trim();
    if (!q) return [];

    const url = new URL(PHOTON_URL);
    url.searchParams.set("q", q);
    url.searchParams.set("limit", String(PHOTON_LIMIT));
    // Bias to the US; Photon honors `lang` for labels.
    url.searchParams.set("lang", "en");

    try {
      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return [];
      const payload: unknown = await res.json();
      return mapPhotonResponse(payload);
    } catch {
      return [];
    }
  }
}
