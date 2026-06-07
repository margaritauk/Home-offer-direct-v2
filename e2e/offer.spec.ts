import { expect, test } from "@playwright/test";

test("the offer builder renders with the UPL worksheet disclaimer", async ({ page }) => {
  await page.goto("/tools/offer-builder");
  await expect(
    page.getByRole("heading", { name: /offer worksheet builder/i }),
  ).toBeVisible();
  // The UPL guardrail (#17): always framed as a worksheet, not a contract.
  await expect(page.getByText(/not a binding contract/i).first()).toBeVisible();
});

test("the offer builder is reachable from the make-an-offer stage", async ({ page }) => {
  await page.goto("/journey/make-an-offer");
  await page.locator("ol li a").first().click();
  await expect(page.getByRole("link", { name: /use the offer builder/i })).toBeVisible();
});
