import { convertUrl } from "./Card";

interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Calculates the Euclidean distance between two RGB colors in 3D space.
 */
function getColorDistance(c1: RGB, c2: RGB): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
      Math.pow(c1.g - c2.g, 2) +
      Math.pow(c1.b - c2.b, 2),
  );
}

/**
 * Converts RGB components to a Hex color string.
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) =>
    Math.min(255, Math.max(0, Math.round(c)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Adjusts a color's brightness.
 * @param factor - Positive for light, negative for dark.
 */
function adjustColor(r: number, g: number, b: number, factor: number): string {
  const adjust = (val: number) =>
    factor > 0 ? val + (255 - val) * factor : val + val * factor;
  return rgbToHex(adjust(r), adjust(g), adjust(b));
}

/**
 * Reduces the saturation of a color towards gray.
 * @param factor - 0 is original, 1 is completely gray.
 */
function desaturate(r: number, g: number, b: number, factor: number = 0.3): RGB {
  const gray = (r + g + b) / 3;
  return {
    r: r + (gray - r) * factor,
    g: g + (gray - g) * factor,
    b: b + (gray - b) * factor,
  };
}

/**
 * Analyzes an image and generates several color palettes: lights, darks, muted base, and most popular colors.
 *
 * @param imageUrl - URL or data URL of the image to analyze.
 * @param paletteSize - Number of colors to extract.
 * @returns A promise resolving to the generated palettes.
 */
export default async function generatePalette(
  imageUrl: string,
  paletteSize: number = 5,
): Promise<{
  lights: string[];
  darks: string[];
  base: string[];
  populars: string[];
}> {
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    imageUrl = (await convertUrl(imageUrl)) ?? imageUrl;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas 2D context not supported."));

      const maxSize = 400;
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

      let attempts = 0;
      let currentBinSize = 10;
      let currentDistanceThreshold = 75;
      let uniquePalette: Array<RGB> = [];
      let sortedColors: Array<RGB & { count: number }> = [];

      while (attempts < 3) {
        const colorCounts: Record<string, number> = {};
        uniquePalette = [];

        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i + 3] < 125) continue;
          const r = Math.round(pixels[i] / currentBinSize) * currentBinSize;
          const g = Math.round(pixels[i + 1] / currentBinSize) * currentBinSize;
          const b = Math.round(pixels[i + 2] / currentBinSize) * currentBinSize;
          const rgbStr = `${r},${g},${b}`;
          colorCounts[rgbStr] = (colorCounts[rgbStr] || 0) + 1;
        }

        sortedColors = Object.entries(colorCounts)
          .map(([rgbStr, count]) => {
            const [r, g, b] = rgbStr.split(",").map(Number);
            return { r, g, b, count };
          })
          .sort((a, b) => b.count - a.count);

        for (const color of sortedColors) {
          if (uniquePalette.length >= paletteSize) break;
          const isDifferentEnough = uniquePalette.every(
            (picked) =>
              getColorDistance(color, picked) > currentDistanceThreshold,
          );
          if (isDifferentEnough) uniquePalette.push(color);
        }

        if (uniquePalette.length >= paletteSize) break;

        attempts++;
        currentBinSize = Math.max(1, currentBinSize - 3);
        currentDistanceThreshold *= 0.7;
      }

      const popularityPalette = sortedColors.slice(0, paletteSize);
      const mutedDiverse = uniquePalette.map((c) => desaturate(c.r, c.g, c.b));

      resolve({
        lights: uniquePalette.map((c) => adjustColor(c.r, c.g, c.b, 0.5)),
        darks: uniquePalette.map((c) => adjustColor(c.r, c.g, c.b, -0.5)),
        base: mutedDiverse.map((c) => rgbToHex(c.r, c.g, c.b)),
        populars: popularityPalette.map((c) => rgbToHex(c.r, c.g, c.b)),
      });
    };

    img.onerror = () => reject(new Error(`Failed to load image`));
    img.src = imageUrl;
  });
}
