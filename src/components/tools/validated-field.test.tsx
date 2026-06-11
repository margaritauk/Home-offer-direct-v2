import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { ValidatedNumberField } from "./validated-field";
import type { NumberBounds } from "@/lib/tools/validation";

/** Drive the controlled field with real state so onChange round-trips. */
function Harness({
  bounds,
  initial = 50,
  onChange,
  unit,
}: {
  bounds?: NumberBounds;
  initial?: number;
  onChange?: (n: number) => void;
  unit?: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <ValidatedNumberField
      label="Test value"
      value={value}
      unit={unit}
      bounds={bounds}
      onChange={(n) => {
        setValue(n);
        onChange?.(n);
      }}
    />
  );
}

describe("ValidatedNumberField", () => {
  it("an out-of-range value sets aria-invalid, shows the message, and STILL calls onChange", () => {
    const onChange = vi.fn();
    render(<Harness bounds={{ min: 0, max: 100 }} onChange={onChange} />);
    const input = screen.getByLabelText("Test value");

    fireEvent.change(input, { target: { value: "150" } });

    // Non-blocking: the host still receives the parsed number.
    expect(onChange).toHaveBeenLastCalledWith(150);
    // Error wiring.
    expect(input).toHaveAttribute("aria-invalid", "true");
    const msg = screen.getByText("Must be between 0 and 100");
    expect(msg).toBeInTheDocument();
    expect(input.getAttribute("aria-describedby")).toBe(msg.id);
  });

  it("a soft-range value shows an amber note with NO aria-invalid", () => {
    render(
      <Harness bounds={{ min: 0, max: 100, softMax: 90 }} />,
    );
    const input = screen.getByLabelText("Test value");

    fireEvent.change(input, { target: { value: "95" } });

    expect(input).not.toHaveAttribute("aria-invalid");
    const msg = screen.getByText("This looks unusually high — double-check.");
    expect(msg).toBeInTheDocument();
    expect(input.getAttribute("aria-describedby")).toBe(msg.id);
  });

  it("a valid value clears the message", () => {
    render(<Harness bounds={{ min: 0, max: 100, softMax: 90 }} />);
    const input = screen.getByLabelText("Test value");

    fireEvent.change(input, { target: { value: "95" } });
    expect(
      screen.getByText("This looks unusually high — double-check."),
    ).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "50" } });
    expect(
      screen.queryByText("This looks unusually high — double-check."),
    ).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("clearing the field preserves an empty draft (does not force a 0 into the box)", () => {
    const onChange = vi.fn();
    render(<Harness bounds={{ min: 0, max: 100 }} onChange={onChange} />);
    const input = screen.getByLabelText("Test value") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "" } });

    // The box stays empty for the user...
    expect(input.value).toBe("");
    // ...while the host gets a defined 0 so its math stays defined.
    expect(onChange).toHaveBeenLastCalledWith(0);
    // Empty is not an error.
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("renders the unit suffix and uses it in messages", () => {
    render(<Harness bounds={{ max: 100 }} unit="%" />);
    const input = screen.getByLabelText("Test value");
    fireEvent.change(input, { target: { value: "150" } });
    expect(screen.getByText("Must be at most 100%")).toBeInTheDocument();
  });
});
