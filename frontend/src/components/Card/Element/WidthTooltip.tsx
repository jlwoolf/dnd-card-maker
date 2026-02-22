import { WidthFull } from "@mui/icons-material";
import { Box, Slider, Typography, type SliderOwnProps } from "@mui/material";
import SettingsTooltip from "./SettingsTooltip";

interface WidthTooltipProps {
  /** Current width percentage (50-100) */
  width: number;
  /** Whether the tooltip is currently open */
  isOpen: boolean;
  /** Callback to close the tooltip */
  onClose: () => void;
  /** Callback triggered when the width value is committed */
  onUpdate: (val: number) => void;
}

/**
 * WidthTooltip provides a slider interface for adjusting the horizontal 
 * span of an element (Text or Image) within the card container.
 */
const WidthTooltip = ({
  width,
  isOpen,
  onClose,
  onUpdate,
}: WidthTooltipProps) => {
  /**
   * Handles the slider change event only when the user releases the handle
   * to maintain smooth performance in the editor.
   */
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
