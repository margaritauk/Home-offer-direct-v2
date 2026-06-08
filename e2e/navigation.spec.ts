import { expect, test } from "@playwright/test";

/**
 * Navigation E2E for the simplified IA (epic #83). The primary bar is now five
 * anchors — Journey · Search Homes · Tools ▾ · My Deal ▾ · Start free — and the
 * secondary links (Glossary / Your State / Find Pros) moved to the footer + the
 * mobile "More" sheet. These specs assert the new structure with robust,
 * role/text-scoped selectors.
 */

test.describe("desktop primary nav", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("shows the five primary anchors and not the demoted links", async ({
    page,
  }) => {
    await page.goto("/");
    const header = page.getByRole("banner");

    await expect(header.getByRole("link", { name: /^Journey$/ })).toBeVisible();
    await expect(
      header.getByRole("link", { name: /^Search Homes$/ }),
    ).toBeVisible();
    await expect(header.getByRole("button", { name: /^Tools/ })).toBeVisible();
    await expect(
      header.getByRole("link", { name: /^Start free$/ }),
    ).toBeVisible();

    // Demoted to the footer — no longer top-level links in the header.
    await expect(header.getByRole("link", { name: /find pros/i })).toHaveCount(0);
    await expect(header.getByRole("link", { name: /your state/i })).toHaveCount(0);
    await expect(header.getByRole("link", { name: /glossary/i })).toHaveCount(0);
  });

  test("the Tools dropdown opens and routes to a tool (recovers /offer-status)", async ({
    page,
  }) => {
    await page.goto("/");
    const header = page.getByRole("banner");
    const toolsTrigger = header.getByRole("button", { name: /^Tools/ });

    await expect(toolsTrigger).toHaveAttribute("aria-expanded", "false");
    await toolsTrigger.click();
    await expect(toolsTrigger).toHaveAttribute("aria-expanded", "true");

    const menu = page.getByRole("menu", { name: /tools/i });
    await expect(menu.getByRole("menuitem", { name: /savings calculator/i })).toBeVisible();
    // /offer-status was an orphan route before — now reachable from the bar.
    await menu.getByRole("menuitem", { name: /offer status/i }).click();
    await expect(page).toHaveURL(/\/offer-status/);
  });

  test("the My Deal group is hidden for the no-keys / guest path", async ({
    page,
  }) => {
    await page.goto("/");
    const header = page.getByRole("banner");
    // With no Supabase keys (default test env) the gated group never renders.
    await expect(header.getByRole("button", { name: /my deal/i })).toHaveCount(0);
  });
});

test("Find Pros is reachable from the footer", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await footer.getByRole("link", { name: /find pros/i }).click();
  await expect(page).toHaveURL(/\/pros/);
  await expect(page.getByRole("heading", { name: /^Find a pro$/ })).toBeVisible();
});

test.describe("mobile bottom tab bar", () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone-ish

  test("each primary tab navigates to the right area", async ({ page }) => {
    await page.goto("/");
    const tabbar = page.getByRole("navigation", { name: /^Primary$/ });
    await expect(tabbar).toBeVisible();

    await tabbar.getByRole("link", { name: /journey/i }).click();
    await expect(page).toHaveURL(/\/journey/);

    await tabbar.getByRole("link", { name: /search/i }).click();
    await expect(page).toHaveURL(/\/listings/);
  });

  test("the Tools tab opens a sheet and routes", async ({ page }) => {
    await page.goto("/");
    const tabbar = page.getByRole("navigation", { name: /^Primary$/ });
    await tabbar.getByRole("button", { name: /tools/i }).click();

    const sheet = page.getByRole("dialog", { name: /tools/i });
    await expect(sheet).toBeVisible();
    await sheet.getByRole("link", { name: /tracker/i }).click();
    await expect(page).toHaveURL(/\/tracker/);
  });

  test("the More sheet reaches secondary items like Find Pros", async ({
    page,
  }) => {
    await page.goto("/");
    const tabbar = page.getByRole("navigation", { name: /^Primary$/ });
    await tabbar.getByRole("button", { name: /more/i }).click();

    const sheet = page.getByRole("dialog", { name: /more/i });
    await expect(sheet).toBeVisible();
    await sheet.getByRole("link", { name: /find pros/i }).click();
    await expect(page).toHaveURL(/\/pros/);
  });
});
