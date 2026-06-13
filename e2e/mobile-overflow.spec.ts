import { expect, test } from "@playwright/test";

/**
 * #166 — Mobile table-overflow + tap-target guards.
 *
 * On a 360px-wide viewport the comparison-heavy tools must NOT force a horizontal
 * page scroll, and the bottom tab-bar targets must be ≥44px tall.
 */
test.describe("mobile (360px) layout guards", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  const routes = ["/tools/lender-compare", "/tools/comps", "/tools/compare"];

  for (const route of routes) {
    test(`no horizontal page scroll at 360px on ${route}`, async ({ page }) => {
      await page.goto(route);
      // Let the client tools hydrate so any wide content is in the DOM.
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.body.scrollWidth,
        clientWidth: document.body.clientWidth,
      }));
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
    });
  }

  test("bottom tab-bar targets are at least 44px tall", async ({ page }) => {
    await page.goto("/tools/lender-compare");
    const tabBar = page.getByRole("navigation", { name: /primary/i });
    await expect(tabBar).toBeVisible();

    // Every tab (links + buttons) must clear the 44px minimum tap target.
    const tabs = tabBar.locator("a, button");
    const count = await tabs.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      const box = await tabs.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });
});
