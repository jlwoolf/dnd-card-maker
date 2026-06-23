import { toPng } from "html-to-image";

/**
 * ImageProcessor service provides a centralized suite of utilities for
 * handling image transformations, remote source proxying, and DOM-to-image capture.
 *
 * Cross-origin images are fetched through the built-in backend proxy
 * endpoint (GET /api/proxy/image?url=) to avoid canvas tainting.
 */
export class ImageProcessor {
  /**
   * Backend CORS proxy URL prefix. Remote image URLs are fetched through
   * this proxy to avoid canvas tainting during capture.
   */
  private static CORS_PROXY = `${import.meta.env.BASE_URL}api/proxy/image?url=`;

  /**
   * Converts any image URL (remote, blob, or local) into a base64 Data URL.
   * 
   * @param url - The source URL to convert.
   * @returns A promise resolving to the data URL string.
   */
  static async toDataUrl(url: string): Promise<string> {
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
      console.error("ImageProcessor: Failed to convert to DataURL", err);
      return url;
    }
  }

  /**
   * Pre-processes a URL for safe cross-origin usage. If the URL is remote and
   * a CORS proxy is configured, it applies the proxy before converting to a
   * data URL.
   *
   * @param src - The image source URL.
   * @returns A promise resolving to a safe data URL or undefined if conversion fails.
   */
  static async getSafeUrl(src: string): Promise<string | undefined> {
    if (src.startsWith("data:")) return src;

    let urlToFetch = src;

    if (this.CORS_PROXY && (src.startsWith("http") || src.startsWith("https"))) {
      urlToFetch = this.CORS_PROXY + encodeURIComponent(src);
    }

    return await this.toDataUrl(urlToFetch);
  }

  /**
   * Captures a DOM element as a high-quality PNG image.
   * It automatically handles internal image conversion to prevent CORS tainting 
   * of the canvas during the capture process.
   * 
   * @param element - The HTML element to capture.
   * @param options - Configuration for the capture process.
   * @returns A promise resolving to a PNG data URL.
   */
  static async captureElement(
    element: HTMLElement | null,
    options: { onError?: (err: unknown) => void } = {}
  ): Promise<string | undefined> {
    if (!element) return;

    const images = element.querySelectorAll("img");
    const originalSrcs = new Map<HTMLImageElement, string>();

    try {
      // 1. Prepare all images by converting them to safe Data URLs
      const conversionPromises = Array.from(images).map(async (img) => {
        originalSrcs.set(img, img.src);
        const converted = await this.getSafeUrl(img.src);
        if (converted) {
          img.src = converted;
        }
      });

      await Promise.all(conversionPromises);

      // 2. Generate the PNG from the prepared element
      return await toPng(element, {
        cacheBust: true,
        skipFonts: false,
      });
    } catch (err) {
      console.error("ImageProcessor: Capture failed", err);
      options.onError?.(err);
      return;
    } finally {
      // 3. Restore original sources to avoid side-effects in the live UI
      originalSrcs.forEach((src, img) => {
        img.src = src;
      });
    }
  }

  /**
   * Scales a data URL image down by the given factor and returns a reduced PNG.
   *
   * @param url - The source data URL.
   * @param scale - Scale factor (0.0–1.0). Defaults to 0.25.
   * @returns A promise resolving to the scaled PNG data URL.
   */
  static async generateThumbnail(url: string, scale = 0.25): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const width = Math.max(1, Math.floor(img.width * scale));
        const height = Math.max(1, Math.floor(img.height * scale));
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("ImageProcessor: Failed to create canvas context"));

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL("image/png"));
      };

      img.onerror = () => reject(new Error("ImageProcessor: Failed to load image for thumbnail"));
    });
  }

  /**
   * Compresses a large image Data URL into a more efficient JPEG format.
   * 
   * @param url - The source Data URL.
   * @param quality - Compression quality from 0 to 1. Defaults to 0.8.
   * @param maxAxis - Maximum width or height in pixels. Defaults to 1280.
   * @returns A promise resolving to the compressed JPEG Data URL.
   */
  static async compressToJpeg(
    url: string, 
    quality = 0.8, 
    maxAxis = 1280
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxAxis || height > maxAxis) {
          const ratio = Math.min(maxAxis / width, maxAxis / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("ImageProcessor: Failed to create canvas context"));

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };

      img.onerror = () => reject(new Error("ImageProcessor: Failed to load image for compression"));
    });
  }
}
