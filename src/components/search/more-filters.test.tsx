import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  MoreFilters,
  EMPTY_MORE_FILTERS,
  moreFiltersActiveCount,
} from "./more-filters";

describe("moreFiltersActiveCount", () => {
  it("counts each non-empty filter, with property types as one", () => {
    expect(moreFiltersActiveCount(EMPTY_MORE_FILTERS)).toBe(0);
    expect(
      moreFiltersActiveCount({
        ...EMPTY_MORE_FILTERS,
        minSqft: 1000,
        maxBeds: 4,
        propertyTypes: ["condo", "townhouse"],
      }),
    ).toBe(3);
  });
});

describe("MoreFilters", () => {
  it("stays collapsed until the disclosure is opened", () => {
    render(
      <MoreFilters value={EMPTY_MORE_FILTERS} onChange={() => {}} />,
    );
    expect(screen.queryByLabelText("Min sqft")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /more filters/i }));
    expect(screen.getByLabelText("Min sqft")).toBeInTheDocument();
  });

  it("reports a typed sqft minimum", () => {
    const onChange = vi.fn();
    render(
      <MoreFilters
        value={EMPTY_MORE_FILTERS}
        onChange={onChange}
        collapsible={false}
      />,
    );
    fireEvent.change(screen.getByLabelText("Min sqft"), {
      target: { value: "1500" },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ minSqft: 1500 }),
    );
  });

  it("toggles a property type on via its checkbox", () => {
    const onChange = vi.fn();
    render(
      <MoreFilters
        value={EMPTY_MORE_FILTERS}
        onChange={onChange}
        collapsible={false}
      />,
    );
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].propertyTypes).toHaveLength(1);
  });
});
