import { useEffect, useState } from "react";
import {
  Bookmark,
  BookmarkBorder,
  Close,
  ContentCopy,
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
import { cardApi, type CloudCardSummary } from "@src/services/api";
import { useActiveCardStore } from "@src/stores/useActiveCardStore";
import useExportCards from "./useExportCards";
import { useSnackbar } from "./useSnackbar";
import CardHoverActions from "./CardHoverActions";
import AddToDeckPopover from "./AddToDeckPopover";

interface CloudDeckViewProps {
  onClose: () => void;
}

export default function CloudDeckView({ onClose }: CloudDeckViewProps) {
  const [cards, setCards] = useState<CloudCardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loadCard = useActiveCardStore((s) => s.loadCard);
  const addCard = useExportCards((s) => s.addCard);
  const showSnackbar = useSnackbar((s) => s.showSnackbar);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareCardId, setShareCardId] = useState<string | null>(null);
  const [shareMode, setShareMode] = useState<"view_only" | "view_and_copy">(
    "view_and_copy",
  );
  const [shareUrl, setShareUrl] = useState("");
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [addDeckCardId, setAddDeckCardId] = useState<string | null>(null);

  const fetchCards = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await cardApi.list();
      setCards(res.data);
    } catch {
      setError("Failed to load cloud cards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleLoadToEditor = async (id: string) => {
    try {
      const res = await cardApi.get(id);
      loadCard({
        elements: res.data.elements as never,
        theme: {
          fill: res.data.theme.fill,
          bannerFill: res.data.theme.banner_fill,
          boxFill: res.data.theme.box_fill,
          stroke: res.data.theme.stroke,
          bannerText: res.data.theme.banner_text,
          boxText: res.data.theme.box_text,
        },
        id: res.data.id,
        cloudCardId: res.data.id,
      });
      showSnackbar("Card loaded into editor", "success");
      onClose();
    } catch {
      showSnackbar("Failed to load card", "error");
    }
  };

  const handleCopyToDeck = async (id: string) => {
    try {
      const res = await cardApi.get(id);
      addCard(res.data.elements as never, res.data.img_url, {
        fill: res.data.theme.fill,
        bannerFill: res.data.theme.banner_fill,
        boxFill: res.data.theme.box_fill,
        stroke: res.data.theme.stroke,
        bannerText: res.data.theme.banner_text,
        boxText: res.data.theme.box_text,
      });
      showSnackbar("Card copied to deck", "success");
    } catch {
      showSnackbar("Failed to copy card", "error");
    }
  };

  const handleToggleSave = async (id: string) => {
    try {
      const res = await cardApi.toggleSave(id);
      const saved = res.data.saved;
      setCards((prev) => prev.map((c) => (c.id === id ? { ...c, saved } : c)));
      showSnackbar(
        saved ? "Saved to My Cards" : "Removed from My Cards",
        "success",
      );
    } catch {
      showSnackbar("Failed to update save status", "error");
    }
  };

  const handleAddToDeck = (id: string) => {
    setAddDeckCardId(id);
  };

  const handleShareOpen = (id: string) => {
    setShareCardId(id);
    setShareUrl("");
    setShareMode("view_and_copy");
    setShareOpen(true);
  };

  const handleShare = async () => {
    if (!shareCardId) return;
    try {
      const res = await cardApi.share(shareCardId, shareMode);
      const slug = res.data.share_slug;
      const url = `${window.location.origin}${import.meta.env.BASE_URL}share/${slug}`;
      setShareUrl(url);
      setCards((prev) =>
        prev.map((c) =>
          c.id === shareCardId
            ? { ...c, share_slug: slug, share_mode: shareMode }
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
      showSnackbar("Failed to unshare card", "error");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyFeedback(true);
    } catch {
      showSnackbar("Failed to copy link", "error");
    }
  };

  const selectedCard = cards.find((c) => c.id === shareCardId);

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
      data-testid="cloud-deck-overlay"
      aria-label="Cloud cards"
      role="dialog"
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
            <Button onClick={fetchCards} sx={{ mt: 1 }}>
              Retry
            </Button>
          </Box>
        )}

        {!loading && !error && cards.length === 0 && (
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
              No cards saved to the cloud yet.
            </Typography>
          </Box>
        )}

        {cards.map((card) => (
          <Box
            key={card.id}
            data-card-id={card.id}
            sx={{
              position: "relative",
              aspectRatio: "5/7",
              borderRadius: 2,
              overflow: "hidden",
              boxShadow: 3,
              border: "1px solid",
              borderColor: card.saved ? "gold" : "divider",
              "&:hover": {
                boxShadow: 6,
                "& .cloud-card-actions": { opacity: 1 },
              },
            }}
          >
            <img
              src={card.img_url}
              alt={card.title || "Cloud card"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            {card.title && (
              <Typography
                noWrap
                variant="caption"
                sx={{
                  position: "absolute",
                  bottom: 4,
                  left: 4,
                  right: 4,
                  color: "white",
                  textShadow: "0 0 4px rgba(0,0,0,0.8)",
                  zIndex: 1,
                }}
              >
                {card.title}
              </Typography>
            )}

            <Box
              className="cloud-card-actions"
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
              }}
            >
              <Box onPointerDown={(e) => e.stopPropagation()}>
                <CardHoverActions
                  slots={{
                    save: {
                      tooltip: card.saved
                        ? "Remove from My Cards"
                        : "Save to My Cards",
                      icon: card.saved ? (
                        <Bookmark style={{ fontSize: 14 }} />
                      ) : (
                        <BookmarkBorder style={{ fontSize: 14 }} />
                      ),
                      color: "#e6b800",
                      onClick: () => handleToggleSave(card.id),
                      testId: `cloud-card-save-${card.id}`,
                    },
                    addToDeck: {
                      tooltip: "Add to Deck",
                      icon: <PlaylistAdd style={{ fontSize: 14 }} />,
                      color: "#10b981",
                      onClick: () => handleAddToDeck(card.id),
                      testId: `cloud-card-add-deck-${card.id}`,
                    },
                    edit: {
                      tooltip: "Load into Editor",
                      icon: <Edit style={{ fontSize: 14 }} />,
                      color: "#3b82f6",
                      onClick: () => handleLoadToEditor(card.id),
                      testId: `cloud-card-edit-${card.id}`,
                    },
                    copy: {
                      tooltip: "Copy to Deck",
                      icon: <ContentCopy style={{ fontSize: 14 }} />,
                      color: "#8b5cf6",
                      onClick: () => handleCopyToDeck(card.id),
                      testId: `cloud-card-copy-${card.id}`,
                    },
                    share: {
                      tooltip: card.share_slug ? "Manage Share" : "Share",
                      icon: <LinkIcon style={{ fontSize: 14 }} />,
                      color: "#f59e0b",
                      onClick: () => handleShareOpen(card.id),
                      testId: `cloud-card-share-${card.id}`,
                    },
                  }}
                />
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

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
          aria-label="close cloud deck"
          data-testid="close-cloud-deck-btn"
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

      <Dialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {selectedCard?.share_slug ? "Manage Share" : "Share Card"}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {selectedCard?.share_slug && shareUrl && (
            <Box sx={{ mt: 1, mb: 2, position: "relative" }}>
              <TextField
                fullWidth
                size="small"
                value={shareUrl}
                slotProps={{
                  input: {
                    readOnly: true,
                    endAdornment: (
                      <IconButton size="small" onClick={handleCopyLink}>
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

          <Typography variant="body2" sx={{ mb: 1 }}>
            Mode:
          </Typography>
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
              {selectedCard?.share_slug ? "Update Share" : "Create Share Link"}
            </Button>
            {selectedCard?.share_slug && (
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
      <AddToDeckPopover
        open={Boolean(addDeckCardId)}
        anchorEl={null}
        cardId={addDeckCardId || ""}
        onClose={() => {
          setAddDeckCardId(null);
        }}
      />
    </Box>
  );
}
