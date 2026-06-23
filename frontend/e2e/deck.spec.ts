import { test, expect } from "@playwright/test";

test.describe("Deck Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("adds current card to the deck", async ({ page }) => {
    await page.getByTestId("add-to-deck-btn").click();

    await expect(page.getByTestId("global-snackbar-alert")).toBeVisible();
    await expect(page.getByTestId("global-snackbar-alert")).toContainText("Card added to deck!");

    const deckCard = page.locator('[data-testid^="deck-card-"]').first();
    await expect(deckCard).toBeVisible();
  });

  test("loads a card from the deck into the editor", async ({ page }) => {
    // Add to deck
    await page.getByTestId("add-to-deck-btn").click();

    // Clear editor (force click since deck panel may overlap bottom menu)
    await page.getByTestId("clear-card-btn").click({ force: true });
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid^="card-element-"]')).toHaveCount(0);

    // Load from deck
    const deckCard = page.locator('[data-testid^="deck-card-"]').first();
    await deckCard.hover();

    const actions = page.getByTestId("active-card-actions");
    await actions.getByTestId("deck-action-button-edit").click();

    // Editor should be repopulated
    await expect(page.locator('[data-testid^="card-element-"]').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId("global-snackbar-alert")).toContainText("Card loaded into editor");
  });

  test("duplicates a card into the editor", async ({ page }) => {
    await page.getByTestId("add-to-deck-btn").click();

    const deckCard = page.locator('[data-testid^="deck-card-"]').first();
    await deckCard.hover();

    const actions = page.getByTestId("active-card-actions");
    await actions.getByTestId("deck-action-button-copy").click();

    await expect(page.getByTestId("global-snackbar-alert")).toContainText("Card data copied to editor");
  });

  test("deletes a card from the deck", async ({ page }) => {
    await page.getByTestId("add-to-deck-btn").click();
    const deckCard = page.locator('[data-testid^="deck-card-"]').first();
    await expect(deckCard).toBeVisible();

    await deckCard.hover();
    const actions = page.getByTestId("active-card-actions");
    await actions.getByTestId("deck-action-button-delete").click();

    await expect(page.locator('[data-testid^="deck-card-"]').first()).not.toBeVisible();
    await expect(page.getByTestId("global-snackbar-alert")).toContainText("Card removed from deck");
  });

  test("navigates the deck stack with prev and next buttons", async ({ page }) => {
    // Add multiple cards
    await page.getByTestId("add-to-deck-btn").click();
    await page.getByTestId("add-to-deck-btn").click();

    const prevBtn = page.getByTestId("prev-card-btn");
    const nextBtn = page.getByTestId("next-card-btn");

    await expect(prevBtn).toBeVisible();
    await expect(nextBtn).toBeVisible();

    await nextBtn.click();
    await prevBtn.click();
  });

  test("opens and closes the full-screen grid view", async ({ page }) => {
    await page.getByTestId("add-to-deck-btn").click();
    await page.getByTestId("add-to-deck-btn").click();

    await page.getByTestId("view-grid-btn").click();

    const overlay = page.getByTestId("deck-view-overlay");
    await expect(overlay).toBeVisible();

    const sortableCards = overlay.locator('[data-testid^="sortable-card-"]');
    await expect(sortableCards).toHaveCount(2);

    await page.getByTestId("close-deck-view-btn").click();
    await expect(overlay).not.toBeVisible();
  });

  test("collapses and expands the deck panel", async ({ page }) => {
    const collapseBtn = page.getByTestId("collapse-deck-btn-desktop");

    // Deck container should be visible initially
    await expect(page.getByTestId("deck-container")).toBeVisible();

    await collapseBtn.click();
    await collapseBtn.click();
    // Deck should still exist after toggle
    await expect(page.getByTestId("deck-container")).toBeVisible();
  });

  test("downloads an individual card image from the deck", async ({ page }) => {
    await page.getByTestId("add-to-deck-btn").click();

    const deckCard = page.locator('[data-testid^="deck-card-"]').first();
    await deckCard.hover();

    const actions = page.getByTestId("active-card-actions");
    const downloadBtn = actions.getByTestId("deck-action-button-download");
    await expect(downloadBtn).toBeVisible();
  });
});
