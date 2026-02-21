import { Download } from "@mui/icons-material";
import useExportCards from "../useExportCards";
import { useSnackbar } from "../useSnackbar";
import ControlButton from "./ControlButton";

/**
 * Compresses a data URL image to a high-definition JPEG.
 *
 * @param url - Source image URL.
 * @param quality - JPEG quality (0 to 1).
 * @returns A promise resolving to a compressed data URL.
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

      if (width > MAX_AXIS || height > MAX_AXIS) {
        const ratio = Math.min(MAX_AXIS / width, MAX_AXIS / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Error creating canvas"));

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
 * DownloadButton exports the entire deck as a JSON file, including compressed preview images.
 */
export default function DownloadButton() {
  const cards = useExportCards((state) => state.cards);
  const showSnackbar = useSnackbar((state) => state.showSnackbar);

  const handleDownload = async () => {
    try {
      showSnackbar("Compressing images...", "info");

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
      console.error(error);
      showSnackbar("Export failed", "error");
    }
  };

  return <ControlButton icon={<Download />} onClick={handleDownload} />;
}
