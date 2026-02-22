import { toPng } from "html-to-image";

/**
 * Converts a URL (remote or blob) to a base64 data URL.
 *
 * @param url - The URL to convert.
 * @returns A promise that resolves to a data URL.
 */
export async function toDataUrl(url: string): Promise<string> {
  if (url.startsWith("data:")) return url;

  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Failed to convert image to DataURL", err);
    return url;
  }
}

/**
 * Processes an image source URL, applying a proxy if it is remote,
 * and converts it to a data URL.
 *
 * @param src - The source URL to process.
 * @returns A promise that resolves to a data URL or undefined.
 */
export async function convertUrl(src: string) {
  if (src.startsWith("data:")) return;

  let urlToFetch = src;

  if (src.startsWith("http") || src.startsWith("https")) {
    const proxyUrl = "https://cors-anywhere.com/";
    urlToFetch = proxyUrl + src;
  }

  return await toDataUrl(urlToFetch);
}

/**
 * Captures a DOM element as a PNG image, ensuring all internal images
 * are converted to data URLs first to prevent CORS issues.
 *
 * @param element - The DOM element to capture.
 * @param onError - Optional error callback.
 * @returns A promise that resolves to a PNG data URL.
 */
export async function getImageUrl(
  element: HTMLElement | null,
  onError?: (err: unknown) => void,
) {
  if (element === null) return;

  const images = element.querySelectorAll("img");
  const originalSrcs = new Map<HTMLImageElement, string>();

  try {
    const conversionPromises = Array.from(images).map(async (img) => {
      originalSrcs.set(img, img.src);
      const converted = await convertUrl(img.src);
      if (converted) {
        img.src = converted;
      }
    });

    await Promise.all(conversionPromises);

    return await toPng(element, {
      cacheBust: true,
      skipFonts: false,
    });
  } catch (err) {
    console.error("Oops, something went wrong!", err);
    onError?.(err);
    return;
  } finally {
    originalSrcs.forEach((src, img) => {
      img.src = src;
    });
  }
}
