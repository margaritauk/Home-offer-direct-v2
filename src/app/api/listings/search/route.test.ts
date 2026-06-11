import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST } from "./route";

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/listings/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/listings/search", () => {
  const ORIGINAL_SOURCE = process.env.LISTINGS_DATA_SOURCE;
  const ORIGINAL_KEY = process.env.RENTCAST_API_KEY;

  beforeEach(() => {
    delete process.env.LISTINGS_DATA_SOURCE;
    delete process.env.RENTCAST_API_KEY;
  });

  afterEach(() => {
    if (ORIGINAL_SOURCE === undefined) delete process.env.LISTINGS_DATA_SOURCE;
    else process.env.LISTINGS_DATA_SOURCE = ORIGINAL_SOURCE;
    if (ORIGINAL_KEY === undefined) delete process.env.RENTCAST_API_KEY;
    else process.env.RENTCAST_API_KEY = ORIGINAL_KEY;
  });

  it("falls back to the mock source and labels it source: mock", async () => {
    const res = await POST(postRequest({ propertyType: "condo" }));
    const data = (await res.json()) as {
      listings: { propertyType: string; isSample: boolean }[];
      source: string;
    };

    expect(res.status).toBe(200);
    expect(data.source).toBe("mock");
    expect(data.listings.length).toBeGreaterThan(0);
    expect(
      data.listings.every((l) => l.propertyType === "condo" && l.isSample),
    ).toBe(true);
  });

  it("handles an empty / malformed body without throwing", async () => {
    const res = await POST(
      new Request("http://localhost/api/listings/search", {
        method: "POST",
        body: "not json",
      }),
    );
    const data = (await res.json()) as { listings: unknown[]; source: string };
    expect(res.status).toBe(200);
    expect(data.source).toBe("mock");
    expect(Array.isArray(data.listings)).toBe(true);
  });
});
