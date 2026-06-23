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
import { sharedDeckApi, type SharedDeckCardEntry, type SharedDeckData } from "@src/services/api";
import ProgressiveCardImage from "@src/components/Cloud/ProgressiveCardImage";
import useExportCards from "@src/stores/useExportCards";
import { useSnackbar } from "@src/stores/useSnackbar";
import { themeFromSnake } from "@src/utils/themeHelpers";
import { getCardImageUrl } from "@src/utils/cardImageUrl";
import { CONTENT_MIN_HEIGHT } from "@src/theme/constants";

export default function SharedDeckPage() {
  const { shareSlug } = useParams<{ shareSlug: string }>();
  const [deck, setDeck] = useState<SharedDeckData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const addCard = useExportCards((s) => s.addCard);
  const showSnackbar = useSnackbar((s) => s.showSnackbar);

  useEffect(() => {
    if (!shareSlug) return;
    sharedDeckApi
      .get(shareSlug)
      .then((res) => setDeck(res.data))
      .catch((err) =>
        setError(err.response?.data?.detail || "Deck not found"),
      )
      .finally(() => setLoading(false));
  }, [shareSlug]);

  const handleCopyCard = async (card: SharedDeckCardEntry) => {
    let imgUrl = "";
    try {
      imgUrl = await ImageProcessor.toDataUrl(getCardImageUrl(card.id, 1.0));
    } catch {
      // Copy without image on failure
    }
    addCard(card.elements, imgUrl, themeFromSnake(card.theme));
    showSnackbar("Card copied to your deck!", "success");
  };

  const handleCopyAll = async () => {
    if (!deck) return;
    for (const card of deck.cards) {
      let imgUrl = "";
      try {
        imgUrl = await ImageProcessor.toDataUrl(getCardImageUrl(card.id, 1.0));
      } catch {
        // Continue without image on failure for this card
      }
      addCard(card.elements, imgUrl, themeFromSnake(card.theme));
    }
    showSnackbar(`Copied ${deck.cards.length} card(s) to your deck!`, "success");
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
            This shared deck link may be invalid or expired.
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!deck) return null;

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      minHeight={CONTENT_MIN_HEIGHT}
      p={3}
    >
      <Typography variant="h5" gutterBottom>
        {deck.title}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Shared Deck — {deck.mode === "view_and_copy" ? "View & Copy" : "View Only"}
        {" "}({deck.cards.length} card{deck.cards.length !== 1 ? "s" : ""})
      </Typography>

      {deck.can_copy && deck.cards.length > 0 && (
        <Button
          variant="contained"
          onClick={handleCopyAll}
          sx={{ mb: 3 }}
        >
          Copy All to My Deck
        </Button>
      )}

      {deck.cards.length === 0 ? (
        <Typography color="text.secondary">This deck is empty.</Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(auto-fill, minmax(180px, 1fr))",
              md: "repeat(auto-fill, minmax(220px, 1fr))",
            },
            gap: 3,
            width: "100%",
            maxWidth: 1200,
          }}
        >
          {deck.cards.map((card) => (
            <Box key={card.id}>
              <Box
                sx={{
                  position: "relative",
                  aspectRatio: "5/7",
                  borderRadius: 2,
                  overflow: "hidden",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                }}
              >
                <ProgressiveCardImage
                  cardId={card.id}
                  highResScale={0.6}
                  lowResScale={0.1}
                  alt={card.title || "Card"}
                  loading="lazy"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </Box>
              {card.title && (
                <Typography
                  variant="body2"
                  align="center"
                  sx={{ mt: 0.5, color: "text.secondary" }}
                >
                  {card.title}
                </Typography>
              )}
              {deck.can_copy && (
                <Box display="flex" justifyContent="center" mt={0.5}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleCopyCard(card)}
                  >
                    Copy
                  </Button>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
