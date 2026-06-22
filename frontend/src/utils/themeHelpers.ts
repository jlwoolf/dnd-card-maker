import type { PreviewTheme } from "@src/schemas";

export function themeFromSnake(theme: Record<string, string>): PreviewTheme {
  return {
    fill: theme.fill,
    bannerFill: theme.banner_fill,
    boxFill: theme.box_fill,
    stroke: theme.stroke,
    bannerText: theme.banner_text,
    boxText: theme.box_text,
  };
}

export function themeToSnake(theme: PreviewTheme): Record<string, string> {
  return {
    fill: theme.fill,
    banner_fill: theme.bannerFill,
    box_fill: theme.boxFill,
    stroke: theme.stroke,
    banner_text: theme.bannerText,
    box_text: theme.boxText,
  };
}
