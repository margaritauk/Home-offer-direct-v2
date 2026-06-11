import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  PriceRange,
  clampRange,
  clampToBounds,
  sliderValue,
  type PriceBounds,
} from "./price-range";

const bounds: PriceBounds = { lo: 0, hi: 2_000_000 };

describe("clamp/sync helpers", () => {
  it("clampToBounds keeps values inside the data range; 0 stays unbounded", () => {
    expect(clampToBounds(0, bounds)).toBe(0);
    expect(clampToBounds(-5, bounds)).toBe(0);
    expect(clampToBounds(3_000_000, bounds)).toBe(2_000_000);
    expect(clampToBounds(500_000, bounds)).toBe(500_000);
    expect(clampToBounds(50, { lo: 100, hi: 1000 })).toBe(100);
  });

  it("clampRange keeps min <= max", () => {
    const r = clampRange(900_000, 400_000, bounds, "min");
    expect(r.min).toBeLessThanOrEqual(r.max);
  });

  it("typing a min above max corrects the range, keeping the edited min", () => {
    // User just edited min -> respect it and raise max to meet it.
    expect(clampRange(900_000, 400_000, bounds, "min")).toEqual({ min: 900_000, max: 900_000 });
  });

  it("typing a max below min corrects the range, keeping the edited max", () => {
    // User just edited max -> respect it and lower min to meet it.
    expect(clampRange(500_000, 300_000, bounds, "max")).toEqual({ min: 300_000, max: 300_000 });
  });

  it("an empty (0) bound stays unbounded — no clamping pairs against it", () => {
    expect(clampRange(0, 400_000, bounds, "min")).toEqual({ min: 0, max: 400_000 });
    expect(clampRange(500_000, 0, bounds, "max")).toEqual({ min: 500_000, max: 0 });
  });

  it("sliderValue snaps unbounded sides to the matching edge", () => {
    expect(sliderValue(0, "min", bounds)).toBe(bounds.lo);
    expect(sliderValue(0, "max", bounds)).toBe(bounds.hi);
    expect(sliderValue(500_000, "min", bounds)).toBe(500_000);
  });
});

describe("PriceRange (RTL)", () => {
  it("typing in Min $ reports a clamped range and renders slider inputs", () => {
    const onChange = vi.fn();
    render(<PriceRange min={0} max={0} onChange={onChange} bounds={bounds} />);

    const minField = screen.getByLabelText("Min price") as HTMLInputElement;
    fireEvent.change(minField, { target: { value: "300,000" } });
    expect(onChange).toHaveBeenCalledWith({ min: 300_000, max: 0 });

    // Dual-range slider thumbs exist and are accessible.
    expect(screen.getByLabelText("Minimum price")).toBeInTheDocument();
    expect(screen.getByLabelText("Maximum price")).toBeInTheDocument();
  });

  it("displays the current min value formatted in the currency field", () => {
    render(<PriceRange min={450_000} max={0} onChange={() => {}} bounds={bounds} />);
    expect((screen.getByLabelText("Min price") as HTMLInputElement).value).toBe("450,000");
  });

  it("dragging the max thumb to the top edge clears the max bound", () => {
    const onChange = vi.fn();
    render(<PriceRange min={0} max={500_000} onChange={onChange} bounds={bounds} />);
    fireEvent.change(screen.getByLabelText("Maximum price"), {
      target: { value: String(bounds.hi) },
    });
    expect(onChange).toHaveBeenCalledWith({ min: 0, max: 0 });
  });
});
