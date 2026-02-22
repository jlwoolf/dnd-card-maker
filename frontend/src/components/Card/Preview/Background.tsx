import React, { forwardRef } from "react";
import { Box, Paper, styled } from "@mui/material";
import { useActiveCardStore } from "@src/stores/useActiveCardStore";

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
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "transparent",
  boxShadow: "none",
  aspectRatio: "5/7",
  borderRadius: 20,
  overflow: "hidden",
}));

interface BackgroundProps {
  children: React.ReactNode;
}

/**
 * Background renders the high-fidelity SVG container for the preview card.
 * It uses the active preview theme to render a stylized card frame with 
 * customizable fill and stroke.
 */
const Background = forwardRef<HTMLDivElement, BackgroundProps>(
  ({ children }: BackgroundProps, ref) => {
    const theme = useActiveCardStore((state) => state.theme);

    return (
      <StyledPaper
        ref={ref}
        style={
          {
            "--card-fill": theme.fill,
            "--card-stroke": theme.stroke,
            "--banner-fill": theme.bannerFill,
            "--banner-text": theme.bannerText,
            "--box-fill": theme.boxFill,
            "--box-text": theme.boxText,
          } as React.CSSProperties
        }
      >
        {/* Render the card frame using SVG for crisp vector scaling */}
        <SvgBackground viewBox={`0 0 500 700`} preserveAspectRatio="none">
          <g>
            <rect
              width={500}
              height={700}
              fill="var(--card-fill)"
              vectorEffect="non-scaling-stroke"
            />
            <rect
              width={500}
              height={700}
              rx={32}
              fill="var(--card-fill)"
              stroke="var(--card-stroke)"
              strokeWidth={16}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        </SvgBackground>

        <Box
          sx={{
            position: "relative",
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

Background.displayName = "Background";

export default Background;
