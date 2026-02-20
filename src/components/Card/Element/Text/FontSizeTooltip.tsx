import { Add, FormatSize, Remove } from "@mui/icons-material";
import { Button, TextField } from "@mui/material";
import SettingsTooltip from "../SettingsTooltip";
import { useState } from "react";

interface FontSizeTooltipProps {
  size: number | undefined;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (val: number | undefined) => void;
}

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
      const size = parseInt(val);
      setValue(size.toString());
      onUpdate(size);
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
            onClick={() => {
              if (size === undefined || size <= 1) {
                return;
              } else {
                onUpdate(size - 1);
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
            onClick={() => {
              if (size === undefined) {
                return;
              }
              onUpdate(size + 1);
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
