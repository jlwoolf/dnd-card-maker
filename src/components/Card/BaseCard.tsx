import { Box, Paper, type PaperProps, type Theme } from "@mui/material";
import { mergeSx } from "../../utils/mergeSx";

const BASE_STYLES = (theme: Theme) => ({
  "&:has(~ .card-menu)": {
    borderBottomLeftRadius: "0px",
    borderBottomRightRadius: "0px",
  },

  aspectRatio: "5/7",
  overflow: "hidden",
  padding: theme.spacing(1),
});

export default function BaseCard({ children, sx }: PaperProps) {
  return (
    <Paper
      id="base-card-paper-container"
      sx={mergeSx(BASE_STYLES, sx)}
      elevation={4}
    >
      <Box
        sx={(theme) => ({
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flexGrow: 1,
          width: "100%",
          height: "100%",
          overflowY: "auto",
          gap: theme.spacing(1),
        })}
      >
        {children}
      </Box>
    </Paper>
  );
}
