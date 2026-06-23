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
import { Box, Typography } from "@mui/material";
import useExportCards from "@src/stores/useExportCards";
import SortableCard from "./SortableCard";
import FullScreenOverlay from "../FullScreenOverlay";
import CardGrid from "../CardGrid";
import CloseFab from "../CloseFab";

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
    <FullScreenOverlay
      data-testid="deck-view-overlay"
      aria-label="Full deck view"
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToWindowEdges]}
      >
        <CardGrid data-testid="deck-grid-container">
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
        </CardGrid>
      </DndContext>

      <CloseFab
        onClose={onClose}
        aria-label="close deck view"
        data-testid="close-deck-view-btn"
      />
    </FullScreenOverlay>
  );
}
