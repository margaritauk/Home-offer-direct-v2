import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Deterministic, empty home list so the picker shows the "no homes" path and
// the manual-entry fallback regardless of localStorage.
vi.mock("@/hooks/use-my-homes", () => ({
  useMyHomes: () => ({ homes: [], hydrated: true }),
}));

import { HomePicker } from "./home-picker";

function open() {
  fireEvent.click(screen.getByRole("button", { name: "Pick a home" }));
}

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

  it("disables Add until a manual address is typed", () => {
    render(<HomePicker onPick={() => {}} />);
    open();
    const add = screen.getByRole("button", { name: "Add" });
    expect(add).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("123 Maple St"), {
      target: { value: "9 Birch Rd" },
    });
    expect(add).toBeEnabled();
  });

  it("screens protected-class terms out of a manually entered address", () => {
    const onPick = vi.fn();
    render(<HomePicker onPick={onPick} />);
    open();
    fireEvent.change(screen.getByPlaceholderText("123 Maple St"), {
      target: { value: "9 Birch Rd near the synagogue" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick.mock.calls[0][0].label).toContain("[removed]");
    expect(onPick.mock.calls[0][0].label).not.toMatch(/synagogue/i);
  });
});
