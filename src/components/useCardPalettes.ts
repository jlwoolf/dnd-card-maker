import { useCallback, useState } from "react";
import { map, pick } from "lodash";
import { useElementRegistry } from "./Card/Element";
import generatePalette from "./generatePalette";

type PaletteMap = Record<string, Record<string, string[]>>;

/**
 * useCardPalettes manages the generation of color palettes for all image elements on the current card.
 *
 * @param paletteSize - Number of colors to extract from each image.
 */
export function useCardPalettes(paletteSize: number = 5) {
  const elements = useElementRegistry((state) => state.elements);
  const [palettes, setPalettes] = useState<PaletteMap>({});
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Scans all image elements and generates palettes if they haven't been created yet.
   */
  const generateAllPalettes = useCallback(
    async (forceRegenerate = false) => {
      if (elements.length === 0) return;

      setIsGenerating(true);
      const updatedPalettes: PaletteMap = { ...palettes };

      try {
        for (const element of elements) {
          if (element.type !== "image") continue;

          if (!forceRegenerate && updatedPalettes[element.id]) {
            continue;
          }

          try {
            const palette = await generatePalette(
              element.value.src,
              paletteSize,
            );
            updatedPalettes[element.id] = palette;
          } catch (error) {
            console.error(
              `Failed to generate palette for element ${element.id}:`,
              error,
            );
            updatedPalettes[element.id] = {};
          }
        }

        const validIds = map(elements, "id");
        const filteredPalettes = pick(updatedPalettes, validIds);
        setPalettes(filteredPalettes);
      } finally {
        setIsGenerating(false);
      }
    },
    [elements, paletteSize, palettes],
  );

  return {
    palettes,
    isGenerating,
    generateAllPalettes,
  };
}
