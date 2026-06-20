import { describe, expect, it } from "vitest";
import {
  aggregateHomes,
  normalizeAddress,
  type HomeSources,
} from "./my-homes";

describe("normalizeAddress", () => {
  it("lowercases, strips punctuation, and collapses whitespace", () => {
    expect(normalizeAddress("123 Maple St.")).toBe("123 maple st");
    expect(normalizeAddress("  123   Maple   St  ")).toBe("123 maple st");
    expect(normalizeAddress("123 Maple St.")).toBe(normalizeAddress("123 maple st"));
  });

  it("returns empty string for undefined / blank", () => {
    expect(normalizeAddress(undefined)).toBe("");
    expect(normalizeAddress("   ")).toBe("");
  });
});

describe("aggregateHomes", () => {
  it("returns an empty list for empty sources", () => {
    expect(aggregateHomes({})).toEqual([]);
  });

  it("merges homes from all three sources", () => {
    const homes = aggregateHomes({
      listings: [
        { id: "l1", address: "1 Oak Ave", city: "Austin", state: "TX", sqft: 1800 },
      ],
      showings: [
        { listingId: "s1", address: "2 Elm St", city: "Dallas", state: "TX" },
      ],
      scorecard: [{ id: "h1", label: "3 Pine Rd" }],
    });
    expect(homes).toHaveLength(3);
    expect(homes.map((h) => h.source)).toEqual([
      "Home search",
      "Your showings",
      "Tour scorecard",
    ]);
  });

  it("labels each home with the source it came from", () => {
    const homes = aggregateHomes({
      listings: [{ id: "l1", address: "1 Oak Ave", city: "Austin", state: "TX" }],
      showings: [{ listingId: "s1", address: "2 Elm St", city: "Dallas", state: "TX" }],
      scorecard: [{ id: "h1", label: "3 Pine Rd" }],
    });
    const bySource = Object.fromEntries(homes.map((h) => [h.source, h]));
    expect(bySource["Home search"].label).toBe("1 Oak Ave");
    expect(bySource["Your showings"].label).toBe("2 Elm St");
    expect(bySource["Tour scorecard"].label).toBe("3 Pine Rd");
  });

  it("carries listing sqft and listingId through", () => {
    const [home] = aggregateHomes({
      listings: [{ id: "l1", address: "1 Oak Ave", sqft: 2200 }],
    });
    expect(home.sqft).toBe(2200);
    expect(home.listingId).toBe("l1");
    expect(home.key).toBe("listing:l1");
  });

  it("widens listing facts (price/beds/baths/propertyType) through to MyHome", () => {
    const [home] = aggregateHomes({
      listings: [
        {
          id: "l1",
          address: "1 Oak Ave",
          price: 525000,
          beds: 3,
          baths: 2,
          sqft: 1840,
          propertyType: "single-family",
        },
      ],
    });
    expect(home.price).toBe(525000);
    expect(home.beds).toBe(3);
    expect(home.baths).toBe(2);
    expect(home.sqft).toBe(1840);
    expect(home.propertyType).toBe("single-family");
  });

  it("leaves the widened facts undefined for showing/scorecard sources", () => {
    const homes = aggregateHomes({
      showings: [{ listingId: "s1", address: "2 Elm St" }],
      scorecard: [{ id: "h1", label: "3 Pine Rd" }],
    });
    for (const home of homes) {
      expect(home.price).toBeUndefined();
      expect(home.beds).toBeUndefined();
      expect(home.propertyType).toBeUndefined();
    }
  });

  it("uppercases the state code", () => {
    const [home] = aggregateHomes({
      listings: [{ id: "l1", address: "1 Oak Ave", state: "tx" }],
    });
    expect(home.state).toBe("TX");
  });

  it("dedupes a listing and a showing that share a listingId", () => {
    const homes = aggregateHomes({
      listings: [
        { id: "shared", address: "1 Oak Ave", city: "Austin", state: "TX", sqft: 1800 },
      ],
      showings: [
        { listingId: "shared", address: "1 Oak Ave", city: "Austin", state: "TX" },
      ],
    });
    expect(homes).toHaveLength(1);
    // Listing wins: richer source, keeps sqft + "Home search" provenance.
    expect(homes[0].source).toBe("Home search");
    expect(homes[0].sqft).toBe(1800);
  });

  it("dedupes by normalized address when there's no shared id", () => {
    const homes = aggregateHomes({
      listings: [{ id: "l1", address: "123 Maple St." }],
      // Scorecard entry typed slightly differently — same home.
      scorecard: [{ id: "h1", label: "123 maple st" }],
    });
    expect(homes).toHaveLength(1);
    expect(homes[0].source).toBe("Home search");
  });

  it("does NOT dedupe a listing and a showing with different ids and addresses", () => {
    const homes = aggregateHomes({
      listings: [{ id: "l1", address: "1 Oak Ave" }],
      showings: [{ listingId: "s2", address: "2 Elm St" }],
    });
    expect(homes).toHaveLength(2);
  });

  it("fills missing factual fields from a later source on merge", () => {
    const homes = aggregateHomes({
      // Listing-keyed home with no city/state.
      listings: [{ id: "shared", address: "1 Oak Ave" }],
      // Same listingId via a showing that does have city/state.
      showings: [{ listingId: "shared", address: "1 Oak Ave", city: "Austin", state: "TX" }],
    });
    expect(homes).toHaveLength(1);
    expect(homes[0].city).toBe("Austin");
    expect(homes[0].state).toBe("TX");
    // But provenance stays with the higher-priority listing source.
    expect(homes[0].source).toBe("Home search");
  });

  it("skips blank scorecard labels", () => {
    const homes = aggregateHomes({
      scorecard: [
        { id: "h1", label: "   " },
        { id: "h2", label: "Real Home" },
      ],
    });
    expect(homes).toHaveLength(1);
    expect(homes[0].label).toBe("Real Home");
  });

  it("dedupes two scorecard homes with the same normalized label", () => {
    const homes = aggregateHomes({
      scorecard: [
        { id: "h1", label: "5 Birch Ln" },
        { id: "h2", label: "5 birch ln." },
      ],
    });
    expect(homes).toHaveLength(1);
  });

  it("preserves source order: listings, then showings, then scorecard", () => {
    const sources: HomeSources = {
      scorecard: [{ id: "h1", label: "Z Scorecard Home" }],
      showings: [{ listingId: "s1", address: "Y Showing Home" }],
      listings: [{ id: "l1", address: "X Listing Home" }],
    };
    const homes = aggregateHomes(sources);
    expect(homes.map((h) => h.label)).toEqual([
      "X Listing Home",
      "Y Showing Home",
      "Z Scorecard Home",
    ]);
  });
});
