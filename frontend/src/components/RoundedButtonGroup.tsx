import {
  ButtonGroup,
  useMediaQuery,
  useTheme,
  type ButtonGroupProps,
} from "@mui/material";
import { mergeSx } from "../utils/mergeSx";

/**
 * RoundedButtonGroup provides a specialized MUI ButtonGroup with distinct 
 * visual styling, including fully rounded corners and responsive orientation.
 * It automatically switches to vertical mode on mobile devices.
 * 
 * @param props - Standard MUI ButtonGroupProps.
 */
export default function RoundedButtonGroup({
  sx,
  children,
  ...props
}: ButtonGroupProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const size = isMobile ? "40px" : "80px";

  /**
   * Complex responsive styling to ensure the group maintains its "pill" shape 
   * in both horizontal and vertical orientations.
   */
  const responsiveSx = {
    borderRadius: "50px",
    "& .MuiButtonBase-root": {
      minWidth: isMobile ? "unset" : size,
      minHeight: isMobile ? size : "unset",
      height: size,
      borderRadius: "50px",
    },
    "& .MuiButtonGroup-grouped": {
      px: 3,
      borderColor: "primary.light",
    },

    "& .MuiButtonGroup-firstButton": {
      borderRadius: "unset",
      borderTopLeftRadius: "50px",
      borderBottomLeftRadius: isMobile ? "0px" : "50px",
      borderTopRightRadius: isMobile ? "50px" : "0px",
    },

    "& .MuiButtonGroup-lastButton": {
      borderRadius: "unset",
      borderBottomRightRadius: "50px",
      borderTopRightRadius: isMobile ? "0px" : "50px",
      borderBottomLeftRadius: isMobile ? "50px" : "0px",
    },

    "& .MuiButtonGroup-middleButton": {
      borderRadius: "0px",
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
