import { Alert, Snackbar, useMediaQuery, useTheme } from "@mui/material";
import { useSnackbar } from "./useSnackbar";

/**
 * GlobalSnackbar provides a system-wide notification overlay using MUI Snackbar and Alert.
 * It automatically adjusts its position based on the screen size (top-center for mobile, 
 * bottom-left for desktop) and integrates with a global Zustand store for state management.
 */
export default function GlobalSnackbar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { open, message, severity, closeSnackbar } = useSnackbar();

  /**
   * Handles the closing of the snackbar.
   * 
   * @param _event - The trigger event.
   * @param reason - The reason why the snackbar is closing.
   */
  const handleClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === "clickaway") return;
    closeSnackbar();
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={handleClose}
      anchorOrigin={{
        vertical: isMobile ? "top" : "bottom",
        horizontal: isMobile ? "center" : "left",
      }}
    >
      <Alert
        onClose={handleClose}
        severity={severity}
        variant="filled"
        sx={{ width: "100%" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
