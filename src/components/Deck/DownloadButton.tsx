import { Download } from "@mui/icons-material";
import ControlButton from "./ControlButton";
import useExportCards from "../useExportCards";
import { useSnackbar } from "../useSnackbar";

const compressToHD = async (url: string, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX_AXIS = 1280; // The "720p" standard long-edge
      let width = img.width;
      let height = img.height;

      // Calculate the scale ratio
      if (width > MAX_AXIS || height > MAX_AXIS) {
        const ratio = Math.min(MAX_AXIS / width, MAX_AXIS / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return reject("Error creating canvas");
      }
      // Use high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(img, 0, 0, width, height);

      // Export as JPEG at 80% quality for a great balance of size/clarity
      const base64 = canvas.toDataURL("image/jpeg", quality);
      resolve(base64);
    };

    img.onerror = () =>
      reject(new Error("Failed to load image for compression"));
  });
};

export default function DownloadButton() {
  const cards = useExportCards((state) => state.cards);
  const showSnackbar = useSnackbar((state) => state.showSnackbar);

  const handleDownload = async () => {
    try {
      showSnackbar("Compressing images...", "info");

      const processedCards = JSON.parse(JSON.stringify(cards));

      for (const card of processedCards) {
        for (const element of card.elements) {
          // Check if it's an image and a blob URL
          if (
            element.type === "image" &&
            element.value.src.startsWith("blob:")
          ) {
            // Compress to 70% quality and max 1000px width
            element.value.src = await compressToHD(element.value.src);
          }
        }
      }

      const jsonString = JSON.stringify(processedCards, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const href = URL.createObjectURL(blob);

      const now = new Date();
      const timestamp = now
        .toISOString()
        .replace(/T/, "_") // Replace T with underscore
        .replace(/\..+/, "") // Remove milliseconds
        .replace(/:/g, "-"); // Replace colons with hyphens for Windows compatibility

      const fileName = `cards_data_${timestamp}.json`;

      const link = document.createElement("a");
      link.href = href;
      link.download = fileName;
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
