import { expect, test } from "@playwright/test";

test("the seller-disclosure review worksheet renders with its UPL disclaimer", async ({
  page,
}) => {
  await page.goto("/tools/disclosure-review");
  await expect(
    page.getByRole("heading", { name: /seller-disclosure review/i }),
  ).toBeVisible();

  // UPL guardrail: surfaces questions, doesn't interpret legal sufficiency.
  await expect(
    page.getByText(/does not tell you whether a disclosure is legally sufficient/i),
  ).toBeVisible();

  // State-aware: prompts the buyer to pick a state first.
  await expect(
    page.getByText(/pick your state to tailor the checklist/i),
  ).toBeVisible();
});
