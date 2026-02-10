import z from "zod";
import { create } from "zustand";

export const PreviewThemeSchema = z.object({
  fill: z.string(),
  bannerFill: z.string(),
  boxFill: z.string(),
  stroke: z.string(),
  bannerText: z.string(),
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

export const usePreviewTheme = create<
  PreviewTheme & {
    setTheme: (theme: Partial<Omit<PreviewTheme, "setTheme">>) => void;
  }
>((set) => ({
  ...DEFAULT_THEME,
  setTheme: (theme) => set((state) => ({ ...state, ...theme })),
}));
