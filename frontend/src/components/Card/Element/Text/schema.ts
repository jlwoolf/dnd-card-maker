import { type BaseEditor, type Descendant } from "slate";
import { ReactEditor } from "slate-react";
import z from "zod";

export type CustomElement = {
  type: "paragraph";
  align?: "left" | "center" | "right";
  lineHeight?: number;
  children: CustomText[];
};

export type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
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
  /** Slate.js rich-text data */
  value: z.any().default([
    {
      type: "paragraph",
      children: [{ text: "" }],
    },
  ] as Descendant[]),
  /** Visual container style */
  variant: z.enum(["banner", "box"]).default("banner"),
  /** Whether the element should expand vertically to fill available space */
  expand: z.boolean().default(false),
  /** Display width percentage */
  width: z.number().min(50).max(100).default(100),
});

export type TextElementSchema = z.infer<typeof TextElementSchema>;
