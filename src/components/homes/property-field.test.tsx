import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PropertyField } from "./property-field";

describe("PropertyField", () => {
  it("shows the optional hint when no property is set", () => {
    render(<PropertyField value="" onChange={() => {}} />);
    expect(screen.getByText(/label which home this tool is tracking/i)).toBeInTheDocument();
    // No Clear button until a value exists.
    expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
  });

  it("shows the label and clears it via the Clear button", () => {
    const onChange = vi.fn();
    render(<PropertyField value="12 Oak Ave" onChange={onChange} />);
    expect(screen.getByText("12 Oak Ave")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onChange).toHaveBeenCalledWith("");
  });
});
