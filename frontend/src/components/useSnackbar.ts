import { create } from "zustand";
import { type AlertColor } from "@mui/material";

interface SnackbarState {
  /** Whether the snackbar is currently open */
  open: boolean;
  /** Notification message content */
  message: string;
  /** Visual severity level (info, success, warning, error) */
  severity: AlertColor;
  /**
   * Shows the snackbar with a specific message and visual style.
   * 
   * @param message - The text to display.
   * @param severity - The MUI Alert severity level. Defaults to "info".
   */
  showSnackbar: (message: string, severity?: AlertColor) => void;
  /** Closes the snackbar and resets its state */
  closeSnackbar: () => void;
}

/**
 * useSnackbar is a global Zustand store for managing transient notification messages 
 * across the entire application. It centralizes the state for the GlobalSnackbar component.
 */
export const useSnackbar = create<SnackbarState>((set) => ({
  open: false,
  message: "",
  severity: "info",
  showSnackbar: (message, severity = "info") =>
    set({ open: true, message, severity }),
  closeSnackbar: () => set({ open: false }),
}));
