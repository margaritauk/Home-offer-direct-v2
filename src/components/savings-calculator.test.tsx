import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { SavingsCalculator } from "./savings-calculator";

// This suite exercises the REAL useStageTool against jsdom's localStorage so we
// can assert the savings inputs now persist (issue #150, A2 migration).
describe("SavingsCalculator", () => {
  beforeEach(() => window.localStorage.clear());

  it("renders $10,000 captured at the default 100% capture on a $400k home (E2E parity)", () => {
    render(<SavingsCalculator />);
    expect(screen.getByTestId("captured-savings").textContent).toMatch(
      /\$10,000/,
    );
  });

  it("recomputes when the capture-rate slider changes and still shows a result", () => {
    render(<SavingsCalculator />);
    const before = screen.getByTestId("captured-savings").textContent;
    fireEvent.change(
      screen.getByLabelText("How much of it you negotiate to capture"),
      { target: { value: "50" } },
    );
    expect(screen.getByTestId("captured-savings").textContent).not.toBe(before);
  });

  it("renders a sanity note for a flagged input (100% capture is a best case)", () => {
    // The default 100% capture rate trips the savingsSanity best-case nudge.
    render(<SavingsCalculator />);
    const note = screen.getByTestId("sanity-note");
    expect(note.textContent).toMatch(/best case/i);
  });

  it("hides the sanity note once the flagged input is corrected", () => {
    render(<SavingsCalculator />);
    expect(screen.getByTestId("sanity-note")).toBeInTheDocument();
    // Drop capture below 100% → the only flagged condition clears.
    fireEvent.change(
      screen.getByLabelText("How much of it you negotiate to capture"),
      { target: { value: "80" } },
    );
    expect(screen.queryByTestId("sanity-note")).not.toBeInTheDocument();
  });

  it("persists an input change across a fresh render (useStageTool)", () => {
    const first = render(<SavingsCalculator />);
    fireEvent.change(first.getByLabelText("Home price"), {
      target: { value: "800000" },
    });
    // It wrote through to localStorage under the namespaced key.
    expect(window.localStorage.getItem("hod:tool:savings:v1")).toContain(
      "800000",
    );
    first.unmount();

    // A fresh mount reads the persisted value back.
    render(<SavingsCalculator />);
    const slider = screen.getByLabelText("Home price") as HTMLInputElement;
    expect(slider.value).toBe("800000");
  });
});
