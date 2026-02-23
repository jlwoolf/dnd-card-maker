import { Box, Slider, Typography } from "@mui/material";

interface SliderToolbarInputProps {
  /** The current numeric value from the parent state */
  value: number;
  /** Callback triggered when the value is committed (mouse up) */
  onUpdate: (val: number) => void;
  /** Minimum value. Defaults to 0. */
  min?: number;
  /** Maximum value. Defaults to 100. */
  max?: number;
  /** Step value. Defaults to 1. */
  step?: number;
  /** Label to show above the slider */
  label: string;
  /** Suffix for the value display (e.g., 'px' or '%') */
  suffix?: string;
  /** Whether to show marks on the slider */
  marks?: boolean;
}

/**
 * SliderToolbarInput provides a standardized slider interface for use 
 * in toolbars. It provides real-time dynamic updates by triggering 
 * onUpdate on every slider movement.
 */
export default function SliderToolbarInput({
  value,
  onUpdate,
  min = 0,
  max = 100,
  step = 1,
  label,
  suffix = "",
  marks = false,
}: SliderToolbarInputProps) {
  const handleSliderChange = (_: Event, newValue: number | number[]) => {
    if (typeof newValue === "number") {
      onUpdate(newValue);
    }
  };

  return (
    <Box
      p={1}
      sx={{ minWidth: 150 }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <Typography
        variant="caption"
        sx={{ display: "block", textTransform: "none" }}
      >
        {label}: {value}{suffix}
      </Typography>
      <Slider
        size="small"
        value={value}
        min={min}
        max={max}
        step={step}
        marks={marks}
        onChange={handleSliderChange}
        valueLabelDisplay="auto"
      />
    </Box>
  );
}
