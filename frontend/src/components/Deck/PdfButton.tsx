import { PictureAsPdf } from "@mui/icons-material";
import { CircularProgress, Box } from "@mui/material";
import useExportCards from "../useExportCards";
import ControlButton from "./ControlButton";
import { useExportModal } from "../ExportModal";
import Tooltip from "../Tooltip";

/**
 * PdfButton opens a modal to select cards for PDF export.
 */
export default function PdfButton() {
  const [, setIsModalOpen] = useExportModal();
  const pdfProgress = useExportCards((state) => state.pdfProgress);

  const isGenerating = pdfProgress > 0 && pdfProgress < 1;

  return (
    <Tooltip title="Export to PDF">
      <ControlButton
        disabled={isGenerating}
        onClick={() => setIsModalOpen(true)}
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
    </Tooltip>
  );
}
