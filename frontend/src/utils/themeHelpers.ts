import type { PreviewTheme } from "@src/schemas";
import type { SnakeTheme } from "@src/services/api";

/** Convert a theme object with snake_case keys (API format) to camelCase (Preview format). */
export function themeFromSnake(theme: SnakeTheme): PreviewTheme {
  return {
    fill: theme.fill,
    bannerFill: theme.banner_fill,
    boxFill: theme.box_fill,
    stroke: theme.stroke,
    bannerText: theme.banner_text,
    boxText: theme.box_text,
  };
}

/** Convert a PreviewTheme (camelCase) to snake_case for API requests. */
export function themeToSnake(theme: PreviewTheme): SnakeTheme {
  return {
    fill: theme.fill,
    banner_fill: theme.bannerFill,
    box_fill: theme.boxFill,
    stroke: theme.stroke,
    banner_text: theme.bannerText,
    box_text: theme.boxText,
  };
}
