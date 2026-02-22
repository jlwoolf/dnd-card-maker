import { useState } from "react";
import { Check, Close, PictureAsPdf } from "@mui/icons-material";
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import RoundedButtonGroup from "../RoundedButtonGroup";
import { useSnackbar } from "../useSnackbar";
import useExportCards from "../useExportCards";
import { useExportModal } from "./ExportContext";

/**
 * ExportModal provides a specialized selection interface for PDF export.
 * It allows users to pick exactly which cards they want to include in the 
 * final document, with "Select All" and "Deselect All" helpers. 
 * It features a persistent progress overlay during document generation.
 */
export default function ExportModal() {
  const [isModalOpen, setIsModalOpen] = useExportModal();
  const cards = useExportCards((state) => state.cards);
  const generatePdf = useExportCards((state) => state.generatePdf);
  const pdfProgress = useExportCards((state) => state.pdfProgress);
  const showSnackbar = useSnackbar((state) => state.showSnackbar);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [prevIsModalOpen, setPrevIsModalOpen] = useState(isModalOpen);

  /**
   * Synchronize selection state when the modal opens or cards list changes.
   */
  if (isModalOpen && !prevIsModalOpen) {
    setPrevIsModalOpen(true);
    setSelectedIds(cards.map((c) => c.id));
  } else if (!isModalOpen && prevIsModalOpen) {
    setPrevIsModalOpen(false);
  }

  const isGenerating = pdfProgress > 0 && pdfProgress < 1;

  /**
   * Toggles the selection state of a single card.
   * 
   * @param id - The unique card ID.
   */
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const selectAll = () => setSelectedIds(cards.map((c) => c.id));
  const deselectAll = () => setSelectedIds([]);

  /**
   * Triggers the PDF generation process for the selected subset of cards.
   */
  const handleExport = async () => {
    if (selectedIds.length === 0) {
      showSnackbar("Please select at least one card to export", "warning");
      return;
    }

    try {
      const url = await generatePdf(selectedIds);
      if (!url) return;

      const link = document.createElement("a");
      link.href = url;
      link.download = "deck-of-cards.pdf";
      link.click();

      showSnackbar("Deck successfully exported to PDF", "success");
      setIsModalOpen(false);
    } catch (e) {
      showSnackbar("Error exporting deck to PDF", "error");
      console.error("PDF Export Error:", e);
    }
  };

  if (!isModalOpen) {
    return null;
  }

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100dvh",
        bgcolor: "grey.900",
        zIndex: 1200,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header with selection summaries and global toggles */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid",
          borderColor: "grey.800",
        }}
      >
        <Typography
          variant="h6"
          color="white"
          sx={{
            fontSize: { xs: 16, md: 20 },
          }}
        >
          Select Cards to Export ({selectedIds.length} / {cards.length})
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            onClick={selectAll}
            sx={{ color: "grey.300", borderColor: "grey.700" }}
          >
            Select All
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={deselectAll}
            sx={{ color: "grey.300", borderColor: "grey.700" }}
          >
            Deselect All
          </Button>
        </Stack>
      </Box>

      {/* Grid of selectable card previews */}
      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0,
          overflowY: "auto",
          p: 3,
          pb: 12,
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(auto-fill, minmax(140px, 1fr))",
            md: "repeat(auto-fill, minmax(200px, 1fr))",
          },
          gridAutoRows: "max-content",
          gap: 3,
          alignContent: "start",
        }}
      >
        {cards.map((card) => {
          const isSelected = selectedIds.includes(card.id);
          return (
            <Box
              key={card.id}
              onClick={() => toggleSelection(card.id)}
              sx={{
                position: "relative",
                aspectRatio: "5/7",
                borderRadius: 2,
                overflow: "hidden",
                cursor: "pointer",
                boxShadow: isSelected ? 10 : 2,
                border: "2px solid",
                borderColor: isSelected ? "primary.main" : "grey.800",
                transition: "all 0.2s ease-in-out",
                transform: isSelected ? "scale(1.02)" : "scale(1)",
                "&:hover": {
                  borderColor: isSelected ? "primary.light" : "grey.600",
                  transform: "scale(1.02)",
                },
              }}
            >
              <img
                src={card.imgUrl}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: isSelected ? 1 : 0.5,
                  transition: "opacity 0.2s",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  bgcolor: isSelected ? "primary.main" : "rgba(0,0,0,0.3)",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  boxShadow: 2,
                  border: "1px solid",
                  borderColor: "rgba(255,255,255,0.2)",
                }}
              >
                {isSelected ? (
                  <Check sx={{ fontSize: 20 }} />
                ) : (
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      border: "2px solid white",
                    }}
                  />
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Footer action buttons */}
      <Box
        sx={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1300,
        }}
      >
        <RoundedButtonGroup>
          <Button
            onClick={handleExport}
            disabled={isGenerating || selectedIds.length === 0}
            startIcon={<PictureAsPdf />}
            sx={{
              "&.Mui-disabled": {
                bgcolor: "grey.800",
                color: "rgba(255, 255, 255, 0.5)",
              },
            }}
          >
            Export
          </Button>
          <Button onClick={() => setIsModalOpen(false)} startIcon={<Close />}>
            Cancel
          </Button>
        </RoundedButtonGroup>
      </Box>

      {/* Progress backdrop visible during heavy processing */}
      <Backdrop
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 1400,
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
    </Box>
  );
}
