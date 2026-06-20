import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MyHome } from "@/lib/homes/my-homes";

// Mutable mock home list per test.
let mockHomes: MyHome[] = [];
vi.mock("@/hooks/use-my-homes", () => ({
  useMyHomes: () => ({ homes: mockHomes, hydrated: true }),
}));

import { HomePicker } from "./home-picker";

function open() {
  fireEvent.click(screen.getByRole("button", { name: "Pick a home" }));
}

beforeEach(() => {
  mockHomes = [];
  // The manual path's LocationSearchBox hits /api/geocode; default to empty so
  // the free-text fallback is exercised without a live geocoder.
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ suggestions: [] }), { status: 200 }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("HomePicker", () => {
  it("is collapsed to a single button until opened", () => {
    render(<HomePicker onPick={() => {}} />);
    expect(screen.getByRole("button", { name: "Pick a home" })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search by address or city")).toBeNull();
  });

  it("accepts a search query", () => {
    render(<HomePicker onPick={() => {}} />);
    open();
    const search = screen.getByPlaceholderText(
      "Search by address or city",
    ) as HTMLInputElement;
    fireEvent.change(search, { target: { value: "oak" } });
    expect(search.value).toBe("oak");
  });

  it("renders a photo + facts row for a Home-search listing and returns the full MyHome", () => {
    mockHomes = [
      {
        key: "listing:l1",
        label: "123 Maple St",
        address: "123 Maple St",
        city: "Austin",
        state: "TX",
        listingId: "l1",
        price: 525000,
        beds: 3,
        baths: 2,
        sqft: 1840,
        propertyType: "single-family",
        source: "Home search",
      },
    ];
    const onPick = vi.fn();
    render(<HomePicker onPick={onPick} />);
    open();
    // Facts from the listing render (photo + price + facts line).
    expect(screen.getByText("$525,000")).toBeInTheDocument();
    expect(screen.getByText(/3 bd · 2 ba · 1,840 sqft/)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /sample image/i })).toBeInTheDocument();

    fireEvent.click(screen.getByText("123 Maple St"));
    expect(onPick).toHaveBeenCalledTimes(1);
    // The WHOLE MyHome flows through (listingId + facts), not just a label.
    expect(onPick.mock.calls[0][0]).toMatchObject({
      listingId: "l1",
      price: 525000,
      beds: 3,
      sqft: 1840,
    });
  });

  it("adds a manually-typed address via free-text fallback (no suggestions)", async () => {
    const onPick = vi.fn();
    render(<HomePicker onPick={onPick} />);
    open();
    const box = screen.getByLabelText("Home address or city", {
      exact: true,
    }) as HTMLInputElement;
    fireEvent.change(box, { target: { value: "9 Birch Rd" } });
    // Enter with no suggestions commits the raw text (city free-text fallback).
    fireEvent.keyDown(box, { key: "Enter" });
    await waitFor(() => expect(onPick).toHaveBeenCalledTimes(1));
    expect(onPick.mock.calls[0][0].label).toBe("9 Birch Rd");
  });

  it("screens protected-class terms out of a manually entered address", async () => {
    const onPick = vi.fn();
    render(<HomePicker onPick={onPick} />);
    open();
    const box = screen.getByLabelText("Home address or city", {
      exact: true,
    }) as HTMLInputElement;
    fireEvent.change(box, { target: { value: "9 Birch Rd near the synagogue" } });
    fireEvent.keyDown(box, { key: "Enter" });
    await waitFor(() => expect(onPick).toHaveBeenCalledTimes(1));
    expect(onPick.mock.calls[0][0].label).toContain("[removed]");
    expect(onPick.mock.calls[0][0].label).not.toMatch(/synagogue/i);
  });
});
