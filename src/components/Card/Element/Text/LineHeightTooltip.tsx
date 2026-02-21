import React, { useEffect, useState } from "react";
import { Add, Height, Remove } from "@mui/icons-material";
import { Button, TextField } from "@mui/material";
import SettingsTooltip from "../SettingsTooltip";

interface LineHeightTooltipProps {
  /** Current line height percentage */
  lineHeight: number | undefined;
  /** Whether the tooltip is open */
  isOpen: boolean;
  /** Callback to close the tooltip */
  onClose: () => void;
  /** Callback when the line height is updated */
  onUpdate: (val: number | undefined) => void;
}

/**
 * LineHeightTooltip provides controls for adjusting text line height (spacing) via input or buttons.
 */
export default function LineHeightTooltip({
  lineHeight,
  isOpen,
  onClose,
  onUpdate,
}: LineHeightTooltipProps) {
  const [value, setValue] = useState(lineHeight?.toString() ?? "120");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    if (val === "") {
      setValue("");
      onUpdate(undefined);
    }

    if (/^[0-9\b]+$/.test(val)) {
      const parsedLineHeight = parseInt(val);
      setValue(parsedLineHeight.toString());
      onUpdate(parsedLineHeight);
    }
  };

  useEffect(() => {
    if (lineHeight !== undefined) {
      setValue(lineHeight.toString());
    }
  }, [lineHeight]);

  return (
    <SettingsTooltip
      open={isOpen}
      sx={{
        tooltip: {
          padding: 0,
        },
      }}
      onClose={onClose}
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
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
              if (lineHeight === undefined || lineHeight <= 10) return;
              const newValue = lineHeight - 10;
              setValue(newValue.toString());
              onUpdate(newValue);
            }}
          >
            <Remove sx={{ width: "12px" }} />
          </Button>
          <TextField
            value={value}
            onChange={handleChange}
            onKeyDown={(e) => {
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
                  width: `${lineHeight?.toString().length || 1}ch`,
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
              if (lineHeight === undefined) return;
              const newValue = lineHeight + 10;
              setValue(newValue.toString());
              onUpdate(newValue);
            }}
          >
            <Add sx={{ width: "12px" }} />
          </Button>
        </div>
      }
    >
      <Height />
    </SettingsTooltip>
  );
}
