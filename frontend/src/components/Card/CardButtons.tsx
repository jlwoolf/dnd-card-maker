import { useCallback } from "react";
import { Add, CloudUpload, Save } from "@mui/icons-material";
import { Button } from "@mui/material";
import { cardApi } from "@src/services/api";
import { ImageProcessor } from "@src/services/ImageProcessor";
import { useActiveCardStore } from "@src/stores/useActiveCardStore";
import { useAuthStore } from "@src/stores/useAuthStore";
import RoundedButtonGroup from "../RoundedButtonGroup";
import Tooltip from "../Tooltip";
import useExportCards from "../useExportCards";
import { useSnackbar } from "../useSnackbar";
import { useSharedElement } from "./ElementRefContext";

/**
 * CardButtons provides the floating action buttons for the editor.
 * It manages the persistence of the current card state into the global deck, 
 * handling both new additions and updates to existing cards.
 */
export default function CardButtons() {
  const { element } = useSharedElement();
  const { elements, cardId, theme: previewTheme } = useActiveCardStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  const validCard = useExportCards(
    (state) => !!state.cards.find((card) => card.id === cardId),
  );
  const { addCard, updateCard } = useExportCards();
  const showSnackbar = useSnackbar((state) => state.showSnackbar);

  const getImageUrl = useCallback(
    async () =>
      ImageProcessor.captureElement(element, {
        onError: () => {
          showSnackbar("Failed to generate image preview", "error");
        },
      }),
    [element, showSnackbar],
  );

  const handleSave = useCallback(async () => {
    if (cardId) {
      const dataUrl = await getImageUrl();
      if (dataUrl) {
        updateCard(cardId, { elements, imgUrl: dataUrl, theme: previewTheme });
        showSnackbar("Card saved successfully!", "success");
      }
    }
  }, [cardId, getImageUrl, updateCard, elements, previewTheme, showSnackbar]);

  const handleAdd = useCallback(async () => {
    const dataUrl = await getImageUrl();
    if (dataUrl) {
      addCard(elements, dataUrl, previewTheme);
      showSnackbar("Card added to deck!", "success");
    }
  }, [addCard, elements, getImageUrl, previewTheme, showSnackbar]);

  const handleSaveCloud = useCallback(async () => {
    const dataUrl = await getImageUrl();
    if (!dataUrl) return;
    try {
      await cardApi.create({
        elements: elements as unknown[],
        img_url: dataUrl,
        theme: {
          fill: previewTheme.fill,
          banner_fill: previewTheme.bannerFill,
          box_fill: previewTheme.boxFill,
          stroke: previewTheme.stroke,
          banner_text: previewTheme.bannerText,
          box_text: previewTheme.boxText,
        },
      });
      showSnackbar("Saved to cloud!", "success");
    } catch {
      showSnackbar("Failed to save to cloud", "error");
    }
  }, [elements, getImageUrl, previewTheme, showSnackbar]);

  return (
    <RoundedButtonGroup
      data-testid="card-persistence-actions"
      sx={{
        position: "fixed",
        bottom: "20px",
        right: { md: "50%", xs: "20px" },
        transform: { md: "translate(50%)" },
        zIndex: 10,
      }}
    >
      {validCard && (
        <Tooltip title="Save card">
          <Button 
            onClick={handleSave} 
            sx={{ padding: "8px !important" }}
            data-testid="save-card-btn"
            aria-label="Save changes to current card"
          >
            <Save />
          </Button>
        </Tooltip>
      )}
      {isAuthenticated && (
        <Tooltip title="Save to cloud">
          <Button
            onClick={handleSaveCloud}
            sx={{ padding: "8px !important" }}
            data-testid="save-cloud-btn"
            aria-label="Save current card to cloud"
          >
            <CloudUpload />
          </Button>
        </Tooltip>
      )}
      <Tooltip title="Add card to deck">
        <Button 
          onClick={handleAdd} 
          sx={{ padding: "8px !important" }}
          data-testid="add-to-deck-btn"
          aria-label="Add current card to deck as new entry"
        >
          <Add />
        </Button>
      </Tooltip>
    </RoundedButtonGroup>
  );
}
