import { WidthFull } from "@mui/icons-material";
import { Box, Slider, Typography, type SliderOwnProps } from "@mui/material";
import SettingsTooltip from "./SettingsTooltip";

interface WidthTooltipProps {
  /** Current width percentage */
  width: number;
  /** Whether the tooltip is open */
  isOpen: boolean;
  /** Callback to close the tooltip */
  onClose: () => void;
  /** Callback when the width is updated */
  onUpdate: (val: number) => void;
}

/**
 * WidthTooltip provides a slider to adjust the width of a card element (Image or Text).
 */
const WidthTooltip = ({
  width,
  isOpen,
  onClose,
  onUpdate,
}: WidthTooltipProps) => {
  const handleSliderChange: SliderOwnProps<number>["onChangeCommitted"] = (
    _,
    newValue,
  ) => {
    if (typeof newValue === "number") {
      onUpdate(newValue);
    }
  };

  return (
    <SettingsTooltip
      open={isOpen}
      onClose={onClose}
      title={
        <Box
          p={1}
          sx={{ minWidth: 150 }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <Typography variant="caption" sx={{ display: "block" }}>
            Width: {width}%
          </Typography>
          <Slider
            size="small"
            defaultValue={width}
            min={50}
            max={100}
            step={5}
            marks
            onChange={handleSliderChange}
            valueLabelDisplay="auto"
          />
        </Box>
      }
    >
      <WidthFull />
    </SettingsTooltip>
  );
};

export default WidthTooltip;
