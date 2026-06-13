import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";

vi.mock("@/hooks/use-stage-tool", () => ({
  useStageTool: <T,>(_toolId: string, initial: T) => {
    const [value, setValue] = useState<T>(initial);
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

import { HoaReview } from "./hoa-review";

function enableHoa() {
  fireEvent.click(
    screen.getByRole("checkbox", {
      name: /this home is governed by a condo\/hoa/i,
    }),
  );
}

describe("HoaReview", () => {
  it("shows the empty-but-explained state for a non-HOA home by default", () => {
    render(<HoaReview />);
    expect(
      screen.getByText(/no association\? no packet to review/i),
    ).toBeInTheDocument();
    // No red-flag categories until the buyer flags it as an association home.
    expect(
      screen.queryByRole("checkbox", { name: /Flag Operating budget/i }),
    ).not.toBeInTheDocument();
  });

  it("renders the resale-packet red-flag categories once flagged as an HOA home", () => {
    render(<HoaReview />);
    enableHoa();
    expect(
      screen.getByRole("checkbox", {
        name: /Flag Operating budget & reserve study/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", {
        name: /Flag Special assessments/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", {
        name: /Flag Rental caps & owner-occupancy/i,
      }),
    ).toBeInTheDocument();
  });

  it("surfaces the statutory review/cancellation-window reminder for an HOA home", () => {
    render(<HoaReview />);
    enableHoa();
    expect(
      screen.getByText(/watch the review\/cancellation window/i),
    ).toBeInTheDocument();
  });

  it("logs questions and screens protected-class terms on blur", () => {
    render(<HoaReview />);
    enableHoa();
    const field = screen.getByLabelText(
      /Questions to ask about Operating budget/i,
    ) as HTMLTextAreaElement;
    fireEvent.change(field, {
      target: { value: "Reserve funding? Is this a Christian community?" },
    });
    fireEvent.blur(field);
    expect(field.value).not.toMatch(/christian/i);
    expect(field.value).toContain("[removed]");
  });

  it("carries the 'have your attorney review the HOA docs' UPL disclaimer", () => {
    render(<HoaReview />);
    expect(
      screen.getByText(/have your attorney review the hoa docs/i),
    ).toBeInTheDocument();
  });
});
