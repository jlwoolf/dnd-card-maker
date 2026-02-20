import { Add, Height, Remove } from "@mui/icons-material";
import { Button, TextField } from "@mui/material";
import SettingsTooltip from "../SettingsTooltip";
import { useState } from "react";

interface LineHeightTooltipProps {
  lineHeight: number | undefined;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (val: number | undefined) => void;
}

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
      const lineHeight = parseInt(val);
      setValue(lineHeight.toString());
      onUpdate(lineHeight);
    }
  };

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
              if (lineHeight === undefined || lineHeight <= 1) {
                return;
              } else {
                setValue((lineHeight - 10).toString());
                onUpdate(lineHeight - 10);
              }
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
              if (lineHeight === undefined) {
                return;
              }

              setValue((lineHeight + 10).toString());
              onUpdate(lineHeight + 10);
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
