import z from "zod";

/**
 * Zod schema for image element values.
 */
export const ImageElementSchema = z.object({
  /** Border radius of the image in pixels */
  radius: z.number().min(0).max(10).default(4),
  /** Source URL or data URL of the image */
  src: z.string().default(""),
  /** Display width of the image as a percentage of the container */
  width: z.number().min(50).max(100).default(100),
});

export type ImageElementSchema = z.infer<typeof ImageElementSchema>;
