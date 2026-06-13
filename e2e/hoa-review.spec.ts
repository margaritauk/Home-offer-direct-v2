import { expect, test } from "@playwright/test";

test("the HOA/condo review worksheet renders with its UPL disclaimer", async ({
  page,
}) => {
  await page.goto("/tools/hoa-review");
  await expect(
    page.getByRole("heading", { name: /HOA \/ condo document review/i }),
  ).toBeVisible();

  // UPL guardrail: surfaces red flags, routes the docs to an attorney.
  await expect(
    page.getByText(/have your attorney review the governing documents/i).first(),
  ).toBeVisible();

  // Default empty-but-explained state for a non-association home.
  await expect(
    page.getByText(/no association\? no packet to review/i),
  ).toBeVisible();
});
