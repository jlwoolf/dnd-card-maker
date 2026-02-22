import React from "react";
import { Box, Slider, Typography, type SliderOwnProps } from "@mui/material";

interface SliderToolbarInputProps {
  /** The current numeric value */
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
 * in toolbars. It handles the 'onChangeCommitted' logic to ensure 
 * performant updates only when the user finishes dragging.
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
  const handleSliderChange: SliderOwnProps<number>["onChangeCommitted"] = (
    _,
    newValue,
  ) => {
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
        defaultValue={value}
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
