import { expect, test, type Page } from "@playwright/test";

/**
 * S1-R3 cockpit + S1-R1 in-app reminders E2E (Playwright is CI-only).
 * Selector discipline: roles / unique accessible text / .first().
 */

/**
 * Record a home so a `HomeRollup` exists — the cockpit (and the reminder banner it
 * nests) only leave the first-run empty state once there is at least one home to
 * rank. Tracker dates alone are global and don't create a rollup.
 */
async function trackAHome(page: Page) {
  await page.goto("/showings");
  await page.getByRole("button", { name: /add a property manually/i }).click();
  // Exact labels — the showings page also has state <select>s whose accessible
  // names contain "State", so a substring getByLabel would be ambiguous.
  await page.getByLabel("Street address", { exact: true }).fill("123 Main St");
  await page.getByLabel("City", { exact: true }).fill("Austin");
  await page.getByLabel("State", { exact: true }).fill("TX");
  await page.getByRole("button", { name: /add to tracker/i }).click();
}

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
  await trackAHome(page);

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
  // The banner renders within the cockpit's active state, so a home is needed.
  await trackAHome(page);

  await page.goto("/dashboard");
  // Future dates ⇒ reminders armed, nothing due yet.
  await expect(page.getByText(/reminders armed/i).first()).toBeVisible();
  await expect(
    page.getByText(/contract is the source of truth/i).first(),
  ).toBeVisible();
});
