import { test, expect } from "@playwright/test";

test.describe("Account Settings", () => {
  test("settings page redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/login/);
  });
});
