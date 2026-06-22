import {
  ButtonGroup,
  useMediaQuery,
  useTheme,
  type ButtonGroupProps,
} from "@mui/material";
import { mergeSx } from "../utils/mergeSx";

interface RoundedButtonGroupProps extends ButtonGroupProps {
  vertical?: boolean;
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
  const responsiveSx = {
    borderRadius: "50px",
    overflow: "hidden",
    "& > button, & > .MuiButtonBase-root": {
      minWidth: isMobile ? "unset" : size,
      minHeight: isMobile ? size : "unset",
      height: size,
      borderRadius: 0,
    },
    "& > * + *": {
      borderLeft: "1px solid rgba(255, 255, 255, 0.3)",
    },

    "& > *:first-of-type": {
      borderTopLeftRadius: "50px",
      borderBottomLeftRadius: isMobile ? "0px" : "50px",
      borderTopRightRadius: isMobile ? "50px" : "0px",
      borderBottomRightRadius: 0,
    },

    "& > *:last-of-type": {
      borderBottomRightRadius: "50px",
      borderTopRightRadius: isMobile ? "0px" : "50px",
      borderBottomLeftRadius: isMobile ? "50px" : "0px",
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
