/**
 * Geocode seam barrel + pure suggestion → LocationValue resolution.
 *
 * Re-exports the seam pieces and adds {@link suggestionToLocationValue}, the
 * pure mapper that folds a picked {@link GeocodeSuggestion} into the existing
 * {@link LocationValue} slice the search/distance code already understands — so
 * a picked place resolves into structured lat/lng/zip/city/state (geography
 * only; FHA) without changing any downstream consumer.
 */
export type {
  GeocodeKind,
  GeocodeSource,
  GeocodeSuggestion,
} from "./types";
export {
  getGeocodeSource,
  isGeocodeActive,
  NullGeocodeSource,
} from "./provider";
export { mapPhotonResponse, PhotonGeocodeSource } from "./source-photon";
export { isGeocodeDisabled } from "./geocode-flag";

import type { GeocodeKind, GeocodeSuggestion } from "./types";
import type { LocationMode, LocationValue } from "@/components/search/location-selector";
import { DEFAULT_RADIUS } from "@/components/search/location-selector";

/** Map a suggestion kind to the {@link LocationMode} the slice expects. */
function modeForKind(kind: GeocodeKind): LocationMode {
  switch (kind) {
    case "zip":
      return "zip";
    case "city":
    case "county":
      // County folds to a city-scoped search (RentCast has no county param);
      // the lat/lng below still anchors a radius search.
      return "city";
    case "state":
      return "state";
    case "address":
    default:
      // A precise address resolves to coordinates → "current"-style radius.
      return "current";
  }
}

/**
 * PURE: fold a picked {@link GeocodeSuggestion} into a {@link LocationValue}.
 *
 * Carries real lat/lng plus whichever of zip/city/state the place resolved to,
 * and a default radius when the pick is coordinate-anchored — so RentCast search
 * and `annotateDistance` keep working unchanged. Never fabricates a field.
 */
export function suggestionToLocationValue(
  suggestion: GeocodeSuggestion,
): LocationValue {
  const mode = modeForKind(suggestion.kind);
  const base: LocationValue = {
    mode,
    lat: suggestion.lat,
    lng: suggestion.lng,
  };
  if (suggestion.zip) base.zip = suggestion.zip;
  if (suggestion.city) base.city = suggestion.city;
  if (suggestion.state) base.state = suggestion.state;
  // Coordinate-anchored picks drive a radius search.
  if (mode === "current" || mode === "city" || mode === "zip") {
    base.radius = DEFAULT_RADIUS;
  }
  return base;
}
