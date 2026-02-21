import { convertUrl } from "./Card";

const LIGHT_THRESHOLD = 185;
const DARK_THRESHOLD = 100;

/**
 * Helper function to convert RGB values to a Hex string.
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) =>
    Math.min(255, Math.max(0, c)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Extracts a color palette from an image URL, split into dark and light colors.
 * @param imageUrl - The URL of the image to process.
 * @param paletteSize - Number of colors for EACH category (returns paletteSize * 2 total).
 * @returns A promise resolving to { dark: string[], light: string[] }.
 */
export default async function generatePalette(
  imageUrl: string,
  paletteSize: number = 5,
): Promise<string[]> {
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    imageUrl = (await convertUrl(imageUrl)) ?? imageUrl;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas 2D context not supported."));

      const maxSize = 300;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const { data: pixels } = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      );

      const colorCounts: Record<string, number> = {};
      const binSize = 12;

      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] < 125) continue; // Skip transparent

        const r = Math.round(pixels[i] / binSize) * binSize;
        const g = Math.round(pixels[i + 1] / binSize) * binSize;
        const b = Math.round(pixels[i + 2] / binSize) * binSize;

        const rgbStr = `${r},${g},${b}`;
        colorCounts[rgbStr] = (colorCounts[rgbStr] || 0) + 1;
      }

      // Process and categorize colors
      const processedColors = Object.entries(colorCounts).map(
        ([rgbStr, count]) => {
          const [r, g, b] = rgbStr.split(",").map(Number);
          // Standard formula for relative luminance
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          return { hex: rgbToHex(r, g, b), count, luminance };
        },
      );

      const neutralColors = processedColors
        .filter(
          (c) => c.luminance > DARK_THRESHOLD && c.luminance < LIGHT_THRESHOLD,
        )
        .sort((a, b) => b.count - a.count)
        .slice(0, paletteSize)
        .map((c) => c.hex);

      // Filter and Sort
      const darkColors = processedColors
        .filter((c) => c.luminance < DARK_THRESHOLD)
        .sort((a, b) => b.count - a.count)
        .slice(0, paletteSize)
        .map((c) => c.hex);

      const lightColors = processedColors
        .filter((c) => c.luminance >= LIGHT_THRESHOLD)
        .sort((a, b) => b.count - a.count)
        .slice(0, paletteSize)
        .map((c) => c.hex);

      resolve([...neutralColors, ...darkColors, ...lightColors]);
    };

    img.onerror = () => reject(new Error(`Failed to load image: ${imageUrl}`));
    img.src = imageUrl;
  });
}
