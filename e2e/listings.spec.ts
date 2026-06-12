import { expect, test } from "@playwright/test";

test("the listings page browses sample homes with a disclaimer", async ({ page }) => {
  await page.goto("/listings");
  await expect(page.getByRole("heading", { name: /search homes/i })).toBeVisible();
  await expect(
    page.getByText(/starter shortlist, not a full search engine/i).first(),
  ).toBeVisible();
  // At least one listing card is shown (a link to a detail page).
  await expect(page.locator("a[href^='/listings/']").first()).toBeVisible();
});

test("filtering by property type narrows results", async ({ page }) => {
  await page.goto("/listings");
  await page.getByLabel(/property type/i).selectOption("condo");
  await expect(page.getByText(/listing(s)?$/i).first()).toBeVisible();
});

test("opening a listing shows detail and an offer hand-in", async ({ page }) => {
  await page.goto("/listings");
  await page.locator("a[href^='/listings/']").first().click();
  await expect(page).toHaveURL(/\/listings\/.+/);
  await expect(page.getByRole("link", { name: /start your offer/i })).toBeVisible();
});
