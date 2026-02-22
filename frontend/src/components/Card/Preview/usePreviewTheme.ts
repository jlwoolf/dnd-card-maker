import { create } from "zustand";
import { DEFAULT_THEME, type PreviewTheme } from "@src/schemas";

/**
 * usePreviewTheme is a global Zustand store that manages the active visual 
 * theme of the card editor. It allows for atomic updates to any theme property.
 */
export const usePreviewTheme = create<
  PreviewTheme & {
    /** Updates the current theme with partial data */
    setTheme: (theme: Partial<PreviewTheme>) => void;
  }
>((set) => ({
  ...DEFAULT_THEME,
  setTheme: (theme) => set((state) => ({ ...state, ...theme })),
}));
