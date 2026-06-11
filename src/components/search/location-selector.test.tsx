import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import {
  LocationSelector,
  type LocationValue,
} from "./location-selector";

// A tiny controlled host so onChange actually drives the rendered value, mirroring
// how listings-browser uses the component.
function Host({ initial }: { initial?: LocationValue }) {
  const [value, setValue] = useState<LocationValue>(initial ?? { mode: "state" });
  return (
    <div>
      <LocationSelector value={value} onChange={setValue} />
      <output data-testid="value">{JSON.stringify(value)}</output>
    </div>
  );
}

const readValue = (): LocationValue =>
  JSON.parse(screen.getByTestId("value").textContent ?? "{}");

const originalGeolocation = navigator.geolocation;
const originalSecure = window.isSecureContext;

function setGeolocation(mock: unknown) {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: mock,
  });
}

describe("LocationSelector", () => {
  beforeEach(() => {
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    setGeolocation(originalGeolocation);
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: originalSecure,
    });
    vi.restoreAllMocks();
  });

  it("switching to ZIP clears other modes' fields and stores the zip", () => {
    render(<Host initial={{ mode: "state", state: "TX" }} />);

    fireEvent.click(screen.getByRole("tab", { name: "ZIP" }));
    expect(readValue()).toEqual({ mode: "zip" });

    fireEvent.change(screen.getByLabelText("ZIP code"), {
      target: { value: "78704" },
    });
    expect(readValue()).toEqual({ mode: "zip", zip: "78704" });
    // No lingering state from the previous mode.
    expect(readValue().state).toBeUndefined();
  });

  it("State mode updates the state and clears the rest", () => {
    render(<Host initial={{ mode: "city", city: "Austin", state: "TX" }} />);

    fireEvent.click(screen.getByRole("tab", { name: "State" }));
    expect(readValue()).toEqual({ mode: "state" });

    fireEvent.change(screen.getByLabelText("State"), { target: { value: "CA" } });
    expect(readValue()).toEqual({ mode: "state", state: "CA" });
  });

  it("Use my location success sets lat/lng and reveals the radius selector", () => {
    setGeolocation({
      getCurrentPosition: (success: PositionCallback) =>
        success({
          coords: { latitude: 30.25, longitude: -97.74 },
        } as GeolocationPosition),
    });

    render(<Host initial={{ mode: "current" }} />);
    expect(screen.queryByLabelText("Search radius (miles)")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Use my location" }));

    const value = readValue();
    expect(value.lat).toBe(30.25);
    expect(value.lng).toBe(-97.74);
    expect(value.radius).toBe(10);
    expect(screen.getByLabelText("Search radius (miles)")).toBeInTheDocument();
  });

  it("denied geolocation shows the fallback message and no radius", () => {
    setGeolocation({
      getCurrentPosition: (_s: PositionCallback, error?: PositionErrorCallback) =>
        error?.({
          code: 1,
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
          message: "denied",
        } as GeolocationPositionError),
    });

    render(<Host initial={{ mode: "current" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Use my location" }));

    expect(screen.getByText(/blocked|Try ZIP/i)).toBeInTheDocument();
    expect(screen.queryByLabelText("Search radius (miles)")).not.toBeInTheDocument();
  });
});
