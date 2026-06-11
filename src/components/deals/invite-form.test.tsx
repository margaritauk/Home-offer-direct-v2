import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InviteForm } from "./invite-form";

describe("InviteForm", () => {
  it("submits the typed email and selected role", async () => {
    const invite = vi.fn().mockResolvedValue({});
    render(<InviteForm invite={invite} />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "co@buyer.com" },
    });
    fireEvent.change(screen.getByLabelText("Role"), {
      target: { value: "attorney" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send invite" }));

    await waitFor(() =>
      expect(invite).toHaveBeenCalledWith("co@buyer.com", "attorney"),
    );
    // On success the confirmation shows and the email field is cleared.
    expect(screen.getByText(/invitation created/i)).toBeInTheDocument();
    expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("");
  });

  it("surfaces the error returned by invite and keeps the email", async () => {
    const invite = vi.fn().mockResolvedValue({ error: "Already a member" });
    render(<InviteForm invite={invite} />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "dupe@buyer.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send invite" }));

    await waitFor(() =>
      expect(screen.getByText("Already a member")).toBeInTheDocument(),
    );
    expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe(
      "dupe@buyer.com",
    );
  });
});
