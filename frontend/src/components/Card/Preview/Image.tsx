import React from "react";
import { Box, styled } from "@mui/material";
import { usePreviewTheme } from "./usePreviewTheme";

interface ImageProps {
  /** The image content to display */
  children?: React.ReactNode;
  /** Border radius in pixels */
  radius?: number;
  /** Width as a percentage of the card container */
  width?: number;
}

const SvgBackground = styled("svg")({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  zIndex: 0,
  overflow: "visible",
});

/**
 * Image component for the preview card. 
 * Renders an image within a stylized vector frame that matches the card's theme.
 */
const Image = ({ children, radius = 0, width = 100 }: ImageProps) => {
  const { fill, stroke } = usePreviewTheme();

  return (
    <Box display="flex" justifyContent="center">
      <Box
        sx={{
          position: "relative",
          display: "inline-flex",
          justifyContent: "center",
          alignItems: "center",
          width: `calc(${width}% - 4px)`,
          minHeight: "50px",
        }}
      >
        {/* Background frame with theme-consistent stroke and fill */}
        <SvgBackground preserveAspectRatio="none">
          <rect
            rx={`${radius * 4}px`}
            style={{ width: "100%", height: "100%" }}
            fill={fill}
            stroke={stroke}
            strokeWidth={4}
            vectorEffect="non-scaling-stroke"
          />
        </SvgBackground>

        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            margin: "2px",
            borderRadius: `${radius * 3.8}px`,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Image;
