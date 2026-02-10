import { ButtonGroup, type ButtonGroupProps } from "@mui/material";
import { mergeSx } from "../../utils/mergeSx";

const BASE_SX = {
  // 1. Give the container a high border radius
  borderRadius: "50px",
  "& .MuiButtonBase-root": {
    borderRadius: "50px",
    aspectRatio: "1/1",
  },
  // 2. Ensure the stroke/border between buttons stays clean
  "& .MuiButtonGroup-grouped": {
    px: 3, // Extra padding looks better with rounded ends
    borderColor: "primary.light",
  },
  // 3. Force the first and last buttons to respect the container curve
  "& .MuiButtonGroup-firstButton": {
    borderRadius: 'unset',
    borderTopLeftRadius: "50px",
    borderBottomLeftRadius: "50px",
  },
  "& .MuiButtonGroup-middleButton": {
    borderRadius: 'unset',
  },
  "& .MuiButtonGroup-lastButton": {
    borderRadius: 'unset',
    borderTopRightRadius: "50px",
    borderBottomRightRadius: "50px",
  },
};

export default function RoundedButtonGroup({
  sx,
  children,
  ...props
}: ButtonGroupProps) {
  return (
    <ButtonGroup
      variant="contained"
      aria-label="rounded button group"
      sx={mergeSx(BASE_SX, sx)}
      {...props}
    >
      {children}
    </ButtonGroup>
  );
}
