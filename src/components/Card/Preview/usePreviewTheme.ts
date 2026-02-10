import { create } from "zustand";

interface PreviewTheme {
  fill: string;
  stroke: string;
  bannerFill: string;
  bannerText: string;
  boxFill: string;
  boxText: string;
  setTheme: (theme: Partial<Omit<PreviewTheme, "setTheme">>) => void;
}

export const DEFAULT_THEME = {
  fill: "#48534b",
  bannerFill: "#c1b8b9",
  boxFill: "#e6e5e3",
  stroke: "#3b3939",
  bannerText: "#000000",
  boxText: "#000000",
};

export const usePreviewTheme = create<PreviewTheme>((set) => ({
  ...DEFAULT_THEME,
  setTheme: (theme) => set((state) => ({ ...state, ...theme })),
}));
