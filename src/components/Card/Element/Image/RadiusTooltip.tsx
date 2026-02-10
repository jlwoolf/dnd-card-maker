import { RoundedCorner } from "@mui/icons-material";
import {
  Box,
  Slider,
  Typography,
  type SliderOwnProps,
} from "@mui/material";
import { ICON_STYLES } from "../styles";
import SettingsTooltip from "../SettingsTooltip";

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
      }
    >
      <RoundedCorner sx={ICON_STYLES} />
    </SettingsTooltip>
  );
};

export default RadiusTooltip;