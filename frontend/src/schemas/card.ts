import z from "zod";
import { ElementSchema } from "./elements";
import { PreviewThemeSchema } from "./theme";

/**
 * Zod schema for a complete card object.
 * This represents the persistence format for individual cards within a deck,
 * including its structural elements, rendered preview, and visual theme.
 */
export const CardSchema = z.object({
  /** Array of structural elements (text, images) that make up the card content */
  elements: z.array(ElementSchema),
  /** 
   * A PNG image encoded as a base64 Data URL. 
   * This provides a static visual representation of the card for use in the deck stack and exports.
   */
  imgUrl: z.string(),
  /** 
   * Unique identifier for the card. 
   * Used for state management, reordering, and direct card manipulation.
   */
  id: z.string(),
  /** The color palette and visual styling configuration active for this card */
  theme: PreviewThemeSchema,
});

/**
 * TypeScript type inferred from the CardSchema.
 */
export type Card = z.infer<typeof CardSchema>;
