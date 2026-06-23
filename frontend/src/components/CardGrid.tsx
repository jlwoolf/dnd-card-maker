import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

interface CardGridProps {
  /** Card elements rendered inside the grid. */
  children: ReactNode;
  /** Additional styles to merge with the grid container. */
  sx?: SxProps<Theme>;
  /** Test identifier for the grid container. */
  "data-testid"?: string;
}

/** Responsive CSS-grid container for card thumbnails.

  Used by DeckView, CloudDeckView, ExportModal, and CloudDeckPreview.
  Replaces 4 duplications of the same grid layout with
  ``gridTemplateColumns: "repeat(auto-fill, minmax(...))"``.
*/
export default function CardGrid({ children, sx, "data-testid": dataTestid }: CardGridProps) {
  return (
    <Box
      data-testid={dataTestid}
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
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
