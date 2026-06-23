import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { Z_INDEX } from "@src/theme/constants";

interface FullScreenOverlayProps {
  /** Content rendered inside the overlay. */
  children: ReactNode;
  /** Additional styles applied to the outer container. */
  sx?: SxProps<Theme>;
  /** Override the default z-index. */
  zIndex?: number;
  /** Accessible label for the overlay container. */
  "aria-label"?: string;
  /** Test identifier for the overlay container. */
  "data-testid"?: string;
}

/** Full-screen fixed overlay used by DeckView, CloudDeckView,
 *  CloudDeckListView, and ExportModal.

    Replaces 4 duplications of the same ``position: fixed`` / ``100vw`` /
    ``100dvh`` / ``bgcolor: grey.900`` shell.
*/
export default function FullScreenOverlay({
  children,
  sx,
  zIndex,
  "aria-label": ariaLabel,
  "data-testid": dataTestid,
}: FullScreenOverlayProps) {
  return (
    <Box
      aria-label={ariaLabel}
      data-testid={dataTestid}
      role="dialog"
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100dvh",
        bgcolor: "grey.900",
        zIndex: zIndex ?? Z_INDEX.overlay,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
