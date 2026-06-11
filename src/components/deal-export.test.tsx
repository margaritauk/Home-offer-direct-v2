import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DealExport } from "./deal-export";

// Light RTL: the export button should trigger a Blob download. We stub the
// URL/anchor plumbing so jsdom doesn't choke on createObjectURL.
describe("DealExport", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:mock"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("triggers a download when the export button is clicked", () => {
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    render(<DealExport />);
    fireEvent.click(screen.getByRole("button", { name: /export my deal/i }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
    // Success status surfaces to the user.
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("makes the device-local guarantee explicit in the copy", () => {
    render(<DealExport />);
    expect(screen.getByText(/nothing is uploaded/i)).toBeInTheDocument();
  });
});
