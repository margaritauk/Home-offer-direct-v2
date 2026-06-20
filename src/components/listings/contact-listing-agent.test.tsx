import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContactListingAgent } from "./contact-listing-agent";

describe("ContactListingAgent", () => {
  it("renders call / email / draft actions and the source + agency reminders", () => {
    render(
      <ContactListingAgent
        agent={{
          name: "Jordan Lee",
          phone: "512-555-0142",
          email: "jordan@example.com",
        }}
        office={{ name: "Acme Realty" }}
        address="123 Maple St"
        mlsNumber="1234567"
      />,
    );

    expect(
      screen.getByRole("heading", { name: /contact the listing agent/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Jordan Lee")).toBeInTheDocument();

    const call = screen.getByRole("link", { name: /call/i });
    expect(call).toHaveAttribute("href", "tel:5125550142");
    const email = screen.getByRole("link", { name: /email/i });
    expect(email.getAttribute("href")).toMatch(/^mailto:jordan@example\.com/);

    // Honesty + agency reminders.
    expect(screen.getByText(/verify before/i)).toBeInTheDocument();
    expect(screen.getByText(/works for the/i)).toBeInTheDocument();
  });

  it("opens the message composer prefilled when 'Draft my showing request' is clicked", () => {
    render(
      <ContactListingAgent
        agent={{ name: "Jordan Lee", email: "jordan@example.com" }}
        address="123 Maple St"
        mlsNumber="1234567"
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /draft my showing request/i }),
    );
    // The composer renders, with the agent name + address + MLS# prefilled.
    expect(
      screen.getByRole("heading", { name: /message a listing agent/i }),
    ).toBeInTheDocument();
    expect(
      (screen.getByLabelText("Listing agent name") as HTMLInputElement).value,
    ).toBe("Jordan Lee");
    expect(
      (screen.getByLabelText("Property address") as HTMLInputElement).value,
    ).toBe("123 Maple St");
    expect((screen.getByLabelText("MLS #") as HTMLInputElement).value).toBe(
      "1234567",
    );
  });

  it("renders nothing when there is no usable contact data (graceful absent-state)", () => {
    const { container } = render(
      <ContactListingAgent agent={{}} office={undefined} address="1 Main St" />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
