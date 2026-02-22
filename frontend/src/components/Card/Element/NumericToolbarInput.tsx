import React, { useState } from "react";
import { Add, Remove } from "@mui/icons-material";
import { Box, Button, TextField } from "@mui/material";

interface NumericToolbarInputProps {
  /** The current numeric value */
  value: number | undefined;
  /** Callback triggered when the value is updated */
  onUpdate: (val: number | undefined) => void;
  /** Minimum allowed value. Defaults to 1. */
  min?: number;
  /** Maximum allowed value. Optional. */
  max?: number;
  /** Step for increment/decrement buttons. Defaults to 1. */
  step?: number;
  /** Optional suffix to show in the input (not currently supported in simple textfield but good for future) */
  suffix?: string;
}

/**
 * NumericToolbarInput is a specialized input component designed for use 
 * within toolbars and tooltips. It handles the boilerplate of managing 
 * string-to-number conversion, numeric-only validation, and 
 * increment/decrement actions.
 */
export default function NumericToolbarInput({
  value: controlledValue,
  onUpdate,
  min = 1,
  max,
  step = 1,
}: NumericToolbarInputProps) {
  const [inputValue, setInputValue] = useState(controlledValue?.toString() ?? "");
  const [prevControlledValue, setPrevControlledValue] = useState(controlledValue);

  /**
   * Sync local state if the controlled value changes externally.
   */
  if (controlledValue !== prevControlledValue) {
    setPrevControlledValue(controlledValue);
    setInputValue(controlledValue?.toString() ?? "");
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    if (val === "") {
      setInputValue("");
      onUpdate(undefined);
      return;
    }

    if (/^[0-9\b]+$/.test(val)) {
      const parsed = parseInt(val, 10);
      
      // If a max is defined, enforce it
      if (max !== undefined && parsed > max) {
        setInputValue(max.toString());
        onUpdate(max);
      } else {
        setInputValue(parsed.toString());
        onUpdate(parsed);
      }
    }
  };

  const handleAdjust = (delta: number) => {
    if (controlledValue === undefined) return;
    
    const newValue = controlledValue + delta;
    
    if (newValue < min) return;
    if (max !== undefined && newValue > max) return;

    onUpdate(newValue);
  };

  return (
    <Box display="flex" alignItems="center">
      <Button
        size="small"
        variant="contained"
        sx={(theme) => ({
          minWidth: 0,
          minHeight: 0,
          padding: theme.spacing(1),
        })}
        onMouseDown={(e) => {
          e.preventDefault();
          handleAdjust(-step);
        }}
      >
        <Remove sx={{ width: "12px" }} />
      </Button>

      <TextField
        value={inputValue}
        onChange={handleChange}
        onKeyDown={(e) => {
          // Block non-numeric characters that standard 'number' inputs might allow
          if (["e", "E", "+", "-"].includes(e.key)) {
            e.preventDefault();
          }
        }}
        slotProps={{
          input: {
            sx: {
              borderRadius: 0,
              backgroundColor: "rgba(255,255,255,0.7)",
            },
          },
          htmlInput: {
            sx: (theme) => ({
              width: `${inputValue.length || 1}ch`,
              minWidth: "2ch",
              fontSize: "14px",
              textAlign: "center",
              padding: theme.spacing(1),
              color: "text.primary",
            }),
          },
        }}
      />

      <Button
        size="small"
        variant="contained"
        sx={(theme) => ({
          minWidth: 0,
          minHeight: 0,
          padding: theme.spacing(1),
        })}
        onMouseDown={(e) => {
          e.preventDefault();
          handleAdjust(step);
        }}
      >
        <Add sx={{ width: "12px" }} />
      </Button>
    </Box>
  );
}
