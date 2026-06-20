import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/journey/tour-and-evaluate/schedule-and-assess",
}));

import { StepProgressHeader } from "./step-progress-header";

const BASE = {
  stageOrder: 4,
  totalStages: 14,
  stageTitle: "Tour & Evaluate",
  stageSlug: "tour-and-evaluate",
  stepSlug: "schedule-and-assess",
  stepTitle: "Schedule tours and assess condition",
  stepSummary: "Line up showings and score what you see.",
  stepNumber: 7,
  totalSteps: 22,
  tasks: [{ id: "t1" }, { id: "t2" }],
};

afterEach(() => {
  window.localStorage.clear();
});

describe("StepProgressHeader", () => {
  it("shows the where-am-I position and the H1, focusing the H1 on mount", async () => {
    render(<StepProgressHeader {...BASE} />);
    expect(
      screen.getByText("Step 7 of 22 · Stage 4 of 14"),
    ).toBeInTheDocument();

    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Schedule tours and assess condition",
    });
    expect(heading).toHaveAttribute("tabindex", "-1");
    // The focus-on-route-change pattern moves focus to the H1.
    await waitFor(() => expect(heading).toHaveFocus());
  });

  it("reads 'Not started' with no progress", async () => {
    render(<StepProgressHeader {...BASE} />);
    await waitFor(() =>
      expect(screen.getByLabelText("Status: Not started")).toBeInTheDocument(),
    );
  });

  it("reads 'In progress' when some — but not all — required tasks are ticked", async () => {
    window.localStorage.setItem(
      "hod:progress:v1",
      JSON.stringify({ "tour-and-evaluate/schedule-and-assess/t1": true }),
    );
    render(<StepProgressHeader {...BASE} />);
    await waitFor(() =>
      expect(screen.getByLabelText("Status: In progress")).toBeInTheDocument(),
    );
  });

  it("reads 'Complete' when all required tasks are ticked", async () => {
    window.localStorage.setItem(
      "hod:progress:v1",
      JSON.stringify({
        "tour-and-evaluate/schedule-and-assess/t1": true,
        "tour-and-evaluate/schedule-and-assess/t2": true,
      }),
    );
    render(<StepProgressHeader {...BASE} />);
    await waitFor(() =>
      expect(screen.getByLabelText("Status: Complete")).toBeInTheDocument(),
    );
  });
});
