import { expect, test } from "@playwright/test";

/**
 * S1-R3 cockpit + S1-R1 in-app reminders E2E (Playwright is CI-only).
 * Selector discipline: roles / unique accessible text / .first().
 */

test("the dashboard cockpit shows the first-run prompt before any deal data", async ({
  page,
}) => {
  await page.goto("/dashboard");
  // Empty state is a prompt, never a blank page.
  await expect(
    page.getByRole("heading", { name: /tell us where you are/i }),
  ).toBeVisible();
});

test("the cockpit surfaces a next action once deal dates are set", async ({ page }) => {
  // Set dates on the tracker (same device-local store the cockpit reads).
  await page.goto("/tracker");
  await page.getByLabel(/date you went under contract/i).fill("2026-06-01");
  await page.getByLabel(/target closing date/i).fill("2026-08-01");
  // Record a home so a rollup exists for the cockpit to rank.
  await page.goto("/showings");

  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: /what needs you this week/i }).first(),
  ).toBeVisible();
  // At least one ranked action card with a deep link.
  await expect(page.getByRole("listitem").first()).toBeVisible();
  // UPL note is present.
  await expect(page.getByText(/contract governs/i)).toBeVisible();
});

test("the in-app reminder banner reflects armed reminders after dates are set", async ({
  page,
}) => {
  await page.goto("/tracker");
  await page.getByLabel(/date you went under contract/i).fill("2099-06-01");
  await page.getByLabel(/target closing date/i).fill("2099-08-01");

  await page.goto("/dashboard");
  // Future dates ⇒ reminders armed, nothing due yet.
  await expect(page.getByText(/reminders armed/i).first()).toBeVisible();
  await expect(
    page.getByText(/contract is the source of truth/i).first(),
  ).toBeVisible();
});
