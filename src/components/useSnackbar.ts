import { create } from "zustand";
import { type AlertColor } from "@mui/material";

interface SnackbarState {
  /** Whether the snackbar is currently open */
  open: boolean;
  /** Notification message content */
  message: string;
  /** Visual severity level */
  severity: AlertColor;
  /** Shows the snackbar with the specified message and severity */
  showSnackbar: (message: string, severity?: AlertColor) => void;
  /** Closes the snackbar */
  closeSnackbar: () => void;
}

/**
 * useSnackbar is a global store for managing notification messages.
 */
export const useSnackbar = create<SnackbarState>((set) => ({
  open: false,
  message: "",
  severity: "info",
  showSnackbar: (message, severity = "info") =>
    set({ open: true, message, severity }),
  closeSnackbar: () => set({ open: false }),
}));
