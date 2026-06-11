import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ListingsBrowser } from "./listings-browser";
import { queryListings } from "@/lib/listings/provider";
import type { ListingFilters } from "@/lib/listings/types";

// The browser now searches async via /api/listings/search. We mock fetch to run
// the real mock provider, returning { listings, source: "mock" } — so the UI
// renders genuine sample results without a server.
function mockSearchFetch() {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
    const filters = JSON.parse(String(init?.body ?? "{}")) as ListingFilters;
    const listings = queryListings(filters);
    return new Response(JSON.stringify({ listings, source: "mock" }), {
      status: 200,
    });
  });
}

// Exercises the live-filter wiring: applying filters surfaces chips, removing a
// chip clears just that filter, and "Clear all" resets everything (issue #172).
describe("ListingsBrowser", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockSearchFetch();
  });

  afterEach(() => vi.restoreAllMocks());

  const filtersRegion = () => screen.getByLabelText("Active filters");

  it("renders a price-range slider and a min-baths control", () => {
    render(<ListingsBrowser />);
    expect(screen.getByLabelText("Minimum price")).toBeInTheDocument();
    expect(screen.getByLabelText("Maximum price")).toBeInTheDocument();
    expect(screen.getByLabelText("Minimum baths")).toBeInTheDocument();
  });

  it("renders sample results from the async search", async () => {
    render(<ListingsBrowser />);
    // After the debounced fetch resolves, real sample cards appear.
    expect(await screen.findByText(/\d+ listings?/)).toBeInTheDocument();
    expect(screen.getByText("Sample listings.")).toBeInTheDocument();
  });

  it("shows chips when a price + beds filter is applied", () => {
    render(<ListingsBrowser />);

    fireEvent.change(screen.getByLabelText("Minimum beds"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Min price"), { target: { value: "400,000" } });

    const chips = filtersRegion();
    expect(within(chips).getByText("3+ beds")).toBeInTheDocument();
    expect(within(chips).getByText(/Min \$400,000/)).toBeInTheDocument();
  });

  it("removing a chip clears just that filter and updates results", async () => {
    render(<ListingsBrowser />);

    fireEvent.change(screen.getByLabelText("Minimum beds"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Min price"), { target: { value: "400,000" } });

    // Wait for the filtered async result to land.
    const countText = async () =>
      (await screen.findByText(/^\d+ listings?$/)).textContent;
    const countBefore = await countText();

    // Remove only the beds chip.
    fireEvent.click(screen.getByRole("button", { name: "Remove 3+ beds" }));

    const chips = filtersRegion();
    expect(within(chips).queryByText("3+ beds")).not.toBeInTheDocument();
    expect(within(chips).getByText(/Min \$400,000/)).toBeInTheDocument();
    // Loosening the beds filter should not shrink the result set.
    await waitFor(async () => {
      expect(await countText()).not.toBe(countBefore);
    });
  });

  it("applying a sqft min narrows results and shows a removable chip", async () => {
    render(<ListingsBrowser />);

    const countText = async () =>
      (await screen.findByText(/^\d+ listings?$/)).textContent;
    const countBefore = await countText();

    // Expand the collapsible "More filters" panel, then set a high sqft min.
    fireEvent.click(screen.getByRole("button", { name: /More filters/ }));
    fireEvent.change(screen.getByLabelText("Min sqft"), {
      target: { value: "2000" },
    });

    // A chip appears for the new filter.
    const chips = filtersRegion();
    expect(within(chips).getByText(/Min 2,000 sqft/)).toBeInTheDocument();

    // Results narrow.
    await waitFor(async () => {
      expect(await countText()).not.toBe(countBefore);
    });

    // Removing the chip clears the filter and restores the count. It was the only
    // active filter, so the whole Active-filters region disappears with it.
    fireEvent.click(
      screen.getByRole("button", { name: "Remove Min 2,000 sqft" }),
    );
    expect(screen.queryByText(/Min 2,000 sqft/)).not.toBeInTheDocument();
    await waitFor(async () => {
      expect(await countText()).toBe(countBefore);
    });
  });

  it("multi-select property type adds a chip per type", () => {
    render(<ListingsBrowser />);
    fireEvent.click(screen.getByRole("button", { name: /More filters/ }));
    fireEvent.click(screen.getByLabelText("Condo"));

    expect(within(filtersRegion()).getByText("Type: Condo")).toBeInTheDocument();
  });

  it("retains the previous results while a new search is in flight (no skeleton flash)", async () => {
    // A unique address per listing so we can assert specific cards stay mounted.
    const first = [
      { ...queryListings()[0], id: "keep-1", address: "111 Keep St" },
    ];
    const second = [
      { ...queryListings()[0], id: "keep-2", address: "222 Fresh Ave" },
    ];

    // The "fresh" search (minBeds=2) is deferred so we can observe the in-flight
    // window; every other (initial) search resolves immediately with `first`.
    // The resolver is only set once the debounced fetch actually fires, so the
    // test waits for it before resolving.
    let resolveSecond: (() => void) | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      const filters = JSON.parse(String(init?.body ?? "{}")) as ListingFilters;
      if (filters.minBeds === 2) {
        await new Promise<void>((r) => {
          resolveSecond = r;
        });
        return new Response(
          JSON.stringify({ listings: second, source: "mock" }),
          { status: 200 },
        );
      }
      return new Response(
        JSON.stringify({ listings: first, source: "mock" }),
        { status: 200 },
      );
    });

    render(<ListingsBrowser />);

    // First results land.
    expect(await screen.findByText("111 Keep St")).toBeInTheDocument();

    // Trigger a new search (changing a filter) — the second fetch is in flight.
    fireEvent.change(screen.getByLabelText("Minimum beds"), {
      target: { value: "2" },
    });

    // The previous card stays visible during the refetch (no empty state, no
    // skeletons), and an "Updating…" indicator appears.
    expect(await screen.findByText("Updating…")).toBeInTheDocument();
    expect(screen.getByText("111 Keep St")).toBeInTheDocument();
    // No skeleton placeholders mid-refetch.
    expect(document.querySelector(".animate-pulse")).toBeNull();

    // Wait for the deferred fetch to actually be in flight, then resolve it; the
    // fresh card replaces the old one.
    await waitFor(() => expect(resolveSecond).not.toBeNull());
    resolveSecond!();
    expect(await screen.findByText("222 Fresh Ave")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText("Updating…")).not.toBeInTheDocument(),
    );
  });

  it("Clear all resets every filter and hides the chips", () => {
    render(<ListingsBrowser />);

    fireEvent.change(screen.getByLabelText("Minimum beds"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Min price"), { target: { value: "400,000" } });
    expect(filtersRegion()).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));

    expect(screen.queryByLabelText("Active filters")).not.toBeInTheDocument();
    expect((screen.getByLabelText("Min price") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Minimum beds") as HTMLSelectElement).value).toBe("0");
  });
});
