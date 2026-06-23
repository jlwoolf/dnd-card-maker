import { describe, it, expect } from "vitest";
import {
  TOOLBAR_HEIGHT,
  CONTENT_MIN_HEIGHT,
  AUTH_CARD_WIDTH,
  Z_INDEX,
  DESIGN_TOKENS,
} from "../constants";

describe("theme constants", () => {
  it("TOOLBAR_HEIGHT is 48", () => {
    expect(TOOLBAR_HEIGHT).toBe(48);
  });

  it("CONTENT_MIN_HEIGHT references toolbar height", () => {
    expect(CONTENT_MIN_HEIGHT).toBe(`calc(100vh - ${TOOLBAR_HEIGHT}px)`);
  });

  it("AUTH_CARD_WIDTH is 360", () => {
    expect(AUTH_CARD_WIDTH).toBe(360);
  });

  it("Z_INDEX layers have expected values", () => {
    expect(Z_INDEX.page).toBe(0);
    expect(Z_INDEX.cardOverlay).toBe(500);
    expect(Z_INDEX.toolbar).toBe(1100);
    expect(Z_INDEX.overlay).toBe(1200);
    expect(Z_INDEX.modal).toBe(1300);
    expect(Z_INDEX.exportOverlay).toBe(1400);
    expect(Z_INDEX.snackbar).toBe(1400);
    expect(Z_INDEX.tooltip).toBe(9999);
  });

  it("Z_INDEX contains expected layers", () => {
    expect(Z_INDEX).toHaveProperty("page");
    expect(Z_INDEX).toHaveProperty("cardOverlay");
    expect(Z_INDEX).toHaveProperty("toolbar");
    expect(Z_INDEX).toHaveProperty("overlay");
    expect(Z_INDEX).toHaveProperty("modal");
    expect(Z_INDEX).toHaveProperty("exportOverlay");
    expect(Z_INDEX).toHaveProperty("tooltip");
    expect(Z_INDEX).toHaveProperty("snackbar");
  });

  it("DESIGN_TOKENS bundles all tokens", () => {
    expect(DESIGN_TOKENS.toolbarHeight).toBe(TOOLBAR_HEIGHT);
    expect(DESIGN_TOKENS.contentMinHeight).toBe(CONTENT_MIN_HEIGHT);
    expect(DESIGN_TOKENS.authCardWidth).toBe(AUTH_CARD_WIDTH);
    expect(DESIGN_TOKENS.zIndex).toBe(Z_INDEX);
  });
});
