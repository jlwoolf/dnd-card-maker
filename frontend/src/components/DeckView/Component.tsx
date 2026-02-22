import { useMemo } from "react";
import { Box, Typography, Fab } from "@mui/material";
import { Close } from "@mui/icons-material";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import useExportCards from "../useExportCards";
import SortableCard from "./SortableCard";

/**
 * Props for the DeckView component.
 */
export interface DeckViewProps {
  /** Callback to close the deck view and return to the editor */
  onClose: () => void;
}

/**
 * DeckView renders a full-screen, scrollable grid of all cards in the deck.
 * Users can drag and drop cards to reorder them in the global state.
 */
export default function DeckView({ onClose }: DeckViewProps) {
  // Global state management
  const cards = useExportCards((state) => state.cards);
  const setCards = useExportCards((state) => state.setCards);

  // Extract primitive IDs to prevent unnecessary re-renders in SortableContext
  const cardIds = useMemo(() => cards.map((card) => card.id), [cards]);

  /**
   * Configure sensors for mouse/touch and keyboard interactions.
   */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // Require dragging 8px before activation to distinguish from simple clicks
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  /**
   * Handles the end of a drag event.
   * Calculates the new position and updates the global state.
   * * @param event - The payload provided by dnd-kit upon completing a drag
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // If dropped over a valid target that is not its original position
    if (over && active.id !== over.id) {
      const oldIndex = cards.findIndex((c) => c.id === active.id);
      const newIndex = cards.findIndex((c) => c.id === over.id);

      // Reorder the array and push to global state
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
        height: "100dvh", // dynamic viewport height ensures mobile safari compatibility
        bgcolor: "grey.900",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToWindowEdges]}
      >
        {/* Scrollable Grid Container */}
        <Box
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

      {/* Floating Close Button */}
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
