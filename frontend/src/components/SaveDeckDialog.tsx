import { useState } from "react";
import { Check, Close, Save } from "@mui/icons-material";
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import RoundedButtonGroup from "@src/components/RoundedButtonGroup";
import { deckApi } from "@src/services/api";
import useExportCards from "@src/hooks/useExportCards";
import { useSnackbar } from "@src/hooks/useSnackbar";
import { themeToSnake } from "@src/utils/themeHelpers";

interface SaveDeckDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function SaveDeckDialog({ open, onClose }: SaveDeckDialogProps) {
  const localCards = useExportCards((s) => s.cards);
  const showSnackbar = useSnackbar((s) => s.showSnackbar);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [title, setTitle] = useState(() => `Deck ${new Date().toLocaleDateString()}`);
  const [saving, setSaving] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevCards, setPrevCards] = useState(localCards);

  let needsSync = false;
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) needsSync = true;
  }
  if (localCards !== prevCards) {
    setPrevCards(localCards);
    if (open) needsSync = true;
  }
  if (needsSync) {
    setSelectedIds(localCards.map((c) => c.id));
  }

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const selectAll = () => setSelectedIds(localCards.map((c) => c.id));
  const deselectAll = () => setSelectedIds([]);

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      showSnackbar("Select at least one card", "error");
      return;
    }

    const cards = localCards
      .filter((c) => selectedIds.includes(c.id))
      .map((c) => ({
        id: c.cloudCardId || undefined,
        elements: c.elements,
        img_url: c.imgUrl,
        theme: themeToSnake(c.theme),
      }));

    setSaving(true);
    try {
      await deckApi.save({ title, cards });
      showSnackbar("Deck saved to cloud!", "success");
      onClose();
    } catch {
      showSnackbar("Failed to save deck", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

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
      data-testid="save-deck-overlay"
      aria-label="Save deck to cloud"
      role="dialog"
    >
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid",
          borderColor: "grey.800",
        }}
      >
        <TextField
          label="Deck Name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          size="small"
          sx={{
            mb: 1.5,
            "& .MuiInputBase-root": { bgcolor: "grey.800" },
            "& .MuiInputLabel-root": { color: "grey.400" },
            "& .MuiInputBase-input": { color: "white" },
          }}
          fullWidth
        />
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography
            color="white"
            sx={{ fontSize: { xs: 14, md: 18 } }}
          >
            Select Cards to Save ({selectedIds.length} / {localCards.length})
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
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0,
          overflowY: "auto",
          p: 3,
          pb: 16,
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
        {localCards.map((card) => {
          const isSelected = selectedIds.includes(card.id);
          return (
            <Box
              key={card.id}
              onClick={() => toggleSelection(card.id)}
              aria-checked={isSelected}
              role="checkbox"
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
            onClick={handleSave}
            disabled={saving || selectedIds.length === 0}
            startIcon={<Save />}
          >
            Save
          </Button>
          <Button onClick={onClose} startIcon={<Close />}>
            Cancel
          </Button>
        </RoundedButtonGroup>
      </Box>
    </Box>
  );
}
