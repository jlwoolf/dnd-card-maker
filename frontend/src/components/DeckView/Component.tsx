import { Box, Typography, Fab } from "@mui/material";
import { Close } from "@mui/icons-material";
import useExportCards from "../useExportCards";
import CardButtons from "../Deck/CardButtons";

interface DeckViewProps {
  /** Callback to close the deck view and return to the editor */
  onClose: () => void;
}

/**
 * DeckView renders a full-screen scrollable grid of all cards in the deck.
 */
export default function DeckView({ onClose }: DeckViewProps) {
  const cards = useExportCards((state) => state.cards);

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100dvh", // Use dynamic viewport height for mobile
        bgcolor: "grey.900",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Grid Container */}
      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0,
          overflowY: "auto",
          p: 3,
          pb: 12,
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(auto-fill, minmax(100px, 1fr))",
            sm: "repeat(auto-fill, minmax(150px, 1fr))",
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
              color: "text.secondary",
            }}
          >
            <Typography variant="h6" color="grey.300">
              Your deck is empty. Create some cards first!
            </Typography>
          </Box>
        ) : (
          cards.map((card) => (
            <Box
              key={card.id}
              sx={{
                position: "relative",
                aspectRatio: "5/7",
                borderRadius: 2,
                overflow: "hidden",
                boxShadow: 3,
                border: "1px solid",
                borderColor: "divider",
                transition:
                  "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 6,
                  "& .card-actions": {
                    opacity: 1,
                  },
                },
              }}
            >
              <img
                src={card.imgUrl}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />

              {/* Overlay Actions */}
              <Box
                className="card-actions"
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
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    p: 1,
                    borderRadius: 1,
                    bgcolor: "background.paper",
                    boxShadow: 2,
                  }}
                >
                  <CardButtons card={card} onEdit={onClose} onCopy={onClose} />
                </Box>
              </Box>
            </Box>
          ))
        )}
      </Box>

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
