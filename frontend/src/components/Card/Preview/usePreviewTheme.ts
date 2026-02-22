import z from "zod";
import { create } from "zustand";

/**
 * Zod schema for the preview card theme colors.
 * Defines the comprehensive visual palette used by the Preview components.
 */
export const PreviewThemeSchema = z.object({
  /** Primary background color of the card body */
  fill: z.string(),
  /** Background color specifically for banner text containers */
  bannerFill: z.string(),
  /** Background color specifically for rectangular box text containers */
  boxFill: z.string(),
  /** Border/stroke color for the card and nested element frames */
  stroke: z.string(),
  /** Text color applied to content within banners */
  bannerText: z.string(),
  /** Text color applied to content within boxes */
  boxText: z.string(),
});

export type PreviewTheme = z.infer<typeof PreviewThemeSchema>;

/**
 * System default theme colors used for new cards and reset operations.
 */
export const DEFAULT_THEME: PreviewTheme = {
  fill: "#48534b",
  bannerFill: "#c1b8b9",
  boxFill: "#e6e5e3",
  stroke: "#3b3939",
  bannerText: "#000000",
  boxText: "#000000",
};

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
