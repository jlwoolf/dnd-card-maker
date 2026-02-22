import { Download } from "@mui/icons-material";
import { ImageProcessor } from "@src/services/ImageProcessor";
import Tooltip from "../Tooltip";
import useExportCards from "../useExportCards";
import { useSnackbar } from "../useSnackbar";
import ControlButton from "./ControlButton";

/**
 * DownloadButton handles the full-deck JSON export.
 * It iterates through all saved cards, compresses transient blob URLs into 
 * persistent JPEG data URLs using the ImageProcessor service, and triggers 
 * a browser download of the combined JSON data.
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
            element.value.src = await ImageProcessor.compressToJpeg(element.value.src);
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
      console.error("ImageProcessor: Export failed", error);
      showSnackbar("Export failed", "error");
    }
  };

  return (
    <Tooltip title="Download JSON">
      <ControlButton icon={<Download />} onClick={handleDownload} />
    </Tooltip>
  );
}
