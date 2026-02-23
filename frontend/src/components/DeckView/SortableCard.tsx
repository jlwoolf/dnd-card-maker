import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box } from "@mui/material";
import CardButtons from "../Deck/CardButtons";
import type { Card } from "../useExportCards";

/**
 * Props for the SortableCard component.
 */
export interface SortableCardProps {
  /** The card data object to display and sort */
  card: Card;
  /** Callback to close the deck view (e.g., triggered after editing/copying) */
  onClose: () => void;
}

/**
 * SortableCard is a draggable grid item designed for the DeckView.
 * It utilizes @dnd-kit/sortable for smooth drag interactions and features 
 * an overlay with quick action buttons (edit, delete, etc.) that appears 
 * on hover.
 */
export default function SortableCard({ card, onClose }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  /**
   * Applies the transformation provided by dnd-kit.
   * Using CSS.Translate instead of CSS.Transform ensures the card maintains 
   * its aspect ratio without distortion during drag operations.
   */
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 1001 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      data-testid={`sortable-card-${card.id}`}
      sx={{
        position: "relative",
        aspectRatio: "5/7",
        borderRadius: 2,
        overflow: "hidden",
        boxShadow: 3,
        border: "1px solid",
        borderColor: "divider",
        transition: "box-shadow 0.2s ease-in-out",
        touchAction: "none",
        cursor: isDragging ? "grabbing" : "grab",
        "&:hover": {
          boxShadow: 6,
          "& .card-actions": {
            opacity: 1,
          },
        },
      }}
    >
      <img
        src={card.imgUrl}
        alt={`Card ${card.id}`}
        draggable="false"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          pointerEvents: "none",
        }}
      />

      {/* Overlay Actions Container - revealed on hover */}
      <Box
        className="card-actions"
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          bgcolor: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          opacity: 0,
          transition: "opacity 0.2s ease-in-out",
          pointerEvents: isDragging ? "none" : "auto",
        }}
      >
        <Box
          onPointerDown={(e) => e.stopPropagation()}
          sx={{
            display: "flex",
            gap: 1,
            p: 1,
            borderRadius: 1,
            bgcolor: "background.paper",
            boxShadow: 2,
          }}
        >
          <CardButtons card={card} onEdit={onClose} onCopy={onClose} />
        </Box>
      </Box>
    </Box>
  );
}
