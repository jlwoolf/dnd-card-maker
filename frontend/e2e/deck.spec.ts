import { test, expect } from "@playwright/test";

test.describe("Deck Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should add current card to deck", async ({ page }) => {
    const addBtn = page.getByTestId("add-to-deck-btn");
    await addBtn.click();

    // Verify success snackbar
    const snackbar = page.getByTestId("global-snackbar-alert");
    await expect(snackbar).toBeVisible();
    await expect(snackbar).toContainText("Card added to deck!");

    // Verify card appears in deck stack (the default card has elements, so it's valid)
    // We can check for the existence of a deck card item
    const deckCard = page.locator('[data-testid^="deck-card-"]');
    await expect(deckCard).toHaveCount(1);
  });

  test("should load card from deck into editor", async ({ page }) => {
    // 1. Add card to deck
    await page.getByTestId("add-to-deck-btn").click();

    // 2. Clear editor to make sure we see the change
    await page.getByTestId("clear-card-btn").click();
    await expect(page.locator('[data-testid^="card-element-"]')).toHaveCount(0);

    // 3. Hover over the card in the deck stack to reveal actions
    const deckCard = page.locator('[data-testid^="deck-card-"]');
    await deckCard.hover();

    // 4. Click the edit button
    const actions = page.getByTestId("active-card-actions");
    await actions.getByTestId("deck-action-button-edit").click();

    // 5. Verify editor is populated again
    await expect(
      page.locator('[data-testid^="card-element-"]'),
    ).not.toHaveCount(0);

    const snackbar = page.getByTestId("global-snackbar-alert");
    await expect(snackbar).toContainText("Card loaded into editor");
  });

  test("should duplicate card data into editor", async ({ page }) => {
    await page.getByTestId("add-to-deck-btn").click();

    // Hover and click Copy
    const deckCard = page.locator('[data-testid^="deck-card-"]');
    await deckCard.hover();

    const actions = page.getByTestId("active-card-actions");
    await actions.getByTestId("deck-action-button-copy").click();

    const snackbar = page.getByTestId("global-snackbar-alert");
    await expect(snackbar).toContainText("Card data copied to editor");

    // In copy mode, the save button shouldn't appear because it's a new card (no cardId match)
    await expect(page.getByTestId("save-card-btn")).not.toBeVisible();
  });

  test("should remove card from deck", async ({ page }) => {
    await page.getByTestId("add-to-deck-btn").click();

    const deckCard = page.locator('[data-testid^="deck-card-"]');
    await deckCard.hover();

    const actions = page.getByTestId("active-card-actions");
    await actions.getByTestId("deck-action-button-delete").click();

    await expect(deckCard).toHaveCount(0);

    const snackbar = page.getByTestId("global-snackbar-alert");
    await expect(snackbar).toContainText("Card removed from deck");
  });
});
