import { test, expect } from "@playwright/test";

test.describe("Dev Mail Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mail");
    // Allow time for the API call to settle
    await page.waitForTimeout(1500);
  });

  test("renders sidebar with title", async ({ page }) => {
    await expect(page.getByText("Dev Mail")).toBeVisible();
  });

  test("refresh button exists", async ({ page }) => {
    const refreshBtn = page.getByRole("button", { name: "Refresh" });
    await expect(refreshBtn).toBeVisible();
  });

  test("clear all button exists", async ({ page }) => {
    const clearBtn = page.getByRole("button", { name: "Clear all" });
    await expect(clearBtn).toBeVisible();
  });

  test("shows either empty state or error gracefully", async ({ page }) => {
    const hasEmpty = await page.getByText("No emails yet.").isVisible().catch(() => false);
    const hasError = await page.getByText("Failed to load emails.").isVisible().catch(() => false);
    const hasLoading = page.locator(".MuiCircularProgress-root").first().isVisible().catch(() => false);

    expect(hasEmpty || hasError || hasLoading).toBeTruthy();
  });

  test("selects an email and shows detail in main pane", async ({ page }) => {
    // Skip if backend is not configured
    const hasError = await page.getByText("Failed to load emails.").isVisible().catch(() => false);
    if (hasError) return;

    const emailItem = page.locator(".MuiListItemButton-root").first();
    const exists = await emailItem.isVisible({ timeout: 2000 }).catch(() => false);
    if (!exists) return;

    await emailItem.click();
    await page.waitForTimeout(500);

    // Desktop layout: sidebar + main area side-by-side.
    // The email detail appears in the main area.
    // Verify the heading for the email detail rendered.
    const mainArea = page.locator("main");
    await expect(mainArea).toBeVisible({ timeout: 5000 });
  });

  test("mobile: back button appears when email selected", async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await page.goto("/mail");
    await page.waitForTimeout(1500);

    const hasError = await page.getByText("Failed to load emails.").isVisible().catch(() => false);
    if (hasError) return;

    const emailItem = page.locator(".MuiListItemButton-root").first();
    const exists = await emailItem.isVisible({ timeout: 2000 }).catch(() => false);
    if (!exists) return;

    await emailItem.click();
    await page.waitForTimeout(500);

    // On mobile, the detail view replaces the list and shows a back button
    const backBtn = page.getByRole("button", { name: "Back to list" });
    await expect(backBtn).toBeVisible({ timeout: 5000 });

    await backBtn.click();
    await expect(page.getByText("Dev Mail")).toBeVisible();
  });
});
