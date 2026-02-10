import z from "zod";

export const TextElementSchema = z.object({
  value: z.string().default(""),
  variant: z.enum(["banner", "box"]).default("banner"),
  size: z.int().default(16),
  bold: z.boolean().default(false),
  italic: z.boolean().default(false),
  alignment: z.enum(["left", "center", "right"]).default("center"),
  expand: z.boolean().default(false),
  width: z.number().min(50).max(100).default(100),
});

export type TextElementSchema = z.infer<typeof TextElementSchema>;
