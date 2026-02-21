import { convertUrl } from "./Card";

/**
 * Calculates the Euclidean distance between two RGB colors in 3D space.
 */
function getColorDistance(
  c1: { r: number; g: number; b: number },
  c2: { r: number; g: number; b: number },
): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
      Math.pow(c1.g - c2.g, 2) +
      Math.pow(c1.b - c2.b, 2),
  );
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) =>
    Math.min(255, Math.max(0, Math.round(c)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function adjustColor(r: number, g: number, b: number, factor: number): string {
  const adjust = (val: number) =>
    factor > 0 ? val + (255 - val) * factor : val + val * factor;
  return rgbToHex(adjust(r), adjust(g), adjust(b));
}

/**
 * Reduces the saturation of a color.
 * @param factor - 0 is original, 1 is completely gray.
 */
function desaturate(
  r: number,
  g: number,
  b: number,
  factor: number = 0.3,
): { r: number; g: number; b: number } {
  // Calculate the "Luminance" or a simple average to find the gray target
  const gray = (r + g + b) / 3;

  return {
    r: r + (gray - r) * factor,
    g: g + (gray - g) * factor,
    b: b + (gray - b) * factor,
  };
}

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
      const colorCounts: Record<string, number> = {};
      const binSize = 10;

      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] < 125) continue;
        const r = Math.round(pixels[i] / binSize) * binSize;
        const g = Math.round(pixels[i + 1] / binSize) * binSize;
        const b = Math.round(pixels[i + 2] / binSize) * binSize;
        const rgbStr = `${r},${g},${b}`;
        colorCounts[rgbStr] = (colorCounts[rgbStr] || 0) + 1;
      }

      // 1. Sort ALL colors by frequency (Popularity)
      const sortedColors = Object.entries(colorCounts)
        .map(([rgbStr, count]) => {
          const [r, g, b] = rgbStr.split(",").map(Number);
          return { r, g, b, count };
        })
        .sort((a, b) => b.count - a.count);

      // 2. Extract Diverse Palette
      const uniquePalette: Array<{ r: number; g: number; b: number }> = [];
      const DISTANCE_THRESHOLD = 75;

      for (const color of sortedColors) {
        if (uniquePalette.length >= paletteSize) break;
        const isDifferentEnough = uniquePalette.every(
          (picked) => getColorDistance(color, picked) > DISTANCE_THRESHOLD,
        );
        if (isDifferentEnough) uniquePalette.push(color);
      }

      // 3. Extract Raw Popularity Palette (First N colors found)
      const popularityPalette = sortedColors.slice(0, paletteSize);

      const mutedDiverse = uniquePalette.map((c) => desaturate(c.r, c.g, c.b));

      // 2. Generate the results using the muted versions
      const baseDiverse = mutedDiverse.map((c) => rgbToHex(c.r, c.g, c.b));
      const darks = uniquePalette.map((c) => adjustColor(c.r, c.g, c.b, -0.5));
      const lights = uniquePalette.map((c) => adjustColor(c.r, c.g, c.b, 0.5));

      // 5. Generate hexes for the POPULARITY palette
      const populars = popularityPalette.map((c) => rgbToHex(c.r, c.g, c.b));

      // Result: Array of length (paletteSize * 4)
      resolve([...lights, ...baseDiverse, ...darks, ...populars]);
    };

    img.onerror = () => reject(new Error(`Failed to load image`));
    img.src = imageUrl;
  });
}
