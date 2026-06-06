import { expect, test } from "@playwright/test";

test("mobile users can open the menu and reach Find Pros", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); // iPhone-ish
  await page.goto("/");

  // The desktop nav link is hidden; the hamburger must be present.
  const menuButton = page.getByRole("button", { name: /open menu/i });
  await expect(menuButton).toBeVisible();
  await menuButton.click();

  await page.getByRole("link", { name: /find pros/i }).click();
  await expect(page).toHaveURL(/\/pros/);
  await expect(page.getByRole("heading", { name: /^Find a pro$/ })).toBeVisible();
});

test("desktop users see the nav links directly", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.getByRole("link", { name: /find pros/i }).click();
  await expect(page).toHaveURL(/\/pros/);
});
