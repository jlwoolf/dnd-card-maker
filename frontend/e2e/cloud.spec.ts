import { test, expect } from "@playwright/test";

test.describe("Cloud Sync", () => {
  test("save to cloud button hidden when not authenticated", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("card-editor-container")).toBeVisible();
    // Save to cloud button should not be visible for unauthenticated users
    await expect(page.getByTestId("save-cloud-btn")).not.toBeVisible();
  });

  test("my cards and decks links hidden when not authenticated", async ({ page }) => {
    await page.goto("/");

    // My Cards and Decks buttons should not appear in the navbar
    const myCardsBtn = page.getByRole("button", { name: /my cards/i });
    await expect(myCardsBtn).not.toBeVisible();
  });

  test("deck panel renders controls", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("card-editor-container")).toBeVisible();

    // Deck panel should have the add-to-deck button (always visible)
    await expect(page.getByTestId("add-to-deck-btn")).toBeVisible();
  });
});
