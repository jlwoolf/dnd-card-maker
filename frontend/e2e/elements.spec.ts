import { test, expect } from "@playwright/test";

test.describe("Element Manipulation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should manipulate a text element", async ({ page }) => {
    await page.getByTestId("clear-card-btn").click();
    await page.getByTestId("add-text-btn").click();

    // Select the first text element
    const textElement = page.locator('[data-testid^="card-element-"]').first();
    await textElement.click();

    // Add some text
    const editor = textElement.locator('[contenteditable="true"]');
    await editor.click();
    await editor.fill("Some Text");
    await editor.selectText();

    // Verify settings toolbar is populated
    const toolbar = page.getByTestId("element-settings-toolbar");
    await expect(toolbar).toBeVisible();

    // Toggle bold (FormatBold icon)
    const boldBtn = toolbar.getByTestId("text-toolbar-bold"); // Based on Menu component mapping for text
    await boldBtn.click();

    // Verify change in editor
    const boldText = textElement.locator('span[style*="font-weight: bold"]');
    await expect(boldText).toBeVisible();

    // Toggle Italic (FormatItalic icon)
    const italicBtn = toolbar.getByTestId("text-toolbar-italic"); // Based on Menu component mapping for text
    await italicBtn.click();

    // Verify change in editor
    const italicText = textElement.locator('span[style*="font-style: italic"]');
    await expect(italicText).toBeVisible();
  });

  test("should change vertical alignment of an element", async ({ page }) => {
    const firstElement = page.locator('[data-testid^="card-element-"]').first();
    await firstElement.hover();

    const menu = page.locator('[data-testid^="element-menu-"]').first();
    const vaBtn = menu.getByTestId("vertical-align-btn");
    await vaBtn.click();

    // Choose 'end' alignment
    const bottomAlignBtn = page.getByRole("button").filter({
      has: page.locator('svg[data-testid="VerticalAlignBottomIcon"]'),
    });
    await bottomAlignBtn.click();

    // Verify alignment in registry/style (check if container has flex-end alignment)
    // The parent box has the alignment
    const container = page
      .locator('div:has(> [data-testid^="card-element-"])')
      .first();
    await expect(container).toHaveCSS("align-content", "end");
  });

  test("should delete an element", async ({ page }) => {
    const initialCount = await page
      .locator('[data-testid^="card-element-"]')
      .count();

    const firstElement = page.locator('[data-testid^="card-element-"]').first();
    await firstElement.hover();

    const menu = page.locator('[data-testid^="element-menu-"]').first();
    await menu.getByTestId("delete-element-btn").click();

    await expect(page.locator('[data-testid^="card-element-"]')).toHaveCount(
      initialCount - 1,
    );
  });

  test("should move elements up and down", async ({ page }) => {
    const elements = page.locator('[data-testid^="card-element-"]');
    const firstId = await elements.nth(0).getAttribute("data-testid");
    const secondId = await elements.nth(1).getAttribute("data-testid");

    await elements.nth(0).hover();
    const menu = page.locator(
      `[data-testid="element-menu-${firstId?.split("card-element-")[1]}"]`,
    );

    // Move first element down
    await menu.getByTestId("move-down-btn").click();

    // Now index 0 should be the old second element
    const newFirstId = await elements.nth(0).getAttribute("data-testid");
    expect(newFirstId).toBe(secondId);
  });
});
