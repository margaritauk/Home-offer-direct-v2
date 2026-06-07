import { expect, test } from "@playwright/test";

test("the showings tracker page renders", async ({ page }) => {
  await page.goto("/showings");
  await expect(
    page.getByRole("heading", { name: /showings tracker/i }),
  ).toBeVisible();
});

test("a listing shows agency coaching and a track control", async ({ page }) => {
  await page.goto("/listings/ca-101");
  // #19 agency explainer: coach that the listing agent works for the seller.
  await expect(page.getByText(/the seller/i).first()).toBeVisible();
  // #20 track entry point.
  await expect(page.getByText(/track this showing|track showing/i).first()).toBeVisible();
});

test("state guide flags a dual-agency-banned state", async ({ page }) => {
  // #27: Texas bans dual agency.
  await page.goto("/states/tx");
  await expect(page.getByText(/dual agency/i).first()).toBeVisible();
});
