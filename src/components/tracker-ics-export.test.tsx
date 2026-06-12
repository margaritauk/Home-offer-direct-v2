import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TrackerIcsExport } from "./tracker-ics-export";
import { computeMilestones, defaultOffsets } from "@/lib/deadlines";

const milestones = computeMilestones({
  underContractDate: "2026-06-01",
  closingDate: "2026-07-01",
  offsets: defaultOffsets,
});

describe("TrackerIcsExport", () => {
  beforeEach(() => {
    // jsdom lacks createObjectURL/revokeObjectURL.
    Object.assign(URL, {
      createObjectURL: vi.fn(() => "blob:mock"),
      revokeObjectURL: vi.fn(),
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it("disables export with an accessible explanation when there are no deadlines", () => {
    render(<TrackerIcsExport milestones={[]} />);
    const button = screen.getByRole("button", { name: /export deadlines/i });
    expect(button).toBeDisabled();
    expect(
      screen.getByText(/set your contract date to enable calendar export/i),
    ).toBeInTheDocument();
  });

  it("renders a per-deadline 'Add to calendar' button and an export-all button", () => {
    render(<TrackerIcsExport milestones={milestones} />);
    expect(
      screen.getByRole("button", { name: /export deadlines/i }),
    ).toBeEnabled();
    expect(
      screen.getAllByRole("button", { name: /add to calendar/i }).length,
    ).toBe(milestones.length);
  });

  it("triggers a calendar download and announces 'Exported' on export-all", () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<TrackerIcsExport milestones={milestones} />);

    fireEvent.click(screen.getByRole("button", { name: /export deadlines/i }));

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toMatch(/exported all deadlines/i);
  });
});
