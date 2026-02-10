import {
  ButtonGroup,
  useMediaQuery,
  useTheme,
  type ButtonGroupProps,
} from "@mui/material";
import { mergeSx } from "../../utils/mergeSx";

export default function RoundedButtonGroup({
  sx,
  children,
  ...props
}: ButtonGroupProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const width = isMobile ? "40px" : "80px";

  const responsiveSx = {
    borderRadius: "50px",
    "& .MuiButtonBase-root": {
          width,
      // Base reset for all buttons
      borderRadius: "50px",
      aspectRatio: "1/1",
    },
    "& .MuiButtonGroup-grouped": {
      px: 3,
      borderColor: "primary.light",
    },

    // --- First Button Rounding ---
    "& .MuiButtonGroup-firstButton": {
      borderRadius: "unset",
      borderTopLeftRadius: "50px",
      borderBottomLeftRadius: isMobile ? "0px" : "50px",
      borderTopRightRadius: isMobile ? "50px" : "0px",
    },

    // --- Last Button Rounding ---
    "& .MuiButtonGroup-lastButton": {
      borderRadius: "unset",
      borderBottomRightRadius: "50px",
      borderTopRightRadius: isMobile ? "0px" : "50px",
      borderBottomLeftRadius: isMobile ? "50px" : "0px",
    },

    // --- Middle Buttons ---
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
