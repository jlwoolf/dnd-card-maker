import { Box, Fab } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface CloseFabProps {
  /** Called when the close button is pressed. */
  onClose: () => void;
  /** Accessible label for the close button. */
  "aria-label"?: string;
  /** Test identifier for the close button. */
  "data-testid"?: string;
}

/** Floating close button rendered at the bottom centre of a full-screen overlay.

  Used by DeckView, CloudDeckView, CloudDeckListView, and CloudDeckPreview.
  Replaces 4 duplications of the identical Fab styling.
*/
export default function CloseFab({
  onClose,
  "aria-label": ariaLabel,
  "data-testid": dataTestid,
}: CloseFabProps) {
  return (
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
        aria-label={ariaLabel}
        data-testid={dataTestid}
        sx={{
          boxShadow: 4,
          "&:hover": { transform: "scale(1.1)" },
          transition: "transform 0.2s",
          width: { xs: "56px", md: "80px" },
          height: { xs: "56px", md: "80px" },
        }}
      >
        <CloseIcon />
      </Fab>
    </Box>
  );
}
