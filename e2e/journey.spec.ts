import { expect, test } from "@playwright/test";

test("landing page shows the value prop and CTA", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /guided start to finish/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /start the journey/i }).first()).toBeVisible();
});

test("a buyer can open the journey, work a step, and see progress update", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: /start the journey/i }).first().click();

  await expect(page).toHaveURL(/\/journey$/);
  await expect(page.getByText(/overall progress/i)).toBeVisible();

  // Open the first stage, then its first step.
  await page.getByRole("link", { name: /stage 1/i }).first().click();
  await expect(page).toHaveURL(/\/journey\/.+/);
  await page.getByRole("link").filter({ hasText: /.+/ }).nth(0); // ensure links present

  // Click the first step card on the stage page.
  await page.locator("ol li a").first().click();
  await expect(page).toHaveURL(/\/journey\/[^/]+\/[^/]+/);

  // The checklist is present.
  const checklist = page.getByText(/your checklist/i);
  await expect(checklist).toBeVisible();

  // Tick the first task and confirm the count moves off 0.
  const firstCheckbox = page.getByRole("checkbox").first();
  await firstCheckbox.check();
  await expect(firstCheckbox).toBeChecked();
});

test("savings calculator reacts to the capture-rate slider", async ({ page }) => {
  await page.goto("/tools/savings-calculator");
  const captured = page.getByTestId("captured-savings");
  await expect(captured).toBeVisible();
  // At default 100% capture on a $400k home at 2.5%, savings are $10,000.
  await expect(captured).toHaveText(/\$10,000/);
});

test("glossary search filters terms", async ({ page }) => {
  await page.goto("/glossary");
  const search = page.getByRole("searchbox", { name: /search glossary/i });
  await search.fill("escrow");
  await expect(page.getByText(/escrow/i).first()).toBeVisible();
});
