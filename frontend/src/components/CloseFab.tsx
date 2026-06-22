import { Fab } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface CloseFabProps {
  /** Called when the close button is pressed. */
  onClose: () => void;
}

/** Floating close button rendered at the bottom centre of a full-screen overlay.

  Used by DeckView, CloudDeckView, CloudDeckListView, and CloudDeckPreview.
  Replaces 4 duplications of the identical Fab styling.
*/
export default function CloseFab({ onClose }: CloseFabProps) {
  return (
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
      <CloseIcon />
    </Fab>
  );
}
