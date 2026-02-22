import { RoundedCorner } from "@mui/icons-material";
import { Box, Slider, Typography, type SliderOwnProps } from "@mui/material";
import SettingsTooltip from "../SettingsTooltip";

interface RadiusTooltipProps {
  /** Current radius value in pixels */
  radius: number;
  /** Whether the tooltip is currently open */
  isOpen: boolean;
  /** Callback to close the tooltip */
  onClose: () => void;
  /** Callback triggered when the radius value is committed */
  onUpdate: (val: number) => void;
}

/**
 * RadiusTooltip provides a specialized slider interface for adjusting 
 * the border-radius of image elements.
 */
const RadiusTooltip = ({
  radius,
  isOpen,
  onClose,
  onUpdate,
}: RadiusTooltipProps) => {
  /**
   * Handles the slider change event only when the user releases the handle
   * to avoid excessive state updates and re-renders during active dragging.
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
        <Box p={1} sx={{ minWidth: 150 }}>
          <Typography
            variant="caption"
            sx={{ display: "block", textTransform: "none" }}
          >
            Radius: {radius}px
          </Typography>
          <Slider
            size="small"
            defaultValue={radius}
            min={0}
            max={10}
            step={1}
            marks
            onChange={handleSliderChange}
            valueLabelDisplay="auto"
          />
        </Box>
      }
    >
      <RoundedCorner />
    </SettingsTooltip>
  );
};

export default RadiusTooltip;
