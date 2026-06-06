import { expect, test } from "@playwright/test";

// CI runs without Supabase env vars, so cloud sync is disabled. These tests
// verify the feature is cleanly gated and doesn't affect the rest of the app.

test("the account page renders and reports sync status", async ({ page }) => {
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: /your account/i })).toBeVisible();
  // With sync unconfigured it shows the coming-soon state rather than a form.
  await expect(page.getByText(/coming soon|sign in/i).first()).toBeVisible();
});

test("core localStorage flows still work with sync disabled", async ({ page }) => {
  await page.goto("/journey/get-ready");
  await page.locator("ol li a").first().click();
  const checkbox = page.getByRole("checkbox").first();
  await checkbox.check();
  await expect(checkbox).toBeChecked();
});
