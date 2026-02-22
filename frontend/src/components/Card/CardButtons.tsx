import { useCallback } from "react";
import { Add, Save } from "@mui/icons-material";
import { Button } from "@mui/material";
import { ImageProcessor } from "@src/services/ImageProcessor";
import { useActiveCardStore } from "@src/stores/useActiveCardStore";
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
  
  const validCard = useExportCards(
    (state) => !!state.cards.find((card) => card.id === cardId),
  );
  const { addCard, updateCard } = useExportCards();
  const showSnackbar = useSnackbar((state) => state.showSnackbar);

  /**
   * Captures the current preview DOM element as a PNG data URL.
   * 
   * @returns A promise resolving to the image data URL.
   */
  const getImageUrl = useCallback(
    async () =>
      ImageProcessor.captureElement(element, {
        onError: () => {
          showSnackbar("Failed to generate image preview", "error");
        },
      }),
    [element, showSnackbar],
  );

  /**
   * Saves changes to an existing card in the deck. 
   * Triggers image re-generation to ensure the deck preview is up-to-date.
   */
  const handleSave = useCallback(async () => {
    if (cardId) {
      const dataUrl = await getImageUrl();
      if (dataUrl) {
        updateCard(cardId, { elements, imgUrl: dataUrl, theme: previewTheme });
        showSnackbar("Card saved successfully!", "success");
      }
    }
  }, [cardId, getImageUrl, updateCard, elements, previewTheme, showSnackbar]);

  /**
   * Adds the current editor state as a new unique card entry in the deck.
   */
  const handleAdd = useCallback(async () => {
    const dataUrl = await getImageUrl();
    if (dataUrl) {
      addCard(elements, dataUrl, previewTheme);
      showSnackbar("Card added to deck!", "success");
    }
  }, [addCard, elements, getImageUrl, previewTheme, showSnackbar]);

  return (
    <RoundedButtonGroup
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
          <Button onClick={handleSave} sx={{ padding: "8px !important" }}>
            <Save />
          </Button>
        </Tooltip>
      )}
      <Tooltip title="Add card to deck">
        <Button onClick={handleAdd} sx={{ padding: "8px !important" }}>
          <Add />
        </Button>
      </Tooltip>
    </RoundedButtonGroup>
  );
}
