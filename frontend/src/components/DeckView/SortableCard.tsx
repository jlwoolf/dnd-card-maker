import { Box } from "@mui/material";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card } from "../useExportCards";
import CardButtons from "../Deck/CardButtons";

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
 * A draggable and sortable card component.
 * Utilizes @dnd-kit/sortable to handle drag-and-drop interactions and animations.
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
   * Applies the transformation and transition provided by dnd-kit.
   * Note: Using CSS.Translate instead of CSS.Transform prevents the card
   * from distorting or stretching while being dragged in a grid layout.
   */
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    // Elevate the currently dragged item above siblings
    zIndex: isDragging ? 1001 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
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
          // Reveal the overlay actions on hover
          "& .card-actions": {
            opacity: 1,
          },
        },
      }}
    >
      <img
        src={card.imgUrl}
        alt={`Card ${card.id}`} // Provided a fallback alt text for accessibility
        draggable="false"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          // Prevent the browser's default image drag behavior from interfering
          pointerEvents: "none",
        }}
      />

      {/* Overlay Actions Container */}
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
          // Disable pointer events while dragging to prevent accidental clicks
          pointerEvents: isDragging ? "none" : "auto",
        }}
      >
        {/* Inner Container for Buttons 
          This stops the pointer event from bubbling up to dnd-kit,
          allowing users to click buttons without triggering a drag.
        */}
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
