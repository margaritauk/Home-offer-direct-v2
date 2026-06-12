import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useState } from "react";

vi.mock("@/hooks/use-stage-tool", () => ({
  useStageTool: <T,>(_toolId: string, initial: T) => {
    const [value, setValue] = useState<T>(initial);
    return {
      value,
      hydrated: true,
      save: (next: T | ((prev: T) => T)) =>
        setValue((prev) =>
          typeof next === "function" ? (next as (p: T) => T)(prev) : next,
        ),
      reset: () => setValue(initial),
    };
  },
}));

// Controllable state selection for the worksheet's state-aware behavior.
let mockState: string | undefined;
vi.mock("@/hooks/use-state-selection", () => ({
  useStateSelection: () => ({ stateCode: mockState, hydrated: true }),
}));

import { DisclosureReview } from "./disclosure-review";

beforeEach(() => {
  mockState = undefined;
});

describe("DisclosureReview", () => {
  it("prompts the buyer to pick a state when none is selected", () => {
    render(<DisclosureReview />);
    expect(
      screen.getByText(/pick your state to tailor the checklist/i),
    ).toBeInTheDocument();
  });

  it("renders the statutory-form intro and red-flag categories for a form state (CA)", () => {
    mockState = "CA";
    render(<DisclosureReview />);
    expect(
      screen.getAllByText(/Transfer Disclosure Statement/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("checkbox", { name: /Flag Water intrusion & drainage/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /Flag Foundation & structural/i }),
    ).toBeInTheDocument();
  });

  it("shows the caveat-emptor warning for a limited-disclosure state (AL)", () => {
    mockState = "AL";
    render(<DisclosureReview />);
    expect(
      screen.getByText(/silence is not a clean bill of health/i),
    ).toBeInTheDocument();
  });

  it("logs questions and screens protected-class terms on blur", () => {
    mockState = "CA";
    render(<DisclosureReview />);
    const field = screen.getByLabelText(
      /Questions to ask about Water intrusion/i,
    ) as HTMLTextAreaElement;
    fireEvent.change(field, { target: { value: "Any flooding? Near a mosque?" } });
    fireEvent.blur(field);
    expect(field.value).not.toMatch(/mosque/i);
    expect(field.value).toContain("[removed]");
  });

  it("carries the 'have your attorney/inspector confirm' UPL disclaimer", () => {
    mockState = "CA";
    render(<DisclosureReview />);
    expect(
      screen.getAllByText(/have your attorney\/inspector confirm/i).length,
    ).toBeGreaterThan(0);
  });

  it("does not interpret legal effect — no 'rescind/walk' directive in the disclaimer", () => {
    mockState = "CA";
    render(<DisclosureReview />);
    expect(screen.queryByText(/you should rescind/i)).not.toBeInTheDocument();
  });
});
