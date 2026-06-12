import { expect, test } from "@playwright/test";

test("the market conditions tool renders with its estimate disclaimer", async ({
  page,
}) => {
  await page.goto("/tools/market");
  await expect(
    page.getByRole("heading", { name: /market conditions/i }),
  ).toBeVisible();
  // Manual-entry inputs are present (manual-first).
  await expect(page.getByLabel(/months of supply/i)).toBeVisible();
  // The estimates-only disclaimer (UPL guardrail) is visible.
  await expect(page.getByText(/estimates only — not advice/i)).toBeVisible();
});

test("entering hot numbers yields a seller's-market read", async ({ page }) => {
  await page.goto("/tools/market");
  await page.getByLabel(/months of supply/i).fill("1.5");
  await page.getByLabel(/list-to-sale ratio/i).fill("103");
  // The read renders the headline, a static gauge label, and an sr-only summary
  // that all contain "seller's market"; assert the visible headline (first).
  await expect(page.getByText(/seller's market/i).first()).toBeVisible();
});
