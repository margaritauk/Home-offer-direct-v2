import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GeocodeSuggestion } from "@/lib/geocode";

// Controllable geolocation mock.
const geoState = {
  request: vi.fn(),
  coords: null as { lat: number; lng: number } | null,
  status: "idle" as string,
  error: null as string | null,
};
vi.mock("@/hooks/use-geolocation", () => ({
  useGeolocation: () => geoState,
}));

import { LocationSearchBox } from "./location-search-box";

const SUGGESTIONS: GeocodeSuggestion[] = [
  {
    id: "city:austin",
    kind: "city",
    label: "Austin",
    context: "Travis County · TX",
    lat: 30.27,
    lng: -97.74,
    city: "Austin",
    state: "TX",
    county: "Travis County",
  },
  {
    id: "zip:78704",
    kind: "zip",
    label: "78704",
    lat: 30.24,
    lng: -97.76,
    zip: "78704",
    state: "TX",
  },
];

function mockGeocode(suggestions: GeocodeSuggestion[]) {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ suggestions }), { status: 200 }),
  );
}

beforeEach(() => {
  geoState.request = vi.fn();
  geoState.coords = null;
  geoState.status = "idle";
  geoState.error = null;
});

afterEach(() => vi.restoreAllMocks());

describe("LocationSearchBox", () => {
  it("exposes an ARIA combobox", () => {
    mockGeocode([]);
    render(<LocationSearchBox onResolve={() => {}} />);
    const combobox = screen.getByRole("combobox");
    expect(combobox).toHaveAttribute("aria-expanded", "false");
  });

  it("opens a listbox of kind-tagged suggestions and resolves the picked slice", async () => {
    mockGeocode(SUGGESTIONS);
    const onResolve = vi.fn();
    render(<LocationSearchBox onResolve={onResolve} />);
    const combobox = screen.getByRole("combobox");
    fireEvent.change(combobox, { target: { value: "Austin" } });

    // Listbox appears with both kind labels.
    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
    expect(screen.getByText("City")).toBeInTheDocument();
    expect(screen.getByText("ZIP")).toBeInTheDocument();

    // Keyboard down to the first option, Enter selects it.
    fireEvent.keyDown(combobox, { key: "ArrowDown" });
    fireEvent.keyDown(combobox, { key: "Enter" });
    expect(onResolve).toHaveBeenCalledTimes(1);
    expect(onResolve.mock.calls[0][0]).toMatchObject({
      mode: "city",
      lat: 30.27,
      lng: -97.74,
      city: "Austin",
      state: "TX",
    });
  });

  it("Escape closes the listbox", async () => {
    mockGeocode(SUGGESTIONS);
    render(<LocationSearchBox onResolve={() => {}} />);
    const combobox = screen.getByRole("combobox");
    fireEvent.change(combobox, { target: { value: "Austin" } });
    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
    fireEvent.keyDown(combobox, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("degrades to a free-text city search on Enter when there are no suggestions", async () => {
    mockGeocode([]);
    const onResolve = vi.fn();
    render(<LocationSearchBox onResolve={onResolve} />);
    const combobox = screen.getByRole("combobox");
    fireEvent.change(combobox, { target: { value: "Nowhereville" } });
    // No listbox (empty results) — Enter commits the raw text.
    fireEvent.keyDown(combobox, { key: "Enter" });
    await waitFor(() => expect(onResolve).toHaveBeenCalledTimes(1));
    expect(onResolve.mock.calls[0][0]).toMatchObject({
      mode: "city",
      city: "Nowhereville",
    });
  });

  it("requests geolocation via the current-location button", () => {
    mockGeocode([]);
    render(<LocationSearchBox onResolve={() => {}} />);
    fireEvent.click(
      screen.getByRole("button", { name: /use my current location/i }),
    );
    expect(geoState.request).toHaveBeenCalledTimes(1);
  });

  it("resolves coords into the slice once geolocation is granted", () => {
    mockGeocode([]);
    geoState.status = "granted";
    geoState.coords = { lat: 30.1, lng: -97.7 };
    const onResolve = vi.fn();
    render(<LocationSearchBox onResolve={onResolve} />);
    expect(onResolve).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "current", lat: 30.1, lng: -97.7 }),
      "Current location",
    );
  });
});
