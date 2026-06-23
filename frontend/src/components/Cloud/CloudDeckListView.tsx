import { useEffect, useState } from "react";
import {
  Close,
  ContentCopy,
  Delete,
  Edit,
  Link as LinkIcon,
  Visibility,
} from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fab,
  IconButton,
  Snackbar,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { deckApi, type DeckSummary } from "@src/services/api";
import ProgressiveCardImage from "./ProgressiveCardImage";
import { themeFromSnake } from "@src/utils/themeHelpers";
import useExportCards from "@src/hooks/useExportCards";
import { useSnackbar } from "@src/hooks/useSnackbar";
import ActionButton from "../Deck/ActionButton";
import CloudDeckPreview from "./CloudDeckPreview";

interface CloudDeckListViewProps {
  onClose: () => void;
}

export default function CloudDeckListView({ onClose }: CloudDeckListViewProps) {
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const addCard = useExportCards((s) => s.addCard);
  const setCards = useExportCards((s) => s.setCards);
  const setEditingCloudDeck = useExportCards((s) => s.setEditingCloudDeck);
  const showSnackbar = useSnackbar((s) => s.showSnackbar);

  const [previewDeckId, setPreviewDeckId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareDeckId, setShareDeckId] = useState<string | null>(null);
  const [shareMode, setShareMode] = useState<"view_only" | "view_and_copy">(
    "view_and_copy",
  );
  const [shareUrl, setShareUrl] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteDeckId, setDeleteDeckId] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const fetchDecks = async () => {
    setLoading(true);
    try {
      const res = await deckApi.list();
      setDecks(res.data);
    } catch {
      setError("Failed to load decks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  const handleEditDeck = async (deckId: string) => {
    try {
      const res = await deckApi.get(deckId);
      setCards([]);
      setEditingCloudDeck(deckId, res.data.title);
      for (const card of res.data.cards) {
        addCard(
          card.elements,
          "",
          themeFromSnake(card.theme),
          card.id,
        );
      }
      showSnackbar("Deck loaded into editor!", "success");
      onClose();
    } catch {
      showSnackbar("Failed to load deck", "error");
    }
  };

  const handleCopyDeck = async (deckId: string) => {
    try {
      const res = await deckApi.get(deckId);
      for (const card of res.data.cards) {
        addCard(
          card.elements,
          "",
          themeFromSnake(card.theme),
          card.id,
        );
      }
      showSnackbar("Deck copied to local deck!", "success");
      onClose();
    } catch {
      showSnackbar("Failed to copy deck", "error");
    }
  };

  const handleShareOpen = (deckId: string) => {
    setShareDeckId(deckId);
    const deck = decks.find((d) => d.id === deckId);
    if (deck?.share_slug) {
      setShareUrl(
        `${window.location.origin}${import.meta.env.BASE_URL}share/${deck.share_slug}`,
      );
    } else {
      setShareUrl("");
    }
    setShareMode("view_and_copy");
    setShareOpen(true);
  };

  const handleShare = async () => {
    if (!shareDeckId) return;
    try {
      const res = await deckApi.share(shareDeckId, shareMode);
      setShareUrl(
        `${window.location.origin}${import.meta.env.BASE_URL}share/${res.data.share_slug}`,
      );
      setDecks((prev) =>
        prev.map((d) =>
          d.id === shareDeckId
            ? { ...d, share_slug: res.data.share_slug, share_mode: shareMode }
            : d,
        ),
      );
    } catch {
      showSnackbar("Failed to share deck", "error");
    }
  };

  const handleUnshare = async () => {
    if (!shareDeckId) return;
    try {
      await deckApi.unshare(shareDeckId);
      setShareUrl("");
      setDecks((prev) =>
        prev.map((d) =>
          d.id === shareDeckId
            ? { ...d, share_slug: null, share_mode: null }
            : d,
        ),
      );
      showSnackbar("Share link removed", "success");
    } catch {
      showSnackbar("Failed to unshare", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteDeckId) return;
    try {
      await deckApi.delete(deleteDeckId);
      setDecks((prev) => prev.filter((d) => d.id !== deleteDeckId));
      setDeleteOpen(false);
      showSnackbar("Deck deleted", "success");
    } catch {
      showSnackbar("Failed to delete deck", "error");
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
      aria-label="Cloud decks"
      role="dialog"
    >
      {previewDeckId ? (
        <CloudDeckPreview
          deckId={previewDeckId}
          onClose={() => setPreviewDeckId(null)}
          onCloseAll={onClose}
        />
      ) : (
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
            gap: 3,
            alignContent: "start",
          }}
        >
          {loading && (
            <Box
              sx={{
                gridColumn: "1 / -1",
                height: "50vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Box sx={{ gridColumn: "1 / -1", textAlign: "center", py: 4 }}>
              <Typography color="error">{error}</Typography>
              <Button onClick={fetchDecks} sx={{ mt: 1 }}>
                Retry
              </Button>
            </Box>
          )}

          {!loading && !error && decks.length === 0 && (
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
                No decks saved to the cloud.
              </Typography>
            </Box>
          )}

          {decks.map((deck) => (
            <Box
              key={deck.id}
              sx={{
                position: "relative",
                aspectRatio: "5/7",
                borderRadius: 2,
                overflow: "hidden",
                boxShadow: 3,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "grey.800",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                "&:hover": {
                  boxShadow: 6,
                  "& .deck-card-actions": { opacity: 1 },
                },
              }}
            >
              {deck.first_card_id && (
                <ProgressiveCardImage
                  cardId={deck.first_card_id}
                  highResScale={0.6}
                  lowResScale={0.1}
                  alt={deck.title}
                  loading="lazy"
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: 0.4,
                  }}
                />
              )}
              <Typography
                variant="subtitle2"
                color="white"
                sx={{
                  position: "relative",
                  zIndex: 1,
                  textAlign: "center",
                  px: 1,
                  pointerEvents: "none",
                }}
              >
                {deck.title}
              </Typography>
              <Typography
                variant="caption"
                color="grey.400"
                sx={{ position: "relative", zIndex: 1, pointerEvents: "none" }}
              >
                {deck.card_count} card{deck.card_count !== 1 ? "s" : ""}
              </Typography>
              {deck.is_default && (
                <Typography
                  variant="caption"
                  color="primary.light"
                  sx={{
                    position: "relative",
                    zIndex: 1,
                    pointerEvents: "none",
                  }}
                >
                  Default
                </Typography>
              )}

              <Box
                className="deck-card-actions"
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
                }}
              >
                <Box
                  onPointerDown={(e) => e.stopPropagation()}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 1,
                    p: 1,
                    borderRadius: 1,
                    bgcolor: "background.paper",
                    boxShadow: 2,
                  }}
                >
                  <ActionButton
                    tooltip="Edit Deck"
                    icon={<Edit style={{ fontSize: 14 }} />}
                    color="#3b82f6"
                    onClick={() => handleEditDeck(deck.id)}
                  />
                  <ActionButton
                    tooltip="Preview"
                    icon={<Visibility style={{ fontSize: 14 }} />}
                    color="#8b5cf6"
                    onClick={() => setPreviewDeckId(deck.id)}
                  />
                  <ActionButton
                    tooltip="Copy to Local"
                    icon={<ContentCopy style={{ fontSize: 14 }} />}
                    color="#10b981"
                    onClick={() => handleCopyDeck(deck.id)}
                  />
                  <ActionButton
                    tooltip="Share"
                    icon={<LinkIcon style={{ fontSize: 14 }} />}
                    color="#f59e0b"
                    onClick={() => handleShareOpen(deck.id)}
                  />
                  {!deck.is_default && (
                    <ActionButton
                      tooltip="Delete"
                      icon={<Delete style={{ fontSize: 14 }} />}
                      color="#ef4444"
                      onClick={() => {
                        setDeleteDeckId(deck.id);
                        setDeleteOpen(true);
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
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
          aria-label="close"
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

      {/* Share dialog */}
      <Dialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {decks.find((d) => d.id === shareDeckId)?.share_slug
            ? "Manage Share"
            : "Share Deck"}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {shareUrl && (
            <Box sx={{ mt: 1, mb: 2, position: "relative" }}>
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
              {decks.find((d) => d.id === shareDeckId)?.share_slug
                ? "Update"
                : "Create Link"}
            </Button>
            {decks.find((d) => d.id === shareDeckId)?.share_slug && (
              <Button variant="outlined" color="error" onClick={handleUnshare}>
                Remove
              </Button>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Deck?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This won't delete the individual cards from your cloud. They'll
            remain in your default deck.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={copyFeedback}
        autoHideDuration={2000}
        onClose={() => setCopyFeedback(false)}
        message="Link copied to clipboard"
      />
    </Box>
  );
}
