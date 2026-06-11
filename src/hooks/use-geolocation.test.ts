import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGeolocation } from "./use-geolocation";

const originalGeolocation = navigator.geolocation;
const originalSecure = window.isSecureContext;

function setSecure(secure: boolean) {
  Object.defineProperty(window, "isSecureContext", {
    configurable: true,
    value: secure,
  });
}

function setGeolocation(mock: unknown) {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: mock,
  });
}

describe("useGeolocation", () => {
  beforeEach(() => setSecure(true));

  afterEach(() => {
    setGeolocation(originalGeolocation);
    setSecure(originalSecure);
    vi.restoreAllMocks();
  });

  it("starts idle", () => {
    const { result } = renderHook(() => useGeolocation());
    expect(result.current.status).toBe("idle");
    expect(result.current.coords).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("resolves coords and status=granted on success", () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({
        coords: { latitude: 30.25, longitude: -97.74 },
      } as GeolocationPosition);
    });
    setGeolocation({ getCurrentPosition });

    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.request());

    expect(result.current.status).toBe("granted");
    expect(result.current.coords).toEqual({ lat: 30.25, lng: -97.74 });
    expect(result.current.error).toBeNull();
  });

  it("sets status=denied with a message on error", () => {
    const getCurrentPosition = vi.fn(
      (_s: PositionCallback, error?: PositionErrorCallback) => {
        error?.({
          code: 1,
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
          message: "denied",
        } as GeolocationPositionError);
      },
    );
    setGeolocation({ getCurrentPosition });

    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.request());

    expect(result.current.status).toBe("denied");
    expect(result.current.coords).toBeNull();
    expect(result.current.error).toMatch(/blocked|couldn’t/i);
  });

  it("sets status=unsupported when geolocation is missing", () => {
    setGeolocation(undefined);
    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.request());

    expect(result.current.status).toBe("unsupported");
    expect(result.current.error).toBeTruthy();
  });

  it("sets status=insecure when not a secure context", () => {
    setSecure(false);
    const getCurrentPosition = vi.fn();
    setGeolocation({ getCurrentPosition });

    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.request());

    expect(result.current.status).toBe("insecure");
    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(result.current.error).toMatch(/HTTPS|secure/i);
  });
});
