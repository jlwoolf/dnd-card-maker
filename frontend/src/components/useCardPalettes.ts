import { useCallback } from "react";
import { create } from "zustand";
import { useElementRegistry, type Element } from "./Card/Element";
import generatePalette from "./generatePalette";

type PaletteMap = Record<string, Record<string, string[]>>;

interface PaletteState {
  /** Map of element IDs to their generated color palettes */
  palettes: PaletteMap;
  /** Whether a generation process is currently active */
  isGenerating: boolean;
  /**
   * Generates palettes for all image elements.
   * Uses a lock to prevent concurrent redundant runs.
   * 
   * @param elements - The list of card elements to analyze.
   * @param paletteSize - The number of colors to extract per image.
   * @param forceRegenerate - If true, ignores cache and re-analyzes all images.
   */
  generateAllPalettes: (
    elements: Element[],
    paletteSize: number,
    forceRegenerate?: boolean,
  ) => Promise<void>;
}

/**
 * usePaletteStore is a global store that caches generated palettes for image elements.
 * This prevents redundant analysis when multiple ColorPicker instances are mounted 
 * or when switching between elements.
 */
export const usePaletteStore = create<PaletteState>((set, get) => ({
  palettes: {},
  isGenerating: false,

  generateAllPalettes: async (elements, paletteSize, forceRegenerate = false) => {
    const { isGenerating, palettes } = get();

    if (isGenerating && !forceRegenerate) return;

    const images = elements.filter((e) => e.type === "image");
    if (images.length === 0) return;

    const needsGeneration =
      forceRegenerate || images.some((img) => !palettes[img.id]);
    if (!needsGeneration) return;

    set({ isGenerating: true });

    try {
      const updatedPalettes: PaletteMap = { ...get().palettes };
      let hasChanges = false;

      for (const element of images) {
        if (element.type !== "image") continue;

        if (!forceRegenerate && updatedPalettes[element.id]) continue;

        try {
          const palette = await generatePalette(element.value.src, paletteSize);
          updatedPalettes[element.id] = palette;
          hasChanges = true;
        } catch (error) {
          console.error(
            `Failed to generate palette for element ${element.id}:`,
            error,
          );
          updatedPalettes[element.id] = {};
          hasChanges = true;
        }
      }

      if (hasChanges) {
        const validIds = new Set(elements.map((e) => e.id));
        const filteredPalettes: PaletteMap = {};
        for (const id in updatedPalettes) {
          if (validIds.has(id)) {
            filteredPalettes[id] = updatedPalettes[id];
          }
        }
        set({ palettes: filteredPalettes });
      }
    } finally {
      set({ isGenerating: false });
    }
  },
}));

/**
 * useCardPalettes is a hook that interfaces with the global PaletteStore.
 * It provides the current palettes and an optimized generation trigger 
 * tied to the current card's elements.
 *
 * @param paletteSize - The number of colors to extract per image. Defaults to 5.
 */
export function useCardPalettes(paletteSize: number = 5) {
  const elements = useElementRegistry((state) => state.elements);
  const { palettes, isGenerating, generateAllPalettes: storeGenerate } =
    usePaletteStore();

  const generateAllPalettes = useCallback(
    (force?: boolean) => {
      return storeGenerate(elements, paletteSize, force);
    },
    [elements, paletteSize, storeGenerate],
  );

  return {
    palettes,
    isGenerating,
    generateAllPalettes,
  };
}
