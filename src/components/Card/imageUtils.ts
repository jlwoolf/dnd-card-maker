import { toPng } from "html-to-image";

export async function toDataUrl(url: string): Promise<string> {
  // Check if it's already a data URL to avoid re-fetching
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
    return url; // Fallback to original URL
  }
}

export async function convertUrl(src: string) {
  // Skip processing if it's already a data URL
  if (src.startsWith("data:")) return;

  let urlToFetch = src;

  // ONLY apply the proxy if it is a remote web URL.
  // Do NOT apply proxy to "blob:" urls.
  if (src.startsWith("http") || src.startsWith("https")) {
    const proxyUrl = "https://cors-anywhere.com/";
    urlToFetch = proxyUrl + src;
  }

  // fetch() works on blob: URLs natively, converting them to blobs,
  // which FileReader then converts to base64.
  const dataUrl = await toDataUrl(urlToFetch);
  return dataUrl;
}

export async function getImageUrl(
  element: HTMLElement | null,
  onError?: (err: unknown) => void,
) {
  if (element === null) return;

  // Find all images within the ref
  const images = element.querySelectorAll("img");
  const originalSrcs = new Map<HTMLImageElement, string>();

  try {
    // Convert ALL images (Remote AND Blobs) to DataURLs
    const conversionPromises = Array.from(images).map(async (img) => {
      // Store original src for cleanup
      originalSrcs.set(img, img.src);
      img.src = (await convertUrl(img.src)) ?? img.src;
    });

    await Promise.all(conversionPromises);

    // Perform the capture
    const dataUrl = await toPng(element, {
      cacheBust: true,
      skipFonts: false,
    });

    return dataUrl;
  } catch (err) {
    console.error("Oops, something went wrong!", err);
    onError?.(err);
    return;
  } finally {
    // Cleanup: Revert images back to original URLs (blobs or http links)
    originalSrcs.forEach((src, img) => {
      img.src = src;
    });
  }
}
