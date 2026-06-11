import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const track = vi.fn();
vi.mock("@/hooks/use-showings", () => ({
  useShowings: () => ({ track, hydrated: true }),
}));

import { ManualAddShowing } from "./manual-add-showing";

function openForm() {
  fireEvent.click(
    screen.getByRole("button", { name: /add a property manually/i }),
  );
}

describe("ManualAddShowing", () => {
  it("expands the form on demand", () => {
    render(<ManualAddShowing />);
    expect(screen.queryByLabelText("Street address")).toBeNull();
    openForm();
    expect(screen.getByLabelText("Street address")).toBeInTheDocument();
  });

  it("tracks the typed property, upper-casing the state to two letters", () => {
    track.mockClear();
    render(<ManualAddShowing />);
    openForm();
    fireEvent.change(screen.getByLabelText("Street address"), {
      target: { value: "123 Maple St" },
    });
    fireEvent.change(screen.getByLabelText("City"), {
      target: { value: "Austin" },
    });
    fireEvent.change(screen.getByLabelText("State"), {
      target: { value: "tx" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add to tracker" }));

    expect(track).toHaveBeenCalledTimes(1);
    expect(track.mock.calls[0][0]).toMatchObject({
      address: "123 Maple St",
      city: "Austin",
      state: "TX",
      manual: true,
    });
  });

  it("does not track when a required field is blank", () => {
    track.mockClear();
    render(<ManualAddShowing />);
    openForm();
    fireEvent.change(screen.getByLabelText("Street address"), {
      target: { value: "123 Maple St" },
    });
    // City + state left empty.
    fireEvent.click(screen.getByRole("button", { name: "Add to tracker" }));
    expect(track).not.toHaveBeenCalled();
  });
});
