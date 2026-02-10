import type { Theme } from "@mui/material";

export const BUTTON_STYLES = (theme: Theme) => ({
  aspectRatio: "1/1",
  borderRadius: "100px",
  minWidth: 0,
  minHeight: 0,
  padding: "0px",
  width: theme.spacing(2),
  height: theme.spacing(3),
});

export const ICON_STYLES = (theme: Theme) => ({ width: theme.spacing(2) });

export const getToggleStyles = (toggle: boolean) =>
  toggle
    ? (theme: Theme) => ({
        backgroundColor: theme.palette.primary.dark,
        boxShadow: "inset 0px 2px 4px rgba(0, 0, 0, 0.2)",
      })
    : () => ({});
