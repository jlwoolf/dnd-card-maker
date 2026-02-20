import { WidthFull } from "@mui/icons-material";
import { Box, Slider, Typography, type SliderOwnProps } from "@mui/material";
import SettingsTooltip from "./SettingsTooltip";

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
  const handleSliderChange: SliderOwnProps<number>["onChangeCommitted"] = (
    _,
    newValue,
  ) => {
    onUpdate(newValue);
  };

  return (
    <SettingsTooltip
      open={isOpen}
      onClose={onClose}
      title={
        <Box p={1} sx={{ minWidth: 150 }}>
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
