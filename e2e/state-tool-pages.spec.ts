import { expect, test } from "@playwright/test";

// S7-SEO1 — generated "…in <state>" tool pages load with the correct heading
// and an embedded working tool. Selector discipline: getByRole / unique text /
// .first(), never a bare substring that could match multiple elements.

test("savings-calculator state page (CA) loads with the correct heading + tool", async ({
  page,
}) => {
  await page.goto("/tools/savings-calculator/ca");
  await expect(
    page.getByRole("heading", {
      name: /commission savings calculator for california/i,
    }),
  ).toBeVisible();
  // The embedded calculator is above the fold.
  await expect(page.getByLabel(/home price/i).first()).toBeVisible();
  // Activation CTA into the journey.
  await expect(
    page.getByRole("link", { name: /start your california journey/i }),
  ).toBeVisible();
});

test("closing-path state page (TX) loads with the correct heading + objective facts", async ({
  page,
}) => {
  await page.goto("/tools/closing-path/tx");
  await expect(
    page.getByRole("heading", { name: /how home closing works in texas/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: /objective texas facts/i }),
  ).toBeVisible();
});

test("an invalid state slug returns a 404", async ({ page }) => {
  const res = await page.goto("/tools/savings-calculator/zz");
  expect(res?.status()).toBe(404);
});
