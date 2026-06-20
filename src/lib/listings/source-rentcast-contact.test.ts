import { describe, expect, it } from "vitest";
import { mapListingContact, mapRentCastListings } from "./source-rentcast";

describe("mapListingContact", () => {
  it("maps a full agent block (name/phone/email/website)", () => {
    expect(
      mapListingContact({
        name: "Jordan Lee",
        phone: "(512) 555-0142",
        email: "jordan@example.com",
        website: "jordanlee.example.com",
      }),
    ).toEqual({
      name: "Jordan Lee",
      phone: "(512) 555-0142",
      email: "jordan@example.com",
      website: "https://jordanlee.example.com",
    });
  });

  it("keeps only the present fields (partial)", () => {
    expect(mapListingContact({ name: "Jordan Lee" })).toEqual({
      name: "Jordan Lee",
    });
  });

  it("drops a malformed email / phone rather than fabricating", () => {
    expect(
      mapListingContact({ name: "X", email: "not-an-email", phone: "123" }),
    ).toEqual({ name: "X" });
  });

  it("returns undefined when nothing usable is present (never a hollow object)", () => {
    expect(mapListingContact({})).toBeUndefined();
    expect(mapListingContact({ phone: "12" })).toBeUndefined();
    expect(mapListingContact(null)).toBeUndefined();
    expect(mapListingContact("garbage")).toBeUndefined();
  });
});

describe("mapRentCastListings — agent/office", () => {
  const base = {
    id: "l1",
    formattedAddress: "123 Main St, Austin, TX 78701",
    city: "Austin",
    state: "TX",
    zipCode: "78701",
    price: 525000,
    squareFootage: 1840,
    propertyType: "Single Family",
  };

  it("maps listingAgent + listingOffice onto the listing", () => {
    const [listing] = mapRentCastListings([
      {
        ...base,
        listingAgent: {
          name: "Jordan Lee",
          phone: "512-555-0142",
          email: "jordan@example.com",
        },
        listingOffice: { name: "Acme Realty", phone: "512-555-0100" },
      },
    ]);
    expect(listing.listingAgent).toEqual({
      name: "Jordan Lee",
      phone: "512-555-0142",
      email: "jordan@example.com",
    });
    expect(listing.listingOffice).toEqual({
      name: "Acme Realty",
      phone: "512-555-0100",
    });
  });

  it("leaves agent/office undefined when absent (never fabricated)", () => {
    const [listing] = mapRentCastListings([base]);
    expect(listing.listingAgent).toBeUndefined();
    expect(listing.listingOffice).toBeUndefined();
  });

  it("never throws on garbage agent data", () => {
    expect(() =>
      mapRentCastListings([{ ...base, listingAgent: "nope", listingOffice: 42 }]),
    ).not.toThrow();
    const [listing] = mapRentCastListings([
      { ...base, listingAgent: "nope" },
    ]);
    expect(listing.listingAgent).toBeUndefined();
  });
});
