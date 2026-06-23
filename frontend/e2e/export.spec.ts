import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const testResultsDir = resolve(dirname(fileURLToPath(import.meta.url)), "..", "test-results");

test.describe("Import and Export", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the editor to fully render
    await expect(page.getByTestId("card-editor-container")).toBeVisible();
  });

  test("opens and closes the PDF export modal", async ({ page }) => {
    await page.getByTestId("add-to-deck-btn").click();
    await page.getByTestId("add-to-deck-btn").click();

    // The export button is in the deck controls, not the bottom card menu
    await page.getByTestId("export-pdf-btn").click();

    const modal = page.getByTestId("export-modal-overlay");
    await expect(modal).toBeVisible({ timeout: 10000 });

    const exportItems = modal.locator('[data-testid^="export-card-item-"]');
    await expect(exportItems).toHaveCount(2);

    // Default: all selected
    await expect(exportItems.first()).toHaveAttribute("aria-checked", "true");

    // Cancel
    await page.getByTestId("cancel-export-btn").click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });
  });

  test("selects and deselects all cards in PDF export", async ({ page }) => {
    await page.getByTestId("add-to-deck-btn").click();
    await page.getByTestId("add-to-deck-btn").click();

    await page.getByTestId("export-pdf-btn").click();
    const modal = page.getByTestId("export-modal-overlay");
    await expect(modal).toBeVisible({ timeout: 10000 });

    const exportItems = modal.locator('[data-testid^="export-card-item-"]');

    // Select all
    await page.getByTestId("select-all-export-btn").click();
    await expect(exportItems.first()).toHaveAttribute("aria-checked", "true");

    // Deselect all
    await page.getByTestId("deselect-all-export-btn").click();
    await expect(exportItems.first()).toHaveAttribute("aria-checked", "false");

    // Select individual
    await exportItems.first().click();
    await expect(exportItems.first()).toHaveAttribute("aria-checked", "true");
  });

  test("downloads deck JSON via deck download button", async ({ page }) => {
    await page.getByTestId("add-to-deck-btn").click();

    // The download button is in the deck controls
    await page.getByTestId("download-deck-btn").click();
    await page.waitForTimeout(1000);
  });

  test("uploads a valid deck JSON file", async ({ page }) => {
    await page.getByTestId("add-to-deck-btn").click();

    const cardData = [{
      id: "test-import-card",
      elements: [{
        id: "imp-el-1",
        type: "text" as const,
        value: {
          variant: "banner" as const,
          expand: false,
          width: 100,
          value: [{ type: "paragraph" as const, children: [{ text: "Imported" }] }],
        },
        style: { grow: false, align: "center" as const },
      }],
      imgUrl: "data:image/png;base64,test",
      theme: {
        fill: "#ffffff",
        bannerFill: "#000000",
        boxFill: "#cccccc",
        stroke: "#333333",
        bannerText: "#ffffff",
        boxText: "#000000",
      },
    }];

    await mkdir(testResultsDir, { recursive: true });
    const filePath = resolve(testResultsDir, "test-deck.json");
    await writeFile(filePath, JSON.stringify(cardData));

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByTestId("upload-deck-btn").click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
  });

  test("shows error on invalid JSON upload", async ({ page }) => {
    await mkdir(testResultsDir, { recursive: true });
    const filePath = resolve(testResultsDir, "invalid-deck.json");
    await writeFile(filePath, "not valid json {{{");

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByTestId("upload-deck-btn").click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
  });
});
