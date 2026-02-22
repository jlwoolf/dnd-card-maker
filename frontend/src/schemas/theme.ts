import z from "zod";

/**
 * Zod schema for the preview card theme colors.
 * Defines the comprehensive visual palette used by the Preview components to ensure
 * consistency across the card body and specialized text containers.
 */
export const PreviewThemeSchema = z.object({
  /** Primary background color of the main card body */
  fill: z.string(),
  /** Background color specifically for text elements using the 'banner' variant */
  bannerFill: z.string(),
  /** Background color specifically for text elements using the 'box' variant */
  boxFill: z.string(),
  /** Border and outline color for the card and its internal container frames */
  stroke: z.string(),
  /** Typography color for content inside 'banner' text containers */
  bannerText: z.string(),
  /** Typography color for content inside 'box' text containers */
  boxText: z.string(),
});

/**
 * TypeScript type inferred from the PreviewThemeSchema.
 */
export type PreviewTheme = z.infer<typeof PreviewThemeSchema>;

/**
 * System-wide default theme colors. Used when initializing new cards
 * or when the user triggers a 'Reset to Default' action in the editor.
 */
export const DEFAULT_THEME: PreviewTheme = {
  /** Dark forest green */
  fill: "#48534b",
  /** Light muted grey */
  bannerFill: "#c1b8b9",
  /** Near-white parchment */
  boxFill: "#e6e5e3",
  /** Dark charcoal */
  stroke: "#3b3939",
  /** Black */
  bannerText: "#000000",
  /** Black */
  boxText: "#000000",
};
