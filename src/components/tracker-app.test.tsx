import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { TrackerApp } from "./tracker-app";

// TrackerApp uses the real useTracker hook (localStorage-backed); reset between
// tests so each starts from a clean slate.
beforeEach(() => localStorage.clear());

describe("TrackerApp", () => {
  it("renders both date inputs and reflects typed values", () => {
    render(<TrackerApp />);
    const under = screen.getByLabelText(
      "Date you went under contract",
    ) as HTMLInputElement;
    const closing = screen.getByLabelText(
      "Target closing date",
    ) as HTMLInputElement;

    fireEvent.change(under, { target: { value: "2026-07-01" } });
    fireEvent.change(closing, { target: { value: "2026-08-15" } });

    expect(under.value).toBe("2026-07-01");
    expect(closing.value).toBe("2026-08-15");
  });

  it("builds the deadline timeline once both ordered dates are set", () => {
    render(<TrackerApp />);
    // The empty-state prompt is shown before dates are entered.
    expect(
      screen.getByText(/enter your under-contract and closing dates above/i),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Date you went under contract"), {
      target: { value: "2026-07-01" },
    });
    fireEvent.change(screen.getByLabelText("Target closing date"), {
      target: { value: "2026-08-15" },
    });

    expect(
      screen.queryByText(/enter your under-contract and closing dates above/i),
    ).toBeNull();
  });

  it("flags dates entered out of order", () => {
    render(<TrackerApp />);
    fireEvent.change(screen.getByLabelText("Date you went under contract"), {
      target: { value: "2026-08-15" },
    });
    fireEvent.change(screen.getByLabelText("Target closing date"), {
      target: { value: "2026-07-01" },
    });
    expect(
      screen.getByText(/closing date is before your under-contract date/i),
    ).toBeInTheDocument();
  });

  it("reveals editable contingency-period inputs on demand", () => {
    render(<TrackerApp />);
    expect(screen.queryByLabelText("Earnest money due (days)")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: /adjust contingency periods/i }),
    );
    const earnest = screen.getByLabelText(
      "Earnest money due (days)",
    ) as HTMLInputElement;
    fireEvent.change(earnest, { target: { value: "5" } });
    expect(earnest.value).toBe("5");
  });
});
