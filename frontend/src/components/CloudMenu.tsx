import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cloud, Link as LinkIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Snackbar,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { ImageProcessor } from "@src/services/ImageProcessor";
import { cardApi, type CloudCardSummary } from "@src/services/api";
import { useActiveCardStore } from "@src/stores/useActiveCardStore";
import { useAuthStore } from "@src/stores/useAuthStore";
import ControlButton from "./Deck/ControlButton";
import Tooltip from "./Tooltip";
import { useSharedElement } from "./Card/ElementRefContext";
import useExportCards from "./useExportCards";
import { useSnackbar } from "./useSnackbar";

function themeToSnake(theme: Record<string, string>) {
  return {
    fill: theme.fill,
    banner_fill: theme.bannerFill,
    box_fill: theme.boxFill,
    stroke: theme.stroke,
    banner_text: theme.bannerText,
    box_text: theme.boxText,
  };
}

function themeFromSnake(theme: Record<string, string>) {
  return {
    fill: theme.fill || theme.banner_fill,
    bannerFill: theme.banner_fill || theme.fill,
    boxFill: theme.box_fill || theme.fill,
    stroke: theme.stroke,
    bannerText: theme.banner_text || theme.fill,
    boxText: theme.box_text || theme.fill,
  };
}

export default function CloudMenu() {
  const navigate = useNavigate();
  const { element } = useSharedElement();
  const { elements, theme } = useActiveCardStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addCard = useExportCards((s) => s.addCard);
  const loadCard = useActiveCardStore((s) => s.loadCard);
  const showSnackbar = useSnackbar((s) => s.showSnackbar);

  const [open, setOpen] = useState(false);
  const [cloudCards, setCloudCards] = useState<CloudCardSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shareMode, setShareMode] = useState<"view_only" | "view_and_copy">("view_and_copy");
  const [shareSlug, setShareSlug] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [copyFeedback, setCopyFeedback] = useState(false);

  const refreshList = useCallback(async () => {
    try {
      const res = await cardApi.list();
      setCloudCards(res.data);
    } catch {
      setError("Failed to load cloud cards");
    }
  }, []);

  const handleOpen = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setOpen(true);
    setError("");
    await refreshList();
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      const imgUrl = await ImageProcessor.captureElement(element, {
        onError: () => {
          throw new Error("Failed to generate preview image");
        },
      });
      if (!imgUrl) {
        setError("Failed to capture card preview");
        setLoading(false);
        return;
      }
      await cardApi.create({
        elements: elements as unknown[],
        img_url: imgUrl,
        theme: themeToSnake(theme),
      });
      await refreshList();
      showSnackbar("Card saved to cloud", "success");
    } catch {
      setError("Failed to save card to cloud");
    }
    setLoading(false);
  };

  const handleLoad = async (id: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await cardApi.get(id);
      loadCard({
        elements: res.data.elements as never,
        theme: themeFromSnake(res.data.theme),
        id: res.data.id,
      });
      showSnackbar("Card loaded from cloud", "success");
      setOpen(false);
    } catch {
      setError("Failed to load card from cloud");
    }
    setLoading(false);
  };

  const handleCopyToDeck = async (id: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await cardApi.get(id);
      addCard(
        res.data.elements as never,
        res.data.img_url,
        themeFromSnake(res.data.theme),
      );
      showSnackbar("Card copied to local deck", "success");
    } catch {
      setError("Failed to copy card");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    setError("");
    try {
      await cardApi.delete(id);
      await refreshList();
      showSnackbar("Card deleted from cloud", "success");
    } catch {
      setError("Failed to delete card");
    }
    setLoading(false);
  };

  const handleShare = async (id: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await cardApi.share(id, shareMode);
      const slug = res.data.share_slug;
      setShareSlug(slug || "");
      const url = `${window.location.origin}${import.meta.env.BASE_URL}share/${slug}`;
      setShareUrl(url);
      await refreshList();
    } catch {
      setError("Failed to share card");
    }
    setLoading(false);
  };

  const handleUnshare = async (id: string) => {
    setLoading(true);
    setError("");
    try {
      await cardApi.unshare(id);
      setShareSlug("");
      setShareUrl("");
      await refreshList();
      showSnackbar("Share link removed", "success");
    } catch {
      setError("Failed to unshare card");
    }
    setLoading(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyFeedback(true);
    } catch {
      showSnackbar("Failed to copy link", "error");
    }
  };

  return (
    <>
      <Tooltip title="Cloud">
        <ControlButton
          onClick={handleOpen}
          label="Cloud save/load"
          icon={<Cloud />}
          data-testid="cloud-menu-btn"
        />
      </Tooltip>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        data-testid="cloud-menu-dialog"
      >
        <DialogTitle>Cloud Cards</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading}
              fullWidth
              data-testid="cloud-save-btn"
            >
              Save Current Card to Cloud
            </Button>
          </Box>

          {shareSlug && (
            <Box sx={{ mb: 2, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Share Link
              </Typography>
              <Box display="flex" gap={1} alignItems="center">
                <TextField
                  size="small"
                  fullWidth
                  value={shareUrl}
                  InputProps={{ readOnly: true }}
                  data-testid="share-url-field"
                />
                <IconButton onClick={handleCopyLink} size="small" aria-label="Copy share link">
                  <LinkIcon />
                </IconButton>
              </Box>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            My Cloud Cards ({cloudCards.length})
          </Typography>

          {cloudCards.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
              No cards saved to cloud yet.
            </Typography>
          )}

          <List dense>
            {cloudCards.map((card) => (
              <ListItem
                key={card.id}
                disablePadding
                secondaryAction={
                  <Box display="flex" gap={0.5}>
                    {card.share_slug ? (
                      <>
                        <Button
                          size="small"
                          onClick={() => handleUnshare(card.id)}
                          disabled={loading}
                        >
                          Unshare
                        </Button>
                        <ToggleButtonGroup
                          size="small"
                          value={shareMode}
                          exclusive
                          onChange={(_, val) => val && setShareMode(val)}
                          sx={{ height: 30 }}
                        >
                          <ToggleButton value="view_only" sx={{ fontSize: 11, px: 1 }}>
                            View
                          </ToggleButton>
                          <ToggleButton value="view_and_copy" sx={{ fontSize: 11, px: 1 }}>
                            Copy
                          </ToggleButton>
                        </ToggleButtonGroup>
                      </>
                    ) : (
                      <Button
                        size="small"
                        onClick={() => handleShare(card.id)}
                        disabled={loading}
                      >
                        Share
                      </Button>
                    )}
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDelete(card.id)}
                      disabled={loading}
                    >
                      Delete
                    </Button>
                  </Box>
                }
              >
                <ListItemButton onClick={() => handleLoad(card.id)}>
                  <ListItemText
                    primary={card.title || "Untitled"}
                    secondary={
                      card.share_slug ? `Shared (${card.share_mode})` : "Private"
                    }
                  />
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyToDeck(card.id);
                    }}
                    disabled={loading}
                    sx={{ mr: 1 }}
                  >
                    Copy
                  </Button>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
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
