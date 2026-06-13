import { expect, test } from "@playwright/test";

test("the needs & criteria worksheet renders and hands off to the Tour Scorecard", async ({
  page,
}) => {
  await page.goto("/tools/needs");
  await expect(
    page.getByRole("heading", { name: /needs & criteria worksheet/i }),
  ).toBeVisible();

  // The three tier buckets are the core of the worksheet.
  await expect(
    page.getByRole("heading", { name: /^Must-haves$/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /^Deal-breakers$/i }),
  ).toBeVisible();

  // Navigational hand-off into the shared Tour Scorecard rubric.
  await expect(page.getByTestId("tour-scorecard-link")).toHaveAttribute(
    "href",
    "/tools/tour-scorecard",
  );
});
