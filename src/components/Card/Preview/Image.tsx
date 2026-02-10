import { Box, styled } from "@mui/material";
import { usePreviewTheme } from "./usePreviewTheme";

interface TextProps {
  children?: React.ReactNode;
  radius?: number;
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

const Image = ({ children, radius = 0, width = 100 }: TextProps) => {
  const { fill, stroke } = usePreviewTheme();

  return (
    <Box display="flex" justifyContent="center">
      <Box
        sx={{
          position: "relative",
          display: "inline-flex", // Changed to inline-flex to shrink-wrap
          justifyContent: "center", // Horizontal center
          alignItems: "center", // Vertical center
          width: `calc(${width}% - 4px)`,
          minHeight: "50px", // Added min-height to ensure there's space to center in
        }}
      >
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
            width: "100%", // Use 100% of the parent container
            display: "flex", // Nested flex for internal centering
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
