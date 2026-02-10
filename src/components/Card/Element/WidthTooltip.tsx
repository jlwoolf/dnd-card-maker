import { WidthFull } from "@mui/icons-material";
import {
  Box,
  ClickAwayListener,
  Slider,
  Tooltip,
  Typography,
  type SliderOwnProps,
} from "@mui/material";
import { ICON_STYLES } from "./styles";
import usePopperRef from "./usePopperRef";

interface WidthTooltipProps {
  width: number;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (val: number) => void;
}

const WidthTooltip = ({
  width,
  isOpen,
  onClose,
  onUpdate,
}: WidthTooltipProps) => {
  const popperRef = usePopperRef();

  const handleSliderChange: SliderOwnProps<number>["onChangeCommitted"] = (
    _,
    newValue,
  ) => {
    onUpdate(newValue);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Tooltip
      open={isOpen}
      arrow
      slotProps={{
        popper: {
          popperRef: popperRef,
          modifiers: [{ name: "offset", options: { offset: [0, -8] } }],
        },
        tooltip: {
          sx: (theme) => ({
            backgroundColor: theme.palette.primary.main,
            padding: 0,
          }),
        },
        arrow: { sx: (theme) => ({ color: theme.palette.primary.main }) },
      }}
      title={
        <ClickAwayListener onClickAway={handleClose}>
          <Box p={1} sx={{ minWidth: 150 }}>
            <Typography
              variant="caption"
              sx={{ color: "white", display: "block" }}
            >
              Width: {width}%
            </Typography>
            <Slider
              size="small"
              defaultValue={width}
              min={50}
              max={100}
              step={5}
              marks
              onChangeCommitted={handleSliderChange}
              sx={{
                color: "white",
                "& .MuiSlider-valueLabel": {
                  backgroundColor: "white",
                  color: "primary.main",
                },
              }}
              valueLabelDisplay="auto"
            />
          </Box>
        </ClickAwayListener>
      }
    >
      <WidthFull sx={ICON_STYLES} />
    </Tooltip>
  );
};

export default WidthTooltip;
