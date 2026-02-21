import React, { useEffect, useState } from "react";
import { Add, FormatSize, Remove } from "@mui/icons-material";
import { Button, TextField } from "@mui/material";
import SettingsTooltip from "../SettingsTooltip";

interface FontSizeTooltipProps {
  /** Current font size in pixels */
  size: number | undefined;
  /** Whether the tooltip is open */
  isOpen: boolean;
  /** Callback to close the tooltip */
  onClose: () => void;
  /** Callback when the font size is updated */
  onUpdate: (val: number | undefined) => void;
}

/**
 * FontSizeTooltip provides controls for adjusting text font size via input or increment/decrement buttons.
 */
export default function FontSizeTooltip({
  size,
  isOpen,
  onClose,
  onUpdate,
}: FontSizeTooltipProps) {
  const [value, setValue] = useState(size?.toString() ?? "16");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    if (val === "") {
      setValue("");
      onUpdate(undefined);
    }

    if (/^[0-9\b]+$/.test(val)) {
      const parsedSize = parseInt(val);
      setValue(parsedSize.toString());
      onUpdate(parsedSize);
    }
  };

  useEffect(() => {
    if (size !== undefined) {
      setValue(size.toString());
    }
  }, [size]);

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
              if (size === undefined || size <= 1) return;
              const newSize = size - 1;
              setValue(newSize.toString());
              onUpdate(newSize);
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
                  width: `${size?.toString().length || 1}ch`,
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
              if (size === undefined) return;
              const newSize = size + 1;
              setValue(newSize.toString());
              onUpdate(newSize);
            }}
          >
            <Add sx={{ width: "12px" }} />
          </Button>
        </div>
      }
    >
      <FormatSize />
    </SettingsTooltip>
  );
}
