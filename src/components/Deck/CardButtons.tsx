import { Edit, Delete, Download } from "@mui/icons-material";
import { useElementRegistry } from "../Card/Element/useElementRegistry";
import { usePreviewTheme } from "../Card/Preview";
import useExportCards, { type Card } from "../useExportCards";
import ActionButton from "./ActionButton";
import { useSnackbar } from "../useSnackbar";

interface CardButtonsProps {
  card: Card;
  onDelete?: (card: Card) => void;
  onEdit?: (card: Card) => void;
  onDownload?: (card: Card) => void;
}

export default function CardButtons({
  card,
  onDelete,
  onDownload,
  onEdit,
}: CardButtonsProps) {
  const setTheme = usePreviewTheme((state) => state.setTheme);
  const removeCard = useExportCards((state) => state.removeCard);
  const loadCard = useElementRegistry((state) => state.loadCard);
  const showSnackbar = useSnackbar((state) => state.showSnackbar);

  return (
    <>
      <ActionButton
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
        icon={<Delete style={{ fontSize: 14 }} />}
        color="#ef4444"
        onClick={() => {
          removeCard(card.id);
          onDelete?.(card);
          showSnackbar("Card removed from deck", "warning");
        }}
      />
      <ActionButton
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
