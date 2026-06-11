"use client";

import { useCallback, useState } from "react";

export type GeolocationStatus =
  | "idle"
  | "loading"
  | "granted"
  | "denied"
  | "unsupported"
  | "insecure";

export interface Coords {
  lat: number;
  lng: number;
}

export interface UseGeolocation {
  request: () => void;
  coords: Coords | null;
  status: GeolocationStatus;
  error: string | null;
}

/**
 * Thin wrapper over the browser Geolocation API (issue #176). Never throws — every
 * failure mode resolves to a status + a friendly `error` message so the caller can
 * render an inline fallback and suggest a manual location mode (ZIP/City/State).
 *
 * Statuses:
 *  - `idle`        nothing requested yet
 *  - `loading`     a `getCurrentPosition` call is in flight
 *  - `granted`     coords resolved
 *  - `denied`      the user blocked it, or the lookup failed/timed out
 *  - `unsupported` `navigator.geolocation` is missing
 *  - `insecure`    the page isn't a secure context (geolocation requires HTTPS)
 */
export function useGeolocation(): UseGeolocation {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(() => {
    // Secure-context gate first: browsers refuse geolocation over plain HTTP, and
    // the API call would otherwise fail with an opaque error.
    if (typeof window !== "undefined" && window.isSecureContext === false) {
      setStatus("insecure");
      setError(
        "Location needs a secure (HTTPS) connection. Try ZIP, City, or State instead.",
      );
      setCoords(null);
      return;
    }

    if (
      typeof navigator === "undefined" ||
      !("geolocation" in navigator) ||
      !navigator.geolocation
    ) {
      setStatus("unsupported");
      setError(
        "Your browser can’t share your location. Try ZIP, City, or State instead.",
      );
      setCoords(null);
      return;
    }

    setStatus("loading");
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("granted");
        setError(null);
      },
      (err) => {
        setStatus("denied");
        setCoords(null);
        const denied =
          typeof err === "object" && err !== null && "code" in err
            ? (err as GeolocationPositionError).code ===
              (err as GeolocationPositionError).PERMISSION_DENIED
            : false;
        setError(
          denied
            ? "Location access was blocked. Try ZIP, City, or State instead."
            : "We couldn’t get your location. Try ZIP, City, or State instead.",
        );
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  return { request, coords, status, error };
}
