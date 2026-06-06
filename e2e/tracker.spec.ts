import { expect, test } from "@playwright/test";

test("entering deal dates produces a deadline timeline", async ({ page }) => {
  await page.goto("/tracker");
  await expect(
    page.getByRole("heading", { name: /deadline & document tracker/i }),
  ).toBeVisible();

  // Before dates, a prompt is shown.
  await expect(page.getByText(/enter your under-contract and closing dates/i)).toBeVisible();

  await page.getByLabel(/date you went under contract/i).fill("2026-06-01");
  await page.getByLabel(/target closing date/i).fill("2026-07-01");

  // Key milestones appear.
  await expect(page.getByRole("heading", { name: /closing day/i })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /closing disclosure review/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /inspection contingency ends/i }),
  ).toBeVisible();
});

test("document checklist persists across reload", async ({ page }) => {
  await page.goto("/tracker");
  const checkbox = page
    .getByRole("checkbox")
    .first();
  await checkbox.check();
  await expect(checkbox).toBeChecked();

  await page.reload();
  await expect(page.getByRole("checkbox").first()).toBeChecked();
});
