import { RoundedCorner } from "@mui/icons-material";
import { Box, Slider, Typography, type SliderOwnProps } from "@mui/material";
import SettingsTooltip from "../SettingsTooltip";

interface RadiusTooltipProps {
  /** Current radius value in pixels */
  radius: number;
  /** Whether the tooltip is open */
  isOpen: boolean;
  /** Callback to close the tooltip */
  onClose: () => void;
  /** Callback when the radius value is updated */
  onUpdate: (val: number) => void;
}

/**
 * RadiusTooltip provides a slider to adjust the border radius of an image element.
 */
const RadiusTooltip = ({
  radius,
  isOpen,
  onClose,
  onUpdate,
}: RadiusTooltipProps) => {
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
