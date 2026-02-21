import { Save, Add } from "@mui/icons-material";
import { Button } from "@mui/material";
import RoundedButtonGroup from "./RoundedButtonGroup";
import useExportCards from "../useExportCards";
import { useCallback } from "react";
import { useSnackbar } from "../useSnackbar";
import { usePreviewTheme } from "./Preview";
import { useElementRegistry } from "./Element/useElementRegistry";
import { useSharedElement } from "./ElementRefContext";
import Tooltip from "../Tooltip";
import { getImageUrl as getImageUrlBase } from "./imageUtils";

export default function CardButtons() {
  const { element } = useSharedElement();
  const { elements, cardId } = useElementRegistry();
  const previewTheme = usePreviewTheme();
  const validCard = useExportCards(
    (state) => !!state.cards.find((card) => card.id === cardId),
  );
  const { addCard, updateCard } = useExportCards();
  const showSnackbar = useSnackbar((state) => state.showSnackbar);

  const getImageUrl = useCallback(
    async () =>
      getImageUrlBase(element, () => {
        showSnackbar("Failed to generate image preview", "error");
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
          <Button onClick={handleSave}>
            <Save />
          </Button>
        </Tooltip>
      )}
      <Tooltip title="Add card to deck">
        <Button onClick={handleAdd}>
          <Add />
        </Button>
      </Tooltip>
    </RoundedButtonGroup>
  );
}
