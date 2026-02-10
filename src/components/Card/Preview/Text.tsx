import { Box as MuiBox, styled } from "@mui/material";
import { usePreviewTheme } from "./usePreviewTheme";

interface TextProps {
  children?: React.ReactNode;
  variant?: "banner" | "box";
  expand?: boolean;
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

const Box = ({ children }: TextProps) => {
  const { boxFill, fill, stroke } = usePreviewTheme();

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
      {/* Background SVG Layer */}

      {/* Foreground Text Layer */}
      <MuiBox style={{ position: "relative" }}>{children}</MuiBox>
    </>
  );
};

const Banner = ({ children }: TextProps) => {
  const { bannerFill, fill, stroke } = usePreviewTheme();

  return (
    <>
      {/* Background SVG Layer */}
      <svg
        viewBox="0 0 175 24.5"
        preserveAspectRatio="none" // Essential for stretching
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
            vectorEffect="non-scaling-stroke" // Prevents the border from getting fat
          />
        </g>
      </svg>

      {/* Foreground Text Layer */}
      <MuiBox sx={{ position: "relative", padding: "0px 8px" }}>
        {children}
      </MuiBox>
    </>
  );
};

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
        display: "inline-block", // Shrinks container to fit text width
        padding: "8px 8px",
        width: `calc(${width}% - 16px)`,
        height: expand ? "calc(100% - 16px)" : undefined,
        margin: `0px calc((100% - ${width}%) / 2)`,
      }}
    >
      {variant === "banner" ? <Banner {...props} /> : <Box {...props} />}
    </MuiBox>
  );
}
