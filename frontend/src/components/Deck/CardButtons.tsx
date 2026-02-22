import { ContentCopy, Delete, Download, Edit } from "@mui/icons-material";
import { useElementRegistry } from "../Card/Element/useElementRegistry";
import { usePreviewTheme } from "../Card/Preview";
import useExportCards, { type Card } from "../useExportCards";
import { useSnackbar } from "../useSnackbar";
import ActionButton from "./ActionButton";

interface CardButtonsProps {
  /** The full card data object */
  card: Card;
  /** Callback triggered after the card is deleted from the deck */
  onDelete?: (card: Card) => void;
  /** Callback triggered after the card is loaded into the editor */
  onEdit?: (card: Card) => void;
  /** Callback triggered after the card image is downloaded */
  onDownload?: (card: Card) => void;
  /** Callback triggered after the card is duplicated to the editor */
  onCopy?: (card: Card) => void;
}

/**
 * CardButtons provides a row of quick-action buttons for a card within 
 * the deck view or stack. It handles editing, duplication, deletion, 
 * and direct image downloads.
 */
export default function CardButtons({
  card,
  onDelete,
  onDownload,
  onEdit,
  onCopy,
}: CardButtonsProps) {
  const setTheme = usePreviewTheme((state) => state.setTheme);
  const removeCard = useExportCards((state) => state.removeCard);
  const loadCard = useElementRegistry((state) => state.loadCard);
  const showSnackbar = useSnackbar((state) => state.showSnackbar);

  return (
    <>
      <ActionButton
        tooltip="Edit Card"
        icon={<Edit style={{ fontSize: 14 }} />}
        color="#3b82f6"
        onClick={() => {
          loadCard(card.elements, card.id);
          setTheme(card.theme);
          onEdit?.(card);
          showSnackbar("Card loaded into editor", "info");
        }}
      />
      <ActionButton
        tooltip="Copy to Editor"
        icon={<ContentCopy style={{ fontSize: 14 }} />}
        color="#8b5cf6"
        onClick={() => {
          loadCard(card.elements);
          setTheme(card.theme);
          onCopy?.(card);
          showSnackbar("Card data copied to editor", "info");
        }}
      />
      <ActionButton
        tooltip="Delete Card"
        icon={<Delete style={{ fontSize: 14 }} />}
        color="#ef4444"
        onClick={() => {
          removeCard(card.id);
          onDelete?.(card);
          showSnackbar("Card removed from deck", "warning");
        }}
      />
      <ActionButton
        tooltip="Download Card"
        icon={<Download style={{ fontSize: 14 }} />}
        color="#0e9e0c"
        onClick={() => {
          const link = document.createElement("a");
          link.download = `card-${card.id}.png`;
          link.href = card.imgUrl;
          link.click();
          onDownload?.(card);
          showSnackbar("Image downloaded", "success");
        }}
      />
    </>
  );
}
