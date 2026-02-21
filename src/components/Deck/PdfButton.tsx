import { PictureAsPdf } from "@mui/icons-material";
import { CircularProgress, Box, Backdrop, Typography } from "@mui/material";
import useExportCards from "../useExportCards";
import { useSnackbar } from "../useSnackbar";
import ControlButton from "./ControlButton";

/**
 * PdfButton triggers the PDF generation process for the entire deck.
 * It displays progress during generation.
 */
export default function PdfButton() {
  const showSnackbar = useSnackbar((state) => state.showSnackbar);
  const generatePdf = useExportCards((state) => state.generatePdf);
  const pdfProgress = useExportCards((state) => state.pdfProgress);

  const isGenerating = pdfProgress > 0 && pdfProgress < 1;

  const handlePdfDownload = async () => {
    if (isGenerating) return;

    try {
      const url = await generatePdf();
      if (!url) return;

      const link = document.createElement("a");
      link.href = url;
      link.download = "deck-of-cards.pdf";
      link.click();

      showSnackbar("Deck successfully exported to PDF", "success");
    } catch (e) {
      showSnackbar("Error exporting deck to PDF", "error");
      console.error("Failed to generate PDF", e);
    }
  };

  return (
    <>
      <ControlButton
        disabled={isGenerating}
        onClick={handlePdfDownload}
        icon={
          isGenerating ? (
            <Box sx={{ position: "relative", display: "inline-flex" }}>
              <CircularProgress
                variant="determinate"
                value={pdfProgress * 100}
                size={24}
                thickness={5}
                color="inherit"
              />
            </Box>
          ) : (
            <PictureAsPdf />
          )
        }
      />
      <Backdrop
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: "column",
          gap: 2,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
        }}
        open={isGenerating}
      >
        <CircularProgress
          variant="determinate"
          value={pdfProgress * 100}
          color="inherit"
          size={60}
        />
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h6">Generating PDF...</Typography>
          <Typography variant="body2">
            {Math.round(pdfProgress * 100)}% Complete
          </Typography>
        </Box>
      </Backdrop>
    </>
  );
}
