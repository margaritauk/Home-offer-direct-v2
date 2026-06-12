import { expect, test } from "@playwright/test";

test("the should-I-go-solo decision aid renders with balanced, sourced framing", async ({
  page,
}) => {
  await page.goto("/tools/go-solo");
  await expect(
    page.getByRole("heading", { name: /should i go solo\?/i }),
  ).toBeVisible();

  // Balanced default read (not a verdict).
  await expect(
    page.getByText(/going solo is reasonable for many straightforward purchases/i),
  ).toBeVisible();

  // Post-NAR facts carry a source + date (accuracy compliance).
  await expect(page.getByText(/August 17, 2024/)).toBeVisible();
  await expect(page.getByTestId("go-solo-source")).toBeVisible();
});
