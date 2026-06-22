import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import { ImageProcessor } from "@src/services/ImageProcessor";
import { sharedApi } from "@src/services/api";
import useExportCards from "@src/hooks/useExportCards";
import { useSnackbar } from "@src/hooks/useSnackbar";
import { themeFromSnake } from "@src/utils/themeHelpers";
import { CONTENT_MIN_HEIGHT } from "@src/theme/constants";
import type { SharedCard } from "@src/services/api";

export default function SharedCardPage() {
  const { shareSlug } = useParams<{ shareSlug: string }>();
  const [card, setCard] = useState<SharedCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const addCard = useExportCards((s) => s.addCard);
  const showSnackbar = useSnackbar((s) => s.showSnackbar);

  useEffect(() => {
    if (!shareSlug) return;
    sharedApi
      .get(shareSlug)
      .then((res) => setCard(res.data))
      .catch((err) =>
        setError(err.response?.data?.detail || "Card not found"),
      )
      .finally(() => setLoading(false));
  }, [shareSlug]);

  const handleCopyToDeck = async () => {
    if (!card) return;
    let imgUrl = card.img_url;
    if (imgUrl && !imgUrl.startsWith("data:")) {
      try {
        imgUrl = await ImageProcessor.toDataUrl(imgUrl);
      } catch {
        showSnackbar("Failed to copy card image", "error");
        return;
      }
    }
    addCard(card.elements, imgUrl, themeFromSnake(card.theme));
    showSnackbar("Card copied to your deck!", "success");
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={CONTENT_MIN_HEIGHT}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={CONTENT_MIN_HEIGHT}
      >
        <Box sx={{ width: 360, p: 3, textAlign: "center" }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Typography variant="body2" color="text.secondary">
            This shared card link may be invalid or expired.
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!card) return null;

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      minHeight={CONTENT_MIN_HEIGHT}
      p={3}
    >
      {card.title && (
        <Typography variant="h5" gutterBottom>
          {card.title}
        </Typography>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Shared Card — {card.mode === "view_and_copy" ? "View & Copy" : "View Only"}
      </Typography>

      <Box
        sx={{
          width: 300,
          height: 420,
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          mb: 3,
        }}
      >
        <img
          src={card.img_url}
          alt={card.title || "Shared card"}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </Box>

      {card.can_copy && (
        <Button variant="contained" onClick={handleCopyToDeck}>
          Copy to My Deck
        </Button>
      )}
    </Box>
  );
}
