import { test, expect } from "@playwright/test";

test.describe("Global Actions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should clear and reset card", async ({ page }) => {
    const elements = page.locator('[data-testid^="card-element-"]');
    await expect(elements).not.toHaveCount(0);

    // Clear card
    await page.getByTestId("clear-card-btn").click();
    await expect(elements).toHaveCount(0);

    const snackbar = page.getByTestId("global-snackbar-alert");
    await expect(snackbar).toContainText("Card cleared");

    // Reset to default
    await page.getByTestId("reset-card-btn").click();
    await expect(elements).not.toHaveCount(0);
    await expect(snackbar).toContainText("Reset to default card");
  });

  test("should navigate full deck view", async ({ page }) => {
    // Add two cards to deck
    await page.getByTestId("add-to-deck-btn").click();
    await page.getByTestId("add-text-btn").click();
    await page.getByTestId("add-to-deck-btn").click();

    // Open Grid View
    await page.getByTestId("view-grid-btn").click();

    const overlay = page.getByTestId("deck-view-overlay");
    await expect(overlay).toBeVisible();

    const gridCards = overlay.getByTestId(/^sortable-card-/);
    await expect(gridCards).toHaveCount(2);

    // Close Grid View
    await page.getByTestId("close-deck-view-btn").click();
    await expect(overlay).not.toBeVisible();
  });

  test("should handle PDF export selection", async ({ page }) => {
    // Add two cards
    await page.getByTestId("add-to-deck-btn").click();
    await page.getByTestId("add-to-deck-btn").click();

    // Open PDF modal
    await page.getByTestId("export-pdf-btn").click();

    const modal = page.getByTestId("export-modal-overlay");
    await expect(modal).toBeVisible();

    const exportItems = modal.getByTestId(/^export-card-item-/);
    await expect(exportItems).toHaveCount(2);

    // Default: all selected
    await expect(exportItems.first()).toHaveAttribute("aria-checked", "true");

    // Deselect all
    await page.getByTestId("deselect-all-export-btn").click();
    await expect(exportItems.first()).toHaveAttribute("aria-checked", "false");

    // Select individual
    await exportItems.first().click();
    await expect(exportItems.first()).toHaveAttribute("aria-checked", "true");

    // Close modal
    await page.getByTestId("cancel-export-btn").click();
    await expect(modal).not.toBeVisible();
  });
});
