import { useMemo } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Close } from "@mui/icons-material";
import { Box, Fab, Typography } from "@mui/material";
import useExportCards from "../useExportCards";
import SortableCard from "./SortableCard";

/**
 * Props for the DeckView component.
 */
export interface DeckViewProps {
  /** Callback to close the deck view and return to the primary editor */
  onClose: () => void;
}

/**
 * DeckView provides a full-screen, immersive management interface for the 
 * current deck. It features a responsive grid layout where cards can be 
 * reordered via drag-and-drop, using @dnd-kit for high-performance 
 * interactions and accessible sorting.
 */
export default function DeckView({ onClose }: DeckViewProps) {
  const cards = useExportCards((state) => state.cards);
  const setCards = useExportCards((state) => state.setCards);

  const cardIds = useMemo(() => cards.map((card) => card.id), [cards]);

  /**
   * Configure sophisticated input sensors. 
   * PointerSensor handles mouse/touch with an 8px distance constraint to 
   * distinguish drags from clicks on action buttons.
   */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  /**
   * Finalizes the reordering when a card is dropped.
   * Calculates the new indices and updates the global deck store.
   * 
   * @param event - The dnd-kit drag end event payload.
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = cards.findIndex((c) => c.id === active.id);
      const newIndex = cards.findIndex((c) => c.id === over.id);

      setCards(arrayMove(cards, oldIndex, newIndex));
    }
  };

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
      data-testid="deck-view-overlay"
      aria-label="Full deck view"
      role="dialog"
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToWindowEdges]}
      >
        <Box
          data-testid="deck-grid-container"
          sx={{
            flexGrow: 1,
            minHeight: 0,
            overflowY: "auto",
            p: 3,
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
          {cards.length === 0 ? (
            <Box
              sx={{
                gridColumn: "1 / -1",
                height: "50vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="h6" color="grey.500">
                Your deck is empty. Create some cards first!
              </Typography>
            </Box>
          ) : (
            <SortableContext items={cardIds} strategy={rectSortingStrategy}>
              {cards.map((card) => (
                <SortableCard key={card.id} card={card} onClose={onClose} />
              ))}
            </SortableContext>
          )}
        </Box>
      </DndContext>

      <Box
        sx={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1100,
        }}
      >
        <Fab
          color="primary"
          onClick={onClose}
          aria-label="close deck view"
          data-testid="close-deck-view-btn"
          sx={{
            boxShadow: 4,
            "&:hover": {
              transform: "scale(1.1)",
            },
            transition: "transform 0.2s",
            width: { xs: "56px", md: "80px" },
            height: { xs: "56px", md: "80px" },
          }}
        >
          <Close />
        </Fab>
      </Box>
    </Box>
  );
}
