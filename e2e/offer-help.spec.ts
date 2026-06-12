import { expect, test } from "@playwright/test";

test("offer-help surfaces the A3 competitive-offer tactics with the UPL disclaimer", async ({
  page,
}) => {
  await page.goto("/tools/offer-help");

  await expect(
    page.getByRole("heading", { name: /competitive-offer tactics/i }),
  ).toBeVisible();
  // The escalation modeler + appraisal-gap helper + bidding-war playbook.
  await expect(
    page.getByRole("heading", { name: /escalation-clause modeler/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /appraisal-gap coverage \(at offer time\)/i }),
  ).toBeVisible();
  // The loud UPL disclaimer is present.
  await expect(page.getByText(/Education only — not legal/i).first()).toBeVisible();
});

test("offer-help surfaces the I2 negotiation playbook", async ({ page }) => {
  await page.goto("/tools/offer-help");
  await expect(
    page.getByRole("heading", { name: /negotiation playbook/i }),
  ).toBeVisible();
  await expect(page.getByText(/Walk-away discipline/i).first()).toBeVisible();
});
