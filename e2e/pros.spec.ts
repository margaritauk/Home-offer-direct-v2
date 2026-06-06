import { expect, test } from "@playwright/test";

test("the pro directory lists samples and real finder services", async ({ page }) => {
  await page.goto("/pros");
  await expect(page.getByRole("heading", { name: /^Find a pro$/ })).toBeVisible();

  // Sample disclaimer is present and prominent.
  await expect(page.getByText(/sample listings/i).first()).toBeVisible();

  // Real finder services section.
  await expect(
    page.getByRole("heading", { name: /find a real, vetted pro/i }),
  ).toBeVisible();
});

test("filtering by role narrows the directory", async ({ page }) => {
  await page.goto("/pros");
  await page.getByLabel(/type of pro/i).selectOption("inspector");
  // At least one inspector finder service should be visible (InterNACHI/ASHI).
  await expect(page.getByText(/inspector/i).first()).toBeVisible();
});

test("a state-relevant journey step offers a pro handoff", async ({ page }) => {
  // The 'Negotiate & go under contract' stage should offer an attorney.
  await page.goto("/journey/negotiate-and-go-under-contract");
  await page.locator("ol li a").first().click();
  await expect(page.getByText(/bring in a real estate attorney/i)).toBeVisible();
});
