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

  it("frames the headline claim conditionally (J2): 'up to ~2.5%, if you ask and the deal allows'", () => {
    render(<SavingsCalculator />);
    // The qualifier must travel WITH the dollar figure (same result region), not
    // in a distant footnote.
    const region = screen.getByTestId("captured-savings").closest("[aria-live]");
    expect(region).not.toBeNull();
    expect(region!.textContent).toMatch(/up to ~2\.5%/i);
    expect(region!.textContent).toMatch(/if you ask and the deal allows/i);
    // No unconditional over-promise.
    expect(screen.queryByText(/you will save/i)).not.toBeInTheDocument();
  });

  it("shows the three preconditions and a sourced/dated seller-credit-cap note (J2)", () => {
    render(<SavingsCalculator />);
    expect(screen.getByText(/seller is willing to offer buyer-side compensation/i)).toBeInTheDocument();
    expect(screen.getByText(/price reduction or a closing credit/i)).toBeInTheDocument();
    expect(screen.getAllByText(/seller-credit caps/i).length).toBeGreaterThan(0);
    // Accuracy compliance: a source + date node renders.
    expect(screen.getByText(/Aug 17, 2024/)).toBeInTheDocument();
    expect(screen.getByText(/As of 2026/)).toBeInTheDocument();
  });

  it("at 0% capture the figure is $0 and the 'seller keeps it' framing is present (J2 edge)", () => {
    render(<SavingsCalculator />);
    fireEvent.change(
      screen.getByLabelText("How much of it you negotiate to capture"),
      { target: { value: "0" } },
    );
    expect(screen.getByTestId("captured-savings").textContent).toMatch(/\$0/);
    expect(screen.getByTestId("savings-caveat").textContent).toMatch(/seller keeps it/i);
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

  it("offers Undo after Reset and restores the prior value (issue #152)", () => {
    render(<SavingsCalculator />);
    const homePrice = () =>
      screen.getByLabelText("Home price") as HTMLInputElement;

    fireEvent.change(homePrice(), { target: { value: "800000" } });
    expect(homePrice().value).toBe("800000");

    // No undo strip until a reset happens.
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(homePrice().value).toBe("400000"); // back to INITIAL

    // Undo affordance appears; clicking it restores the prior value.
    fireEvent.click(screen.getByRole("button", { name: /undo/i }));
    expect(homePrice().value).toBe("800000");
    expect(window.localStorage.getItem("hod:tool:savings:v1")).toContain(
      "800000",
    );
  });
});
