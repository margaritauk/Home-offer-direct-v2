import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  PriceRange,
  clampRange,
  clampToBounds,
  cohereRange,
  sliderValue,
  type PriceBounds,
  type RangeValue,
} from "./price-range";

const bounds: PriceBounds = { lo: 0, hi: 2_000_000 };
// A dataset whose cheapest home is $250k — the case that produced the bug where
// typing a small number snapped up to the floor.
const flooredBounds: PriceBounds = { lo: 250_000, hi: 2_000_000 };

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

  it("cohereRange takes a typed price at face value (no snapping to data floor)", () => {
    // The bug: a typed min below the cheapest listing must NOT jump to the floor.
    expect(cohereRange(3, 0, "min")).toEqual({ min: 3, max: 0 });
    expect(cohereRange(50_000, 0, "min")).toEqual({ min: 50_000, max: 0 });
    // Negatives floor to 0 (unbounded); coherence still respects the edited side.
    expect(cohereRange(-5, 0, "min")).toEqual({ min: 0, max: 0 });
    expect(cohereRange(900_000, 400_000, "min")).toEqual({ min: 900_000, max: 900_000 });
    expect(cohereRange(500_000, 300_000, "max")).toEqual({ min: 300_000, max: 300_000 });
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

  // A controlled host that actually stores the range, the way the real page
  // does — so the rendered field reflects state updates, not a frozen prop.
  function Controlled({ bounds }: { bounds: PriceBounds }) {
    const [range, setRange] = useState<RangeValue>({ min: 0, max: 0 });
    return <PriceRange min={range.min} max={range.max} onChange={setRange} bounds={bounds} />;
  }

  it("keeps a typed value below the dataset floor instead of snapping it up", () => {
    // Regression: with a $250k floor, typing 3,000 used to display 250,000.
    render(<Controlled bounds={flooredBounds} />);

    const minField = screen.getByLabelText("Min price") as HTMLInputElement;
    fireEvent.change(minField, { target: { value: "3,000" } });
    // The field echoes exactly what was typed, not the dataset floor.
    expect(minField.value).toBe("3,000");
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
