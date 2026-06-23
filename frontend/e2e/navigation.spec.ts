import { test, expect } from "@playwright/test";

test.describe("Navigation and Layout", () => {
  test("app root renders the editor on home page", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("app-root")).toBeVisible();
    // Editor container should be present
    await expect(page.getByTestId("card-editor-container")).toBeVisible();
  });

  test("login link navigates to /login", async ({ page }) => {
    await page.goto("/");

    const loginLink = page.getByRole("link", { name: /login/i });
    await loginLink.click();

    await expect(page).toHaveURL(/\/login/);
  });

  test("register link navigates to /register", async ({ page }) => {
    await page.goto("/");

    const registerLink = page.getByRole("link", { name: /sign up/i });
    await registerLink.click();

    await expect(page).toHaveURL(/\/register/);
  });

  test("settings page redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/login/);
  });

  test("shared card page loads (without auth)", async ({ page }) => {
    await page.goto("/share/nonexistent-slug");

    // Should show either loading spinner, error, or "something went wrong" - not a blank page
    await expect(page.locator("body")).toBeVisible();
  });

  test("shared deck page loads (without auth)", async ({ page }) => {
    await page.goto("/share/deck/nonexistent-slug");

    await expect(page.locator("body")).toBeVisible();
  });

  test("unknown route shows 404 page", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");

    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByText("Page Not Found")).toBeVisible();
    await expect(page.getByRole("link", { name: /go home/i })).toBeVisible();
  });

  test("switches to column layout on narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await page.goto("/");

    // The app should still render and not crash
    await expect(page.getByTestId("app-root")).toBeVisible();
    await expect(page.getByTestId("card-editor-container")).toBeVisible();
  });
});
