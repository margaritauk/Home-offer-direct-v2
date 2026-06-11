import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { defaultOffsets } from "@/lib/deadlines";
import { TrackerClosingCountdown } from "./tracker-closing-countdown";

const TODAY = "2026-06-07";

describe("TrackerClosingCountdown", () => {
  it("shows the countdown and a milestone timeline for a valid closing date", () => {
    render(
      <TrackerClosingCountdown
        underContractDate="2026-06-01"
        closingDate="2026-07-01"
        offsets={defaultOffsets}
        today={TODAY}
      />,
    );

    // 2026-06-07 -> 2026-07-01 is 24 days.
    expect(screen.getByText("24 days to closing")).toBeInTheDocument();
    // The closing date is shown alongside the countdown.
    expect(screen.getByText(/Jul 1, 2026/)).toBeInTheDocument();

    // The compact timeline renders the milestones.
    const timeline = screen.getByRole("list", { name: /milestone timeline/i });
    expect(timeline).toBeInTheDocument();
    // computeMilestones produces 8 milestones for two valid in-order dates.
    expect(timeline.querySelectorAll("li")).toHaveLength(8);
    expect(screen.getByText(/Closing day/)).toBeInTheDocument();
  });

  it("shows the empty-state prompt when no closing date is set", () => {
    render(
      <TrackerClosingCountdown
        underContractDate=""
        closingDate=""
        offsets={defaultOffsets}
        today={TODAY}
      />,
    );

    expect(
      screen.getByText(/add your closing date below/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: /milestone timeline/i }),
    ).not.toBeInTheDocument();
  });

  it("treats an invalid closing date as the empty state", () => {
    render(
      <TrackerClosingCountdown
        underContractDate="2026-06-01"
        closingDate="2026-02-30"
        offsets={defaultOffsets}
        today={TODAY}
      />,
    );

    expect(
      screen.getByText(/add your closing date below/i),
    ).toBeInTheDocument();
  });

  it("shows the countdown but a 'check your dates' note when dates are out of order", () => {
    // Closing before under-contract -> computeMilestones returns [].
    render(
      <TrackerClosingCountdown
        underContractDate="2026-07-01"
        closingDate="2026-06-15"
        offsets={defaultOffsets}
        today={TODAY}
      />,
    );

    expect(screen.getByText(/to closing|Closing today|Closed/)).toBeInTheDocument();
    expect(screen.getByText(/couldn.{0,3}t build a timeline/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: /milestone timeline/i }),
    ).not.toBeInTheDocument();
  });
});
