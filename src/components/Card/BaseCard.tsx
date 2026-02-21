import { Box, Paper, type PaperProps } from "@mui/material";
import classNames from "classnames";
import { mergeSx } from "@src/utils/mergeSx";

/**
 * BaseCard provides the foundational structure and styling for all card containers.
 * It maintains a consistent 5:7 aspect ratio and handles rounding logic based on
 * proximity to other menu components.
 *
 * @param props - Standard MUI PaperProps
 */
export default function BaseCard({ children, sx, className }: PaperProps) {
  return (
    <Paper
      className={classNames(className, "base-card")}
      id="base-card-paper-container"
      sx={mergeSx(
        {
          padding: 1,
          aspectRatio: "5/7",
          overflow: "hidden",

          ".card-menu + &": {
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
          },

          "&:has(+ .card-menu)": {
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          },
        },
        sx,
      )}
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
