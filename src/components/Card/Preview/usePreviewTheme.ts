import { create } from "zustand";

export const usePreviewTheme = create<{
  fill: string;
  stroke: string;
  bannerFill: string;
  boxFill: string;
}>(() => ({
  fill: "#48534b",
  bannerFill: "#c1b8b9",
  boxFill: "#e6e5e3",
  stroke: "#3b3939",
}));
