import z from "zod";
import { create } from "zustand";

/**
 * Zod schema for the preview card theme colors.
 */
export const PreviewThemeSchema = z.object({
  /** Primary background color of the card */
  fill: z.string(),
  /** Background color for banner text elements */
  bannerFill: z.string(),
  /** Background color for box text elements */
  boxFill: z.string(),
  /** Stroke/border color for card and elements */
  stroke: z.string(),
  /** Text color for banner elements */
  bannerText: z.string(),
  /** Text color for box elements */
  boxText: z.string(),
});

export type PreviewTheme = z.infer<typeof PreviewThemeSchema>;

export const DEFAULT_THEME: PreviewTheme = {
  fill: "#48534b",
  bannerFill: "#c1b8b9",
  boxFill: "#e6e5e3",
  stroke: "#3b3939",
  bannerText: "#000000",
  boxText: "#000000",
};

/**
 * usePreviewTheme is a Zustand store that manages the current visual theme of the preview card.
 */
export const usePreviewTheme = create<
  PreviewTheme & {
    /** Updates the current theme */
    setTheme: (theme: Partial<PreviewTheme>) => void;
  }
>((set) => ({
  ...DEFAULT_THEME,
  setTheme: (theme) => set((state) => ({ ...state, ...theme })),
}));
