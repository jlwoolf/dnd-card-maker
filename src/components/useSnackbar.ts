import { create } from "zustand";
import { type AlertColor } from "@mui/material";

interface SnackbarState {
  open: boolean;
  message: string;
  severity: AlertColor;
  showSnackbar: (message: string, severity?: AlertColor) => void;
  closeSnackbar: () => void;
}

export const useSnackbar = create<SnackbarState>((set) => ({
  open: false,
  message: "",
  severity: "info",
  showSnackbar: (message, severity = "info") =>
    set({ open: true, message, severity }),
  closeSnackbar: () => set({ open: false }),
}));
