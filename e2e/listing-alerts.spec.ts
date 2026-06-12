import { expect, test } from "@playwright/test";

test("the listing-alerts guide renders, is honest about the MLS gap, and is portal-neutral", async ({
  page,
}) => {
  await page.goto("/tools/listing-alerts");
  await expect(
    page.getByRole("heading", { name: /listing alerts & access guide/i }),
  ).toBeVisible();

  // Honesty note: not a full search.
  await expect(page.getByText(/not all the way/i)).toBeVisible();
  await expect(
    page.getByText(/some inventory genuinely isn't on the portals/i),
  ).toBeVisible();

  // Lists several portals, endorses none.
  await expect(page.getByRole("link", { name: /Zillow/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Redfin/i })).toBeVisible();
});
