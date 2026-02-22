import React from "react";
import { Box as MuiBox, styled } from "@mui/material";
import { usePreviewTheme } from "./usePreviewTheme";

interface TextProps {
  /** The text or rich-text nodes to render */
  children?: React.ReactNode;
  /** Visual container style (Banner or Box) */
  variant?: "banner" | "box";
  /** Whether the element should expand vertically */
  expand?: boolean;
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
 * Renders a rectangular box container for preview text.
 * 
 * @param props - TextProps for children and styling.
 */
const BoxVariant = ({ children }: TextProps) => {
  const { boxFill, fill, stroke, boxText } = usePreviewTheme();

  return (
    <>
      <SvgBackground viewBox={`0 0 500 500`} preserveAspectRatio="none">
        <rect
          width={500}
          height={500}
          fill={boxFill ?? fill}
          stroke={stroke}
          strokeWidth={4}
          vectorEffect="non-scaling-stroke"
        />
      </SvgBackground>
      <MuiBox style={{ position: "relative", color: boxText }}>
        {children}
      </MuiBox>
    </>
  );
};

/**
 * Renders a stylized banner container with curved edges for preview text.
 * 
 * @param props - TextProps for children and styling.
 */
const BannerVariant = ({ children }: TextProps) => {
  const { bannerFill, fill, stroke, bannerText } = usePreviewTheme();

  return (
    <>
      <svg
        viewBox="0 0 175 24.5"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          overflow: "visible",
        }}
      >
        <g transform="translate(0, -0.5)">
          <path
            d="M 5.23,0.78 C 5.23,0.78 0.82,1.4 0.78,12.63 0.74,23.86 5.23,24.74 5.23,24.74 h 82.23 82.23 c 0,0 4.49,-0.87 4.45,-12.11 -0.04,-11.23 -4.45,-11.86 -4.45,-11.86 h -82.23 z"
            fill={bannerFill ?? fill}
            stroke={stroke}
            strokeWidth={4}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      </svg>
      <MuiBox
        sx={{ position: "relative", padding: "0px 8px", color: bannerText }}
      >
        {children}
      </MuiBox>
    </>
  );
};

/**
 * Text component for the preview card. 
 * Handles different background variants (Banner, Box) and applies 
 * theme-consistent typography colors.
 */
export default function Text({
  width = 100,
  variant,
  expand,
  ...props
}: TextProps) {
  return (
    <MuiBox
      sx={{
        position: "relative",
        display: "inline-block",
        padding: "8px 8px",
        width: `calc(${width}%)`,
        height: expand ? "100%" : undefined,
        margin: `0px calc((100% - ${width}%) / 2)`,
        boxSizing: "border-box",
      }}
    >
      {variant === "banner" ? (
        <BannerVariant {...props} />
      ) : (
        <BoxVariant {...props} />
      )}
    </MuiBox>
  );
}
