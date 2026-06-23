import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  BookmarkBorder,
  Close,
  ContentCopy,
  Delete,
  Edit,
  Link as LinkIcon,
  PlaylistAdd,
} from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Fab,
  IconButton,
  Snackbar,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
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
import { deckApi, cardApi } from "@src/services/api";
import ProgressiveCardImage from "./ProgressiveCardImage";
import { useActiveCardStore } from "@src/stores/useActiveCardStore";

interface PreviewCard {
  id: string;
  title: string | null;
  elements: Element[];
  theme: PreviewTheme;
}
import type { Element, PreviewTheme } from "@src/schemas"
import { themeFromSnake } from "@src/utils/themeHelpers";
import useExportCards from "@src/hooks/useExportCards";
import { useSnackbar } from "@src/hooks/useSnackbar";
import CardHoverActions from "../CardHoverActions";
import AddToDeckPopover from "../AddToDeckPopover";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";


interface CloudDeckPreviewProps {
  deckId: string;
  onClose: () => void;
  onCloseAll: () => void;
}

function SortableCloudCard({
  card,
  saved,
  onEdit,
  onCopy,
  onRemove,
  onToggleSave,
  onAddToDeck,
  onShare,
}: {
  card: PreviewCard;
  saved: boolean;
  onEdit: () => void;
  onCopy: () => void;
  onRemove: () => void;
  onToggleSave: () => void;
  onAddToDeck: () => void;
  onShare: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

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
      sx={{
        position: "relative",
        aspectRatio: "5/7",
        borderRadius: 2,
        overflow: "hidden",
        boxShadow: 3,
        border: "1px solid",
        borderColor: saved ? "gold" : "divider",
        touchAction: "none",
        cursor: isDragging ? "grabbing" : "grab",
        "&:hover": {
          boxShadow: 6,
          "& .deck-preview-actions": { opacity: 1 },
        },
      }}
    >
      <ProgressiveCardImage
        cardId={card.id}
        highResScale={0.6}
        lowResScale={0.1}
        alt={card.title || "Card"}
        draggable="false"
        loading="lazy"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          pointerEvents: "none",
        }}
      />
      <Box
        className="deck-preview-actions"
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
          zIndex: 2,
          pointerEvents: "auto",
        }}
      >
        <Box onPointerDown={(e) => e.stopPropagation()}>
          <CardHoverActions
            slots={{
              save: {
                tooltip: saved ? "Remove from My Cards" : "Save to My Cards",
                icon: saved ? (
                  <Bookmark style={{ fontSize: 14 }} />
                ) : (
                  <BookmarkBorder style={{ fontSize: 14 }} />
                ),
                color: "#e6b800",
                onClick: onToggleSave,
              },
              addToDeck: {
                tooltip: "Add to Deck",
                icon: <PlaylistAdd style={{ fontSize: 14 }} />,
                color: "#10b981",
                onClick: onAddToDeck,
              },
              edit: {
                tooltip: "Load into Editor",
                icon: <Edit style={{ fontSize: 14 }} />,
                color: "#3b82f6",
                onClick: onEdit,
              },
              copy: {
                tooltip: "Copy to Local Deck",
                icon: <ContentCopy style={{ fontSize: 14 }} />,
                color: "#8b5cf6",
                onClick: onCopy,
              },
              share: {
                tooltip: "Share",
                icon: <LinkIcon style={{ fontSize: 14 }} />,
                color: "#f59e0b",
                onClick: onShare,
              },
              delete_: {
                tooltip: "Remove from Deck",
                icon: <Delete style={{ fontSize: 14 }} />,
                color: "#ef4444",
                onClick: onRemove,
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default function CloudDeckPreview({
  deckId,
  onClose,
  onCloseAll,
}: CloudDeckPreviewProps) {
  const [cards, setCards] = useState<PreviewCard[]>([]);
  const [savedCards, setSavedCards] = useState<Set<string>>(new Set());
  const [deckTitle, setDeckTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const loadCard = useActiveCardStore((s) => s.loadCard);
  const addCard = useExportCards((s) => s.addCard);
  const showSnackbar = useSnackbar((s) => s.showSnackbar);
  const [addDeckCardId, setAddDeckCardId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareCardId, setShareCardId] = useState<string | null>(null);
  const [shareMode, setShareMode] = useState<"view_only" | "view_and_copy">(
    "view_and_copy",
  );
  const [shareUrl, setShareUrl] = useState("");
  const [copyFeedback, setCopyFeedback] = useState(false);

  const cardIds = useMemo(() => cards.map((c) => c.id), [cards]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const fetchDeck = useCallback(async () => {
    try {
      const res = await deckApi.get(deckId);
      setDeckTitle(res.data.title);
      setCards(
        res.data.cards.map((c) => ({
          id: c.id,
          title: c.title,
          elements: c.elements,
          theme: themeFromSnake(c.theme),
        })),
      );
      setSavedCards(
        new Set(res.data.cards.filter((c) => c.saved).map((c) => c.id)),
      );
    } catch {
      showSnackbar("Failed to load deck", "error");
    } finally {
      setLoading(false);
    }
  }, [deckId, showSnackbar]);

  useEffect(() => {
    fetchDeck();
  }, [fetchDeck]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = cards.findIndex((c) => c.id === active.id);
      const newIndex = cards.findIndex((c) => c.id === over.id);
      const newCards = arrayMove(cards, oldIndex, newIndex);
      setCards(newCards);
      try {
        await deckApi.update(deckId, {
          card_ids: newCards.map((c) => c.id),
        });
      } catch {
        showSnackbar("Failed to reorder", "error");
        fetchDeck();
      }
    }
  };

  const handleEdit = (card: PreviewCard) => {
    loadCard({
      elements: card.elements,
      theme: card.theme,
      id: card.id,
      cloudCardId: card.id,
    });
    showSnackbar("Card loaded into editor", "success");
    onCloseAll();
  };

  const handleCopy = (card: PreviewCard) => {
    addCard(card.elements, "", card.theme, card.id);
    showSnackbar("Card copied to local deck", "success");
  };

  const handleRemove = async (cardId: string) => {
    const newCards = cards.filter((c) => c.id !== cardId);
    setCards(newCards);
    try {
      await deckApi.update(deckId, { card_ids: newCards.map((c) => c.id) });
    } catch {
      showSnackbar("Failed to remove card", "error");
      fetchDeck();
    }
  };

  const handleLoadAll = () => {
    for (const card of cards) {
      addCard(card.elements, "", card.theme, card.id);
    }
    showSnackbar(`Loaded ${cards.length} card(s) to local deck`, "success");
  };

  const handleToggleSave = async (cardId: string) => {
    try {
      const res = await cardApi.toggleSave(cardId);
      const saved = res.data.saved;
      if (saved) {
        setSavedCards((prev) => new Set(prev).add(cardId));
      } else {
        setSavedCards((prev) => {
          const next = new Set(prev);
          next.delete(cardId);
          return next;
        });
      }
      showSnackbar(
        saved ? "Saved to My Cards" : "Removed from My Cards",
        "success",
      );
    } catch {
      showSnackbar("Failed to update save status", "error");
    }
  };

  const handleAddToDeck = (cardId: string) => {
    setAddDeckCardId(cardId);
  };

  const handleShareOpen = (cardId: string) => {
    setShareCardId(cardId);
    setShareUrl("");
    setShareMode("view_and_copy");
    setShareOpen(true);
  };

  const handleShare = async () => {
    if (!shareCardId) return;
    try {
      const res = await cardApi.share(shareCardId, shareMode);
      setShareUrl(
        `${window.location.origin}${import.meta.env.BASE_URL}share/${res.data.share_slug}`,
      );
      setCards((prev) =>
        prev.map((c) =>
          c.id === shareCardId
            ? { ...c, share_slug: res.data.share_slug, share_mode: shareMode }
            : c,
        ),
      );
    } catch {
      showSnackbar("Failed to share card", "error");
    }
  };

  const handleUnshare = async () => {
    if (!shareCardId) return;
    try {
      await cardApi.unshare(shareCardId);
      setShareUrl("");
      setCards((prev) =>
        prev.map((c) =>
          c.id === shareCardId
            ? { ...c, share_slug: null, share_mode: null }
            : c,
        ),
      );
      showSnackbar("Share link removed", "success");
    } catch {
      showSnackbar("Failed to unshare", "error");
    }
  };

  return (
    <>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        px={3}
        py={2}
      >
        <Typography variant="h6" color="white">
          {deckTitle}
        </Typography>
        <Box display="flex" gap={1}>
          <Button variant="contained" size="small" onClick={handleLoadAll}>
            Load All to Local
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={onClose}
            sx={{ color: "white", borderColor: "white" }}
          >
            Back
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToWindowEdges]}
        >
          <Box
            sx={{
              flexGrow: 1,
              minHeight: 0,
              overflowY: "auto",
              p: 3,
              pb: { xs: 12, md: 16 },
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
            {cards.length === 0 && (
              <Box sx={{ gridColumn: "1 / -1", textAlign: "center", py: 8 }}>
                <Typography variant="h6" color="grey.500">
                  This deck is empty.
                </Typography>
              </Box>
            )}
            <SortableContext items={cardIds} strategy={rectSortingStrategy}>
              {cards.map((card) => (
                <SortableCloudCard
                  key={card.id}
                  card={card}
                  saved={savedCards.has(card.id)}
                  onEdit={() => handleEdit(card)}
                  onCopy={() => handleCopy(card)}
                  onRemove={() => handleRemove(card.id)}
                  onToggleSave={() => handleToggleSave(card.id)}
                  onAddToDeck={() => handleAddToDeck(card.id)}
                  onShare={() => handleShareOpen(card.id)}
                />
              ))}
            </SortableContext>
          </Box>
        </DndContext>
      )}

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
          sx={{
            boxShadow: 4,
            "&:hover": { transform: "scale(1.1)" },
            transition: "transform 0.2s",
            width: { xs: "56px", md: "80px" },
            height: { xs: "56px", md: "80px" },
          }}
        >
          <Close />
        </Fab>
      </Box>
      <AddToDeckPopover
        open={Boolean(addDeckCardId)}
        anchorEl={null}
        cardId={addDeckCardId || ""}
        onClose={() => setAddDeckCardId(null)}
      />
      <Dialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {cards.find((c) => c.id === shareCardId)
            ? "Manage Share"
            : "Share Card"}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {shareUrl && (
            <Box sx={{ mb: 2, position: "relative" }}>
              <TextField
                fullWidth
                size="small"
                value={shareUrl}
                slotProps={{
                  input: {
                    readOnly: true,
                    endAdornment: (
                      <IconButton
                        size="small"
                        onClick={() => {
                          navigator.clipboard.writeText(shareUrl);
                          setCopyFeedback(true);
                        }}
                      >
                        <LinkIcon fontSize="small" />
                      </IconButton>
                    ),
                  },
                }}
                label="Share Link"
                sx={{ mb: 1 }}
              />
            </Box>
          )}
          <ToggleButtonGroup
            value={shareMode}
            exclusive
            onChange={(_, v) => v && setShareMode(v)}
            size="small"
            fullWidth
            sx={{ mb: 2 }}
          >
            <ToggleButton value="view_only">View Only</ToggleButton>
            <ToggleButton value="view_and_copy">View & Copy</ToggleButton>
          </ToggleButtonGroup>
          <Box display="flex" gap={1}>
            <Button variant="contained" onClick={handleShare} fullWidth>
              {shareUrl ? "Update" : "Create Link"}
            </Button>
            {shareUrl && (
              <Button variant="outlined" color="error" onClick={handleUnshare}>
                Remove
              </Button>
            )}
          </Box>
        </DialogContent>
      </Dialog>
      <Snackbar
        open={copyFeedback}
        autoHideDuration={2000}
        onClose={() => setCopyFeedback(false)}
        message="Link copied to clipboard"
      />
    </>
  );
}
