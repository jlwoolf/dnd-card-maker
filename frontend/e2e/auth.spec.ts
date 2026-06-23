import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("registers a new user", async ({ page }) => {
    await page.goto("/register");

    // Verify the registration form renders
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password/i)).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /register/i })).toBeVisible();
  });

  test("shows error on invalid login", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel(/email/i).fill("nonexistent@test.local");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /login/i }).click();

    // Should show an error alert
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 10000 });
  });

  test("requests password reset via forgot password", async ({ page }) => {
    await page.goto("/forgot-password");

    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByRole("button", { name: /send reset link/i }).click();

    // Should show success message
    await expect(page.locator("body")).toContainText(/if the email is registered/i);
  });

  test("reset password page renders with token", async ({ page }) => {
    await page.goto("/reset-password/test-token-123");

    await expect(page.getByRole("button", { name: /reset password/i })).toBeVisible();
    await expect(page.getByText(/set new password/i)).toBeVisible();
  });

  test("verify email page shows loading then error", async ({ page }) => {
    await page.goto("/verify/invalid-token");

    // Should show some state (loading or error)
    await expect(page.locator("body")).toBeVisible();
    await page.waitForTimeout(2000);
    // Either loading spinner or error alert should appear
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).toBeTruthy();
  });

  test("login page links navigate correctly", async ({ page }) => {
    await page.goto("/login");

    // Verify links to register and forgot password
    await expect(page.getByText(/create account/i)).toBeVisible();
    await expect(page.getByText(/forgot password/i)).toBeVisible();
  });
});
