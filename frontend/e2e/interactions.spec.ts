import { test, expect } from "@playwright/test";

test.describe("Card Editor Interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should open and close the color settings modal", async ({ page }) => {
    const openColorsBtn = page.getByTestId("open-colors-btn");
    await openColorsBtn.click();

    // Verify modal is visible
    const modal = page.getByTestId("color-settings-popover");
    await expect(modal).toBeVisible();

    // Close the modal
    const closeBtn = page.getByTestId("close-colors-btn");
    await closeBtn.click();

    // Verify modal is hidden
    await expect(modal).not.toBeVisible();
  });

  test("should add a new text element", async ({ page }) => {
    const addTextBtn = page.getByTestId("add-text-btn");

    // Count initial elements (default card has some)
    const initialElements = await page
      .locator('[data-testid^="card-element-"]')
      .count();

    await addTextBtn.click();

    // Verify a new element was added
    const finalElements = await page
      .locator('[data-testid^="card-element-"]')
      .count();
    expect(finalElements).toBe(initialElements + 1);
  });

  test("should add a new image element", async ({ page }) => {
    const addImageBtn = page.getByTestId("add-image-btn");

    const initialElements = await page
      .locator('[data-testid^="card-element-"]')
      .count();

    await addImageBtn.click();

    const finalElements = await page
      .locator('[data-testid^="card-element-"]')
      .count();
    expect(finalElements).toBe(initialElements + 1);
  });

  test("should clear and restore the card editor", async ({ page }) => {
    await page.getByTestId("clear-card-btn").click();
    await expect(page.locator('[data-testid^="card-element-"]')).toHaveCount(0);

    await page.getByTestId("reset-card-btn").click();
    const elements = page.locator('[data-testid^="card-element-"]');
    await expect(elements).toHaveCount(4);
  });
});
