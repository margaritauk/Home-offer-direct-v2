import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mutable store state the mocked hooks read from.
const stores = {
  progress: { completed: {} as Record<string, boolean>, hydrated: true },
  showings: { showings: {} as Record<string, unknown>, hydrated: true },
  offers: { offers: {} as Record<string, unknown>, hydrated: true },
  tracker: {
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
  },
};

vi.mock("@/hooks/use-progress", () => ({ useProgress: () => stores.progress }));
vi.mock("@/hooks/use-showings", () => ({ useShowings: () => stores.showings }));
vi.mock("@/hooks/use-offer-status", () => ({ useOfferStatus: () => stores.offers }));
vi.mock("@/hooks/use-tracker", () => ({ useTracker: () => stores.tracker }));
// The reminder banner has its own tests; stub it here.
vi.mock("@/components/reminders/reminder-banner", () => ({
  ReminderBanner: () => null,
}));

import { CockpitBand } from "./cockpit-band";

describe("CockpitBand", () => {
  beforeEach(() => {
    stores.progress = { completed: {}, hydrated: true };
    stores.showings = { showings: {}, hydrated: true };
    stores.offers = { offers: {}, hydrated: true };
    stores.tracker.state.underContractDate = "";
    stores.tracker.state.closingDate = "";
    stores.tracker.hydrated = true;
  });

  it("shows a skeleton (not blank) while stores are unhydrated", () => {
    stores.tracker.hydrated = false;
    const { container } = render(<CockpitBand />);
    expect(container.querySelector("[aria-hidden]")).toBeInTheDocument();
  });

  it("renders the first-run prompt (never blank) when there is no deal data", () => {
    render(<CockpitBand />);
    expect(
      screen.getByRole("heading", { name: /tell us where you are/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /start/i })).toBeInTheDocument();
  });

  it("renders ranked action cards in an ordered list once dates are set", () => {
    stores.showings = {
      showings: { h1: { status: "seen", address: "1 Main", updatedAt: "2026-06-01" } },
      hydrated: true,
    };
    stores.tracker.state.underContractDate = "2026-06-01";
    stores.tracker.state.closingDate = "2026-08-01";
    render(<CockpitBand />);
    expect(
      screen.getByRole("heading", { name: /what needs you this week/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);
  });

  it("carries the UPL contract-governs note when dates are set", () => {
    stores.offers = {
      offers: { h1: { status: "accepted", updatedAt: "2026-06-01" } },
      hydrated: true,
    };
    stores.tracker.state.underContractDate = "2026-06-01";
    stores.tracker.state.closingDate = "2026-08-01";
    render(<CockpitBand />);
    expect(screen.getByText(/contract governs/i)).toBeInTheDocument();
  });

  it("announces the attention count via an aria-live region", () => {
    stores.offers = {
      offers: { h1: { status: "accepted", updatedAt: "2026-06-01" } },
      hydrated: true,
    };
    stores.tracker.state.underContractDate = "2026-06-01";
    stores.tracker.state.closingDate = "2026-08-01";
    const { container } = render(<CockpitBand />);
    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument();
  });
});
