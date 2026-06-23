import { Alert, Snackbar } from "@mui/material";
import { useSnackbar } from "@src/stores/useSnackbar";

/**
 * GlobalSnackbar provides a system-wide notification overlay using MUI Snackbar and Alert.
 * It appears at the bottom center and integrates with a global Zustand store for state management.
 */
export default function GlobalSnackbar() {
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
      data-testid="global-snackbar"
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "center",
      }}
    >
      <Alert
        onClose={handleClose}
        severity={severity}
        variant="filled"
        sx={{ width: "100%" }}
        data-testid="global-snackbar-alert"
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
