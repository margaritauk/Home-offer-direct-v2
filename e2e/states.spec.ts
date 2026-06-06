import { expect, test } from "@playwright/test";

test("a buyer can pick their state and see tailored guidance", async ({ page }) => {
  await page.goto("/states");
  await expect(
    page.getByRole("heading", { name: /how home buying works in your state/i }),
  ).toBeVisible();

  // Choose California from the picker.
  await page.getByLabel(/your state/i).first().selectOption("CA");

  // The selected-state guide appears.
  await expect(page.getByRole("heading", { name: /^California$/ })).toBeVisible();
  await expect(page.getByText(/closing process/i).first()).toBeVisible();
});

test("a direct state page renders its guide and adopts the selection", async ({
  page,
}) => {
  await page.goto("/states/ny");
  await expect(
    page.getByRole("heading", { name: /buying a home in new york/i }),
  ).toBeVisible();
  await expect(page.getByText(/seller disclosures/i).first()).toBeVisible();
});

test("a selected state persists across navigation to the journey", async ({
  page,
}) => {
  await page.goto("/states");
  await page.getByLabel(/your state/i).first().selectOption("IL");
  await expect(page.getByRole("heading", { name: /^Illinois$/ })).toBeVisible();

  // Navigate away to the journey — the banner should confirm Illinois, not
  // prompt for a state again.
  await page.goto("/journey");
  await expect(page.getByText(/personalized for/i)).toBeVisible();
  await expect(page.getByText(/illinois/i)).toBeVisible();
  await expect(page.getByText(/tell us your state/i)).toHaveCount(0);
});

test("state-relevant journey steps surface a state-aware callout", async ({
  page,
}) => {
  // Selecting a state on its page persists it for the journey.
  await page.goto("/states/tx");
  await expect(
    page.getByRole("heading", { name: /buying a home in texas/i }),
  ).toBeVisible();

  // The Title & Escrow stage step should now show Texas-specific guidance.
  await page.goto("/journey/title-and-escrow");
  await page.locator("ol li a").first().click();
  await expect(page.getByText(/in texas/i).first()).toBeVisible();
});
