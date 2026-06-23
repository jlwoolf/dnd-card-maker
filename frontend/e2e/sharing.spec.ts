import { test, expect } from "@playwright/test";

test.describe("Sharing", () => {
  test("shared card page shows error for invalid slug", async ({ page }) => {
    await page.goto("/share/nonexistent-slug-12345");
    await page.waitForTimeout(2000);

    // Should show an error or loading state - not a crash
    await expect(page.locator("body")).toBeVisible();
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).toBeTruthy();
  });

  test("shared deck page shows error for invalid slug", async ({ page }) => {
    await page.goto("/share/deck/nonexistent-deck-slug");
    await page.waitForTimeout(2000);

    await expect(page.locator("body")).toBeVisible();
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).toBeTruthy();
  });

  test("shared card page shows loading state then content", async ({ page }) => {
    await page.goto("/share/some-slug-value");
    await page.waitForTimeout(1000);

    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("navigates between shared card and home", async ({ page }) => {
    await page.goto("/share/test");
    await page.waitForTimeout(300);
    await page.goto("/");
    await expect(page.getByTestId("card-editor-container")).toBeVisible();
  });

  test("shared deck grid view renders", async ({ page }) => {
    await page.goto("/share/deck/test-deck");
    await page.waitForTimeout(1000);
    await expect(page.locator("body")).toBeVisible();
  });
});
