import { Alert, Snackbar, useMediaQuery, useTheme } from "@mui/material";
import { useSnackbar } from "./useSnackbar";

export default function GlobalSnackbar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { open, message, severity, closeSnackbar } = useSnackbar();

  const handleClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === "clickaway") {
      return;
    }
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
