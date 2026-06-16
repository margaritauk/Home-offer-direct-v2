import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const tracker = {
  state: {
    underContractDate: "",
    closingDate: "",
    offsets: {
      earnestMoneyDays: 3,
      inspectionContingencyDays: 10,
      appraisalContingencyDays: 17,
      financingContingencyDays: 21,
      titleReviewDays: 14,
    },
    docs: {} as Record<string, boolean>,
  },
  hydrated: true,
};
const auth = { enabled: false, user: null as unknown };

vi.mock("@/hooks/use-tracker", () => ({ useTracker: () => tracker }));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => auth }));

import { ReminderBanner } from "./reminder-banner";

describe("ReminderBanner", () => {
  beforeEach(() => {
    window.localStorage.clear();
    tracker.state.underContractDate = "";
    tracker.state.closingDate = "";
    tracker.hydrated = true;
    auth.enabled = false;
    auth.user = null;
  });

  it("renders nothing when no dates are set", () => {
    const { container } = render(<ReminderBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows an explanatory, disabled 'Sign in to arm reminders' when signed out", () => {
    auth.enabled = true;
    auth.user = null;
    tracker.state.underContractDate = "2026-06-01";
    tracker.state.closingDate = "2026-08-01";
    render(<ReminderBanner />);
    const btn = screen.getByRole("button", { name: /sign in to arm reminders/i });
    expect(btn).toBeDisabled();
    // Explanatory, not a dead button.
    expect(screen.getByText(/need an account/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows the armed-count with the UPL footer when dates are set and nothing is due", () => {
    // Dates far in the future relative to the watermark so nothing is due today.
    tracker.state.underContractDate = "2099-06-01";
    tracker.state.closingDate = "2099-08-01";
    render(<ReminderBanner />);
    expect(screen.getByText(/reminders armed/i)).toBeInTheDocument();
    expect(screen.getByText(/contract is the source of truth/i)).toBeInTheDocument();
  });

  it("announces the armed state to screen readers via a live status region", () => {
    tracker.state.underContractDate = "2099-06-01";
    tracker.state.closingDate = "2099-08-01";
    render(<ReminderBanner />);
    expect(screen.getByRole("status").textContent).toMatch(/reminders armed/i);
  });
});
