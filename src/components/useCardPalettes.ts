import { useState, useCallback } from "react";
import generatePalette from "./generatePalette";
import { useElementRegistry } from "./Card/Element";
import { map, pick } from "lodash";

type PaletteMap = Record<string, Record<string, string[]>>;

export function useCardPalettes(paletteSize: number = 5) {
  // Subscribe to the cards in your Zustand store
  const elements = useElementRegistry((state) => state.elements);

  // Local state to track loading status and the generated palettes
  const [palettes, setPalettes] = useState<PaletteMap>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAllPalettes = useCallback(
    async (forceRegenerate = false) => {
      if (elements.length === 0) return;

      setIsGenerating(true);

      // Copy the existing palettes so we can append to them
      const updatedPalettes: PaletteMap = { ...palettes };

      try {
        // Loop sequentially to avoid overloading the browser with canvas contexts
        for (const element of elements) {
          if (element.type !== "image") continue;

          // Skip if we already generated a palette for this ID (unless forced)
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
            // Optional: Assign a fallback palette or empty array on failure
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [elements, paletteSize],
  );

  return {
    palettes,
    isGenerating,
    generateAllPalettes,
  };
}
