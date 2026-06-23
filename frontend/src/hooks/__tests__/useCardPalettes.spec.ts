import { describe, it, expect, beforeEach } from "vitest";
import { usePaletteStore } from "../useCardPalettes";

describe("usePaletteStore", () => {
  beforeEach(() => {
    usePaletteStore.setState({
      palettes: {},
      isGenerating: false,
    });
  });

  it("starts with empty palettes and not generating", () => {
    const { palettes, isGenerating } = usePaletteStore.getState();
    expect(palettes).toEqual({});
    expect(isGenerating).toBe(false);
  });

  it("isGenerating is false after store reset", () => {
    usePaletteStore.setState({ isGenerating: true });
    expect(usePaletteStore.getState().isGenerating).toBe(true);

    usePaletteStore.setState({ isGenerating: false });
    expect(usePaletteStore.getState().isGenerating).toBe(false);
  });
});
