import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ResumeCard } from "./resume-card";

afterEach(() => window.localStorage.clear());

function setLastPosition(pos: unknown) {
  window.localStorage.setItem(
    "hod:tool:__last-position:v1",
    JSON.stringify({ position: pos }),
  );
}

describe("ResumeCard", () => {
  it("shows nothing when there is no last position (first run)", () => {
    const { container } = render(<ResumeCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows 'Resume: <label>' with a link when a live position exists", async () => {
    setLastPosition({
      kind: "tool",
      href: "/tools/tour-scorecard",
      label: "Tour Scorecard",
      updatedAt: 1,
    });
    render(<ResumeCard />);
    await waitFor(() =>
      expect(screen.getByText("Tour Scorecard")).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("link", { name: /resume where you left off/i }),
    ).toHaveAttribute("href", "/tools/tour-scorecard");
  });
});
