import { Box } from "@mui/material";
import { Image as PreviewImage } from "../../Preview";

interface ImagePreviewProps {
  /** The source URL or data URL of the image */
  src: string;
  /** The border radius of the image in pixels */
  radius: number;
  /** The width of the image as a percentage of its container */
  width: number;
  /** Unique identifier for the element */
  id: string;
}

/**
 * ImagePreview handles the rendering of image content within the card preview.
 */
export default function ImagePreview({
  src,
  radius,
  width,
  id,
}: ImagePreviewProps) {
  return (
    <PreviewImage radius={radius} width={width}>
      <Box
        component="img"
        src={src || "https://placehold.co/600x400"}
        alt={id}
        sx={{
          width: `100%`,
          display: "block",
          objectFit: "cover",
          transition: "all 0.2s ease-in-out",
        }}
      />
    </PreviewImage>
  );
}
