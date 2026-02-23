import { type Descendant } from "slate";
import { type ReactEditor } from "slate-react";
import z from "zod";

/**
 * Represents a rich-text block element in the Slate.js editor.
 */
export type CustomElement = {
  /** The type of block element, currently only supports 'paragraph' */
  type: "paragraph";
  /** Horizontal text alignment within the block */
  align?: "left" | "center" | "right";
  /** Line height percentage for the text in this block */
  lineHeight?: number;
  /** Nested text or element nodes */
  children: CustomText[];
};

/**
 * Represents a styled text leaf node in the Slate.js editor.
 */
export type CustomText = {
  /** The raw string content */
  text: string;
  /** Whether the text is bolded */
  bold?: boolean;
  /** Whether the text is italicized */
  italic?: boolean;
  /** The font size in pixels */
  fontSize?: number;
};

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

/**
 * Zod schema for text element values, including rich-text content and display variants.
 */
export const TextElementSchema = z.object({
  /** Slate.js rich-text data represented as a list of Descendant nodes */
  value: z.any().default([
    {
      type: "paragraph",
      children: [{ text: "" }],
    },
  ] as Descendant[]),
  /** Visual container style used in the preview (e.g., a banner or a simple box) */
  variant: z.enum(["banner", "box"]).default("banner"),
  /** Whether the element should expand vertically to fill available flex space */
  expand: z.boolean().default(false),
  /** Display width of the text container as a percentage of the card width */
  width: z.number().min(50).max(100).default(100),
});

/**
 * TypeScript type inferred from the TextElementSchema.
 */
export type TextElementSchema = z.infer<typeof TextElementSchema>;

/**
 * Zod schema for image element values.
 */
export const ImageElementSchema = z.object({
  /** Border radius of the image in pixels */
  radius: z.number().min(0).max(10).default(4),
  /** Source URL or data URL of the image */
  src: z.string().default(""),
  /** Display width of the image as a percentage of the container width */
  width: z.number().min(50).max(100).default(100),
});

/**
 * TypeScript type inferred from the ImageElementSchema.
 */
export type ImageElementSchema = z.infer<typeof ImageElementSchema>;

/**
 * Zod schema for a card element, including its unique ID, layout style,
 * and a discriminated union for its type-specific values (text or image).
 */
export const ElementSchema = z
  .object({
    /** Unique identifier for the element */
    id: z.string(),
    /** Common layout styles shared by all element types */
    style: z
      .object({
        /** If true, the element will attempt to grow to fill available flex space */
        grow: z.boolean().default(false),
        /** Vertical alignment within its flex container */
        align: z.enum(["start", "center", "end"]).default("center"),
      })
      .default({
        grow: false,
        align: "center",
      }),
  })
  .and(
    z.discriminatedUnion("type", [
      z.object({
        /** Text-specific element type */
        type: z.literal("text"),
        /** Properties and content for the text element */
        value: TextElementSchema,
      }),
      z.object({
        /** Image-specific element type */
        type: z.literal("image"),
        /** Properties and content for the image element */
        value: ImageElementSchema,
      }),
    ]),
  );

/**
 * TypeScript type inferred from the ElementSchema.
 */
export type Element = z.infer<typeof ElementSchema>;

/**
 * Helper type to extract the specific value structure for a given element type.
 */
export type ElementValue<T extends Element["type"]> = Extract<
  Element,
  { type: T }
>["value"];
