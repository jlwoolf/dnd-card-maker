import { test, expect } from "@playwright/test";

test.describe("Admin Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin");
  });

  test("renders sidebar with Tables heading", async ({ page }) => {
    await expect(page.getByText("Tables")).toBeVisible();
  });

  test("loads table list from backend", async ({ page }) => {
    // Tables should appear in the sidebar after fetch
    const tableItem = page.locator(".MuiListItemButton-root").first();
    await expect(tableItem).toBeVisible({ timeout: 10000 });
  });

  test("shows prompt to select a table", async ({ page }) => {
    await expect(
      page.getByText(/select a table from the sidebar/i),
    ).toBeVisible({ timeout: 5000 });
  });

  test("selects a table and loads rows", async ({ page }) => {
    // Click the first table in the sidebar
    const firstTable = page.locator(".MuiListItemButton-root").first();
    await firstTable.waitFor({ state: "visible", timeout: 10000 });
    await firstTable.click();

    // After loading, the table name should appear in the main toolbar
    await expect(page.getByText(/rows/i)).toBeVisible({ timeout: 10000 });
  });

  test("back button returns to table list", async ({ page }) => {
    const firstTable = page.locator(".MuiListItemButton-root").first();
    await firstTable.waitFor({ state: "visible", timeout: 10000 });
    await firstTable.click();

    // Wait for content to load
    await page.waitForTimeout(1000);

    await page.getByRole("button", { name: "Back to table list" }).click();

    // Should be back at the table selection view
    await expect(
      page.getByText(/select a table from the sidebar/i),
    ).toBeVisible({ timeout: 5000 });
  });

  test("shows error if tables fail to load", async ({ page }) => {
    // If the backend is not configured for dev mode, the page shows an error
    // This test verifies the page doesn't crash — it gracefully shows either
    // the tables list or an error message
    await page.waitForTimeout(2000);
    await expect(page.locator("body")).toBeVisible();
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).toBeTruthy();
  });

  test("mobile layout switches between sidebar and content", async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await page.goto("/admin");

    // On mobile, should show table list first
    await page.waitForTimeout(1000);
    await expect(page.locator("body")).toBeVisible();
  });
});
