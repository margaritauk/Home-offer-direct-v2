import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useState } from "react";
import {
  LocationSelector,
  DEFAULT_RADIUS,
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

// Item 4 swap (S0b): the segmented zip/city/state tablist is replaced by the
// shared S0a LocationSearchBox. These tests assert the swap-in keeps the
// LocationValue contract: the box renders, the radius selector appears for a
// coordinate-anchored search, and Clear resets the slice (keeping the mode).
describe("LocationSelector", () => {
  it("renders the shared place-search combobox (not a mode tablist)", () => {
    render(<Host />);
    expect(
      screen.getByRole("combobox", { name: /where do you want to search/i }),
    ).toBeInTheDocument();
    // The old segmented mode tabs are gone.
    expect(screen.queryByRole("tab", { name: "ZIP" })).not.toBeInTheDocument();
  });

  it("keeps the 'use my current location' affordance", () => {
    render(<Host />);
    expect(
      screen.getByRole("button", { name: /use my current location/i }),
    ).toBeInTheDocument();
  });

  it("shows the radius selector when the active location carries coordinates", () => {
    render(
      <Host
        initial={{
          mode: "current",
          lat: 30.25,
          lng: -97.74,
          radius: DEFAULT_RADIUS,
        }}
      />,
    );
    expect(screen.getByLabelText("Search radius (miles)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "25 mi" }));
    expect(readValue().radius).toBe(25);
  });

  it("does not show a radius selector for a coordinate-less search", () => {
    render(<Host initial={{ mode: "state", state: "TX" }} />);
    expect(
      screen.queryByLabelText("Search radius (miles)"),
    ).not.toBeInTheDocument();
  });

  it("Clear resets the slice but preserves the mode", () => {
    render(<Host initial={{ mode: "city", city: "Austin", state: "TX" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(readValue()).toEqual({ mode: "city" });
  });
});
