import { test, expect } from '@playwright/test';

test.describe('Card Editor Smoke Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the card editor', async ({ page }) => {
    // Verify the main container is present
    const editor = page.getByTestId('card-editor-container');
    await expect(editor).toBeVisible();

    // Verify the editor and preview panes are visible
    await expect(page.getByTestId('edit-card-pane')).toBeVisible();
    await expect(page.getByTestId('preview-card-pane')).toBeVisible();
  });

  test('should have basic editing controls', async ({ page }) => {
    const bottomMenu = page.getByTestId('bottom-card-menu');
    await expect(bottomMenu).toBeVisible();

    // Verify presence of essential action buttons
    await expect(page.getByTestId('add-text-btn')).toBeVisible();
    await expect(page.getByTestId('add-image-btn')).toBeVisible();
    await expect(page.getByTestId('open-colors-btn')).toBeVisible();
  });

  test('should have a deck container', async ({ page }) => {
    const deck = page.getByTestId('deck-container');
    await expect(deck).toBeVisible();
  });
});
