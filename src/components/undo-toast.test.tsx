import { render, screen, fireEvent, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UndoToast } from "./undo-toast";

describe("UndoToast", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when show is false", () => {
    const { container } = render(
      <UndoToast show={false} onUndo={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a status row with an Undo button when show is true", () => {
    render(<UndoToast show onUndo={() => {}} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /undo/i }),
    ).toBeInTheDocument();
  });

  it("calls onUndo when the Undo button is clicked", () => {
    const onUndo = vi.fn();
    render(<UndoToast show onUndo={onUndo} />);
    fireEvent.click(screen.getByRole("button", { name: /undo/i }));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it("auto-hides after the timeout fires", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<UndoToast show onUndo={() => {}} onDismiss={onDismiss} />);
    expect(screen.getByRole("status")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("renders a custom label", () => {
    render(<UndoToast show onUndo={() => {}} label="Cleared" />);
    expect(screen.getByRole("status").textContent).toMatch(/Cleared/);
  });
});
