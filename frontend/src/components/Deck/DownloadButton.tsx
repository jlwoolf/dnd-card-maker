import { Download } from "@mui/icons-material";
import Tooltip from "../Tooltip";
import useExportCards from "../useExportCards";
import { useSnackbar } from "../useSnackbar";
import ControlButton from "./ControlButton";

/**
 * Compresses a data URL image to a high-definition JPEG using an off-screen canvas.
 * This is used to reduce the size of exported JSON files while maintaining 
 * printable quality.
 *
 * @param url - Source image data URL or blob URL.
 * @param quality - JPEG compression quality (0 to 1). Defaults to 0.8.
 * @returns A promise resolving to a compressed JPEG data URL.
 */
const compressToHD = async (url: string, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX_AXIS = 1280;
      let width = img.width;
      let height = img.height;

      // Maintain aspect ratio while ensuring the image fits within MAX_AXIS
      if (width > MAX_AXIS || height > MAX_AXIS) {
        const ratio = Math.min(MAX_AXIS / width, MAX_AXIS / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Error creating canvas context"));

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    img.onerror = () =>
      reject(new Error("Failed to load image for compression"));
  });
};

/**
 * DownloadButton handles the full-deck JSON export.
 * It iterates through all saved cards, compresses transient blob URLs into 
 * persistent JPEG data URLs, and triggers a browser download of the combined 
 * JSON data.
 */
export default function DownloadButton() {
  const cards = useExportCards((state) => state.cards);
  const showSnackbar = useSnackbar((state) => state.showSnackbar);

  /**
   * Orchestrates the export process: image processing, JSON serialization, 
   * and file download triggering.
   */
  const handleDownload = async () => {
    try {
      showSnackbar("Compressing images for export...", "info");

      // Deep clone cards to avoid mutating the live application state
      const processedCards = JSON.parse(JSON.stringify(cards));

      for (const card of processedCards) {
        for (const element of card.elements) {
          if (
            element.type === "image" &&
            element.value.src.startsWith("blob:")
          ) {
            element.value.src = await compressToHD(element.value.src);
          }
        }
      }

      const jsonString = JSON.stringify(processedCards, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const href = URL.createObjectURL(blob);

      const timestamp = new Date()
        .toISOString()
        .replace(/T/, "_")
        .replace(/\..+/, "")
        .replace(/:/g, "-");

      const link = document.createElement("a");
      link.href = href;
      link.download = `cards_data_${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);

      showSnackbar("Export complete!", "success");
    } catch (error) {
      console.error("Export failed:", error);
      showSnackbar("Export failed", "error");
    }
  };

  return (
    <Tooltip title="Download JSON">
      <ControlButton icon={<Download />} onClick={handleDownload} />
    </Tooltip>
  );
}
