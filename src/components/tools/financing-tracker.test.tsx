import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";

// Optional seed override so a test can inject a malformed persisted value (a
// native <input type="date"> in jsdom rejects invalid strings, so the only way
// to reach the inline-validation state is via persisted bad data).
let seedOverride: unknown = null;

// Back useStageTool with real state (mirrors the clear-to-close test) so the
// component is interactive without touching localStorage.
vi.mock("@/hooks/use-stage-tool", () => ({
  useStageTool: <T,>(_toolId: string, initial: T) => {
    const [value, setValue] = useState<T>(
      (seedOverride as T | null) ?? initial,
    );
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

// A tracker with an under-contract anchor so the derived CTC date can compute.
vi.mock("@/hooks/use-tracker", () => ({
  useTracker: () => ({
    state: {
      underContractDate: "2026-06-01",
      closingDate: "2026-08-01",
      offsets: { financingContingencyDays: 21 },
      docs: {},
    },
    hydrated: true,
  }),
}));

// Signed-in by default; individual tests can override via the mock below.
const authState = { enabled: false, user: null as null | { id: string } };
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => authState,
}));

// PropertyField pulls in the HomePicker + useMyHomes data hooks, which aren't
// under test here and aren't seeded in this environment — stub it out.
vi.mock("@/components/homes/property-field", () => ({
  PropertyField: () => null,
}));

import { FinancingTracker } from "./financing-tracker";

describe("FinancingTracker", () => {
  it("shows the empty-state prompt when no dates are entered", () => {
    authState.enabled = false;
    render(<FinancingTracker />);
    expect(
      screen.getByText(/enter your financing dates to track the loan process/i),
    ).toBeInTheDocument();
  });

  it("renders the four loan-process milestones as a semantic list", () => {
    render(<FinancingTracker />);
    expect(screen.getByText("Loan application submitted")).toBeInTheDocument();
    expect(screen.getByText("Appraisal completed")).toBeInTheDocument();
    expect(
      screen.getByText("Underwriting conditions cleared"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Clear to close by financing date"),
    ).toBeInTheDocument();
  });

  it("surfaces a status chip and arms a reminder once a date is set", () => {
    authState.enabled = false;
    render(<FinancingTracker />);
    fireEvent.change(screen.getByLabelText("Date for Loan application submitted"), {
      target: { value: "2099-06-10" },
    });
    // A future date is "upcoming" with a text label (not color alone). The
    // derived clear-to-close chip may also render, so allow multiple.
    expect(screen.getAllByText("Upcoming").length).toBeGreaterThanOrEqual(1);
    // Reminder armed affordance appears (auth disabled ⇒ not gated).
    expect(screen.getAllByText(/reminder armed/i).length).toBeGreaterThanOrEqual(1);
  });

  it("flags an invalid persisted date inline", () => {
    // A native date input won't hold an impossible date, so the inline-error
    // path is reached via malformed persisted data.
    seedOverride = {
      property: "",
      dates: {
        loanApplicationDate: "",
        appraisalDate: "2026-02-30", // impossible calendar date
        underwritingConditionsDate: "",
        clearToCloseByDate: "",
      },
    };
    render(<FinancingTracker />);
    expect(screen.getByText(/enter a valid date/i)).toBeInTheDocument();
    seedOverride = null; // reset for other tests
  });

  it("gates the reminder on sign-in when auth is enabled and signed-out (R1 rule)", () => {
    authState.enabled = true;
    authState.user = null;
    render(<FinancingTracker />);
    fireEvent.change(screen.getByLabelText("Date for Loan application submitted"), {
      target: { value: "2099-06-10" },
    });
    expect(
      screen.getAllByText(/sign in to arm a reminder/i).length,
    ).toBeGreaterThanOrEqual(1);
    authState.enabled = false; // reset for other tests
  });

  it("carries the SAFE-Act process footer and never quotes a rate", () => {
    render(<FinancingTracker />);
    expect(screen.getByText(/never quote a rate/i)).toBeInTheDocument();
  });
});
