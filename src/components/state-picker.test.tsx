import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const selectState = vi.fn();
let mockState: { stateCode: string | null; hydrated: boolean } = {
  stateCode: null,
  hydrated: true,
};
vi.mock("@/hooks/use-state-selection", () => ({
  useStateSelection: () => ({ ...mockState, selectState }),
}));

import { StatePicker } from "./state-picker";

describe("StatePicker", () => {
  it("reports the chosen state code", () => {
    selectState.mockClear();
    mockState = { stateCode: null, hydrated: true };
    render(<StatePicker />);
    fireEvent.change(screen.getByLabelText("Your state"), {
      target: { value: "CA" },
    });
    expect(selectState).toHaveBeenCalledWith("CA");
  });

  it("clears the selection to null when the placeholder is chosen", () => {
    selectState.mockClear();
    mockState = { stateCode: "CA", hydrated: true };
    render(<StatePicker />);
    const select = screen.getByLabelText("Your state") as HTMLSelectElement;
    expect(select.value).toBe("CA");
    fireEvent.change(select, { target: { value: "" } });
    expect(selectState).toHaveBeenCalledWith(null);
  });
});
