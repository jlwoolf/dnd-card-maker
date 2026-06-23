import {
  ButtonGroup,
  useMediaQuery,
  useTheme,
  type ButtonGroupProps,
  type SxProps,
} from "@mui/material";
import { mergeSx } from "../utils/mergeSx";

interface RoundedButtonGroupProps extends ButtonGroupProps {
  vertical?: boolean;
  radius?: string;
}

/**
 * RoundedButtonGroup provides a specialized MUI ButtonGroup with distinct
 * visual styling, including fully rounded corners and responsive orientation.
 * When `vertical` is set, forces vertical orientation and mobile sizing.
 *
 * @param props - Extended ButtonGroupProps with optional vertical flag.
 */
export default function RoundedButtonGroup({
  sx,
  children,
  vertical,
  radius = "20px",
  ...props
}: RoundedButtonGroupProps) {
  const theme = useTheme();
  const widthMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isMobile = vertical || widthMobile;
  const size = isMobile ? "40px" : "80px";

  /**
   * Complex responsive styling to ensure the group maintains its "pill" shape
   * in both horizontal and vertical orientations.
   */
  const responsiveSx: SxProps = {
    borderRadius: radius,
    overflow: "hidden",
    "& > button, & > .MuiButtonBase-root": {
      minWidth: isMobile ? "unset" : size,
      minHeight: isMobile ? size : "unset",
      height: size,
      borderRadius: 0,
    },
    "& > * + *": {
      borderLeft: isMobile ? undefined : "1px solid rgba(255, 255, 255, 0.3)",
      borderTop: isMobile ? "1px solid rgba(255, 255, 255, 0.3)" : undefined,
    },

    "& > *:first-of-type": {
      borderTopLeftRadius: radius,
      borderBottomLeftRadius: isMobile ? "0px" : radius,
      borderTopRightRadius: isMobile ? radius : "0px",
      borderBottomRightRadius: 0,
    },

    "& > *:last-of-type": {
      borderBottomRightRadius: radius,
      borderTopRightRadius: isMobile ? "0px" : radius,
      borderBottomLeftRadius: isMobile ? radius : "0px",
      borderTopLeftRadius: 0,
    },
  };

  return (
    <ButtonGroup
      orientation={isMobile ? "vertical" : "horizontal"}
      variant="contained"
      aria-label="rounded button group"
      sx={mergeSx(responsiveSx, sx)}
      {...props}
    >
      {children}
    </ButtonGroup>
  );
}
