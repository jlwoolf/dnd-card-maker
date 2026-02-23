import { PictureAsPdf } from "@mui/icons-material";
import { Box, CircularProgress } from "@mui/material";
import { useExportModal } from "../ExportModal";
import Tooltip from "../Tooltip";
import useExportCards from "../useExportCards";
import ControlButton, { type ControlButtonProps } from "./ControlButton";

/**
 * PdfButton triggers the PDF export workflow.
 * It opens the selection modal where users can choose which cards to include
 * in the final document. It also displays a circular progress indicator during
 * the generation phase.
 */
export default function PdfButton(props: Partial<ControlButtonProps>) {
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
        {...props}
      />
    </Tooltip>
  );
}
