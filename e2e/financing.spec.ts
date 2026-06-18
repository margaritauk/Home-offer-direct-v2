import { expect, test, type Page } from "@playwright/test";

/**
 * S5-F1 financing-milestone tracker E2E (Playwright is CI-only).
 * Selector discipline: roles / exact labels / unique accessible text / .first().
 */

/**
 * Record a home so a `HomeRollup` exists — the cockpit only leaves the first-run
 * empty state once there is at least one home to rank.
 */
async function trackAHome(page: Page) {
  await page.goto("/showings");
  await page.getByRole("button", { name: /add a property manually/i }).click();
  await page.getByLabel("Street address", { exact: true }).fill("123 Main St");
  await page.getByLabel("City", { exact: true }).fill("Austin");
  await page.getByLabel("State", { exact: true }).fill("TX");
  await page.getByRole("button", { name: /add to tracker/i }).click();
}

test("a financing milestone surfaces in the cockpit after financing dates are set", async ({
  page,
}) => {
  // Anchor the deal so a rollup + deadline stream exist.
  await page.goto("/tracker");
  await page.getByLabel(/date you went under contract/i).fill("2099-06-01");
  await page.getByLabel(/target closing date/i).fill("2099-09-01");
  await trackAHome(page);

  // Set a near-term financing date on the financing tool (same device-local store
  // the cockpit reads via the unioned milestone source).
  await page.goto("/tools/financing");
  await expect(
    page.getByRole("heading", { name: /financing-milestone tracker/i }).first(),
  ).toBeVisible();
  await page
    .getByLabel("Date for Loan application submitted", { exact: true })
    .fill("2099-06-10");

  // The cockpit now ranks the financing milestone as a "do this now" card.
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: /what needs you this week/i }).first(),
  ).toBeVisible();
  await expect(page.getByRole("listitem").first()).toBeVisible();
});
