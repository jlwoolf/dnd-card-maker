import z from "zod";
import { type BaseEditor, type Descendant } from "slate";
import { ReactEditor } from "slate-react";

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

export const TextElementSchema = z.object({
  value: z.any().default([
    {
      type: "paragraph",
      children: [{ text: "" }],
    },
  ] as Descendant[]),
  variant: z.enum(["banner", "box"]).default("banner"),
  expand: z.boolean().default(false),
  width: z.number().min(50).max(100).default(100),
});

export type TextElementSchema = z.infer<typeof TextElementSchema>;
