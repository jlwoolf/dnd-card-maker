import { RoundedCorner } from "@mui/icons-material";
import {
  Box,
  ClickAwayListener,
  Slider,
  Tooltip,
  Typography,
  type SliderOwnProps,
} from "@mui/material";
import { ICON_STYLES } from "../styles";
import usePopperRef from "../usePopperRef";

interface radiusTooltipProps {
  radius: number;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (val: number) => void;
}

const RadiusTooltip = ({
  radius,
  isOpen,
  onClose,
  onUpdate,
}: radiusTooltipProps) => {
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
          popperRef,
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
              sx={{ color: "white", display: "block", textTransform: "none" }}
            >
              Radius: {radius}px
            </Typography>
            <Slider
              size="small"
              defaultValue={radius}
              slotProps={{}}
              min={0}
              max={10}
              step={1}
              marks
              onChange={handleSliderChange}
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
      <RoundedCorner sx={ICON_STYLES} />
    </Tooltip>
  );
};

export default RadiusTooltip;
