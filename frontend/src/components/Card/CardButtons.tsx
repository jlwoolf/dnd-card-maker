import { useCallback } from "react";
import { Save, Add } from "@mui/icons-material";
import { Button } from "@mui/material";
import Tooltip from "../Tooltip";
import useExportCards from "../useExportCards";
import { useSnackbar } from "../useSnackbar";
import { useElementRegistry } from "./Element/useElementRegistry";
import { useSharedElement } from "./ElementRefContext";
import { getImageUrl as getImageUrlBase } from "./imageUtils";
import { usePreviewTheme } from "./Preview";
import RoundedButtonGroup from "../RoundedButtonGroup";

/**
 * CardButtons provides the floating action buttons for saving or adding
 * the current card to the deck.
 */
export default function CardButtons() {
  const { element } = useSharedElement();
  const { elements, cardId } = useElementRegistry();
  const previewTheme = usePreviewTheme();
  const validCard = useExportCards(
    (state) => !!state.cards.find((card) => card.id === cardId),
  );
  const { addCard, updateCard } = useExportCards();
  const showSnackbar = useSnackbar((state) => state.showSnackbar);

  /**
   * Generates a PNG data URL of the current preview card.
   */
  const getImageUrl = useCallback(
    async () =>
      getImageUrlBase(element, () => {
        showSnackbar("Failed to generate image preview", "error");
      }),
    [element, showSnackbar],
  );

  /**
   * Saves changes to an existing card in the deck.
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
   * Adds the current card as a new entry in the deck.
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
