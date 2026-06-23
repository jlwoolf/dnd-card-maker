import { useEffect, useState } from "react";
import {
  Bookmark,
  BookmarkBorder,
  ContentCopy,
  Edit,
  Link as LinkIcon,
  PlaylistAdd,
} from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import { cardApi, type CloudCardSummary } from "@src/services/api";
import ProgressiveCardImage from "./ProgressiveCardImage";
import { useActiveCardStore } from "@src/stores/useActiveCardStore";
import { themeFromSnake } from "@src/utils/themeHelpers";
import useExportCards from "@src/stores/useExportCards";
import { useSnackbar } from "@src/stores/useSnackbar";
import CardHoverActions from "../CardHoverActions";
import AddToDeckPopover from "../AddToDeckPopover";
import FullScreenOverlay from "../FullScreenOverlay";
import CardGrid from "../CardGrid";
import CloseFab from "../CloseFab";
import ShareDialog from "../ShareDialog";

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
        elements: res.data.elements,
        theme: themeFromSnake(res.data.theme),
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
      addCard(res.data.elements, res.data.img_url, themeFromSnake(res.data.theme));
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

  const selectedCard = cards.find((c) => c.id === shareCardId);

  return (
    <FullScreenOverlay
      data-testid="cloud-deck-overlay"
      aria-label="Cloud cards"
    >
      <CardGrid>
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
            <ProgressiveCardImage
              cardId={card.id}
              highResScale={0.6}
              lowResScale={0.1}
              alt={card.title || "Cloud card"}
              loading="lazy"
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
      </CardGrid>

      <CloseFab
        onClose={onClose}
        aria-label="close cloud deck"
        data-testid="close-cloud-deck-btn"
      />

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        entityType="card"
        shareUrl={shareUrl}
        shareMode={shareMode}
        hasExistingShare={Boolean(selectedCard?.share_slug)}
        onShareModeChange={setShareMode}
        onShare={handleShare}
        onUnshare={handleUnshare}
        onCopyLink={() => showSnackbar("Link copied to clipboard", "success")}
      />
      <AddToDeckPopover
        open={Boolean(addDeckCardId)}
        anchorEl={null}
        cardId={addDeckCardId || ""}
        onClose={() => {
          setAddDeckCardId(null);
        }}
      />
    </FullScreenOverlay>
  );
}
