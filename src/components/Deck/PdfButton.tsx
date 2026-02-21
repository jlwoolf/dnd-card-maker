import { PictureAsPdf } from "@mui/icons-material";
import useExportCards from "../useExportCards";
import ControlButton from "./ControlButton";
import { useSnackbar } from "../useSnackbar";

export default function PdfButton() {
  const showSnackbar = useSnackbar((state) => state.showSnackbar);
  const generatePdf = useExportCards((state) => state.generatePdf);

  const handlePdfDownload = async () => {
    try {
      const url = await generatePdf();
      // Create a temporary link to trigger download
      const link = document.createElement("a");
      if (!url) {
        return;
      }
      link.href = url;
      link.download = "deck-of-cards.pdf";
      link.click();
      showSnackbar("Deck successfully exported to PDF", "success");
    } catch (e) {
      showSnackbar("Error exporting deck to PDF", "error");
      console.error("Failed to generate PDF", e);
    }
  };

  return <ControlButton icon={<PictureAsPdf />} onClick={handlePdfDownload} />;
}
