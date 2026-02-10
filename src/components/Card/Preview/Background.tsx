import React, { forwardRef } from "react";
import { Paper, Box, styled } from "@mui/material";
import { usePreviewTheme } from "./usePreviewTheme";

const SvgBackground = styled("svg")({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  zIndex: 0,
  overflow: "visible",
});

const StyledPaper = styled(Paper)(() => ({
  position: "relative",
  justifyContent: "center", // Horizontal center
  alignItems: "center", // Vertical center
  backgroundColor: "transparent", // Let the SVG handle the background
  boxShadow: "none", // Disable default elevation if using the SVG shadow
  aspectRatio: "5/7",
  borderRadius: 20,
  overflow: "hidden",
}));

interface BackgroundProps {
  children: React.ReactNode;
}

const Background = forwardRef<HTMLDivElement, BackgroundProps>(
  ({ children }: BackgroundProps, ref) => {
    const { fill, stroke } = usePreviewTheme();

    return (
      <StyledPaper ref={ref}>
        {/* The SVG Layer */}
        <SvgBackground viewBox={`0 0 500 700`} preserveAspectRatio="none">
          <g>
            {/* Bottom Shadow Rectangle */}
            <rect
              width={500}
              height={700}
              fill={fill}
              vectorEffect="non-scaling-stroke"
            />
            {/* Top Main Rectangle */}
            <rect
              width={500}
              height={700}
              rx={32}
              fill={fill}
              stroke={stroke}
              strokeWidth={16}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        </SvgBackground>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flexGrow: 1,
            width: "calc(100% - 32px)",
            height: "calc(100% - 32px)",
            padding: "16px",
            overflowY: "visible",
          }}
        >
          {children}
        </Box>
      </StyledPaper>
    );
  },
);

export default Background;
