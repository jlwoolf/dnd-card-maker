import z from "zod";

export const ImageElementSchema = z.object({
  radius: z.number().min(0).max(10).default(4),
  src: z.string().default(""),
  width: z.number().min(50).max(100).default(100),
});

export type ImageElementSchema = z.infer<typeof ImageElementSchema>;
