import { Add, FormatSize, Remove } from "@mui/icons-material";
import { Button, TextField } from "@mui/material";
import { ICON_STYLES } from "../styles";
import SettingsTooltip from "../SettingsTooltip";

interface FontSizeTooltipProps {
  size: number;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (val: number) => void;
}

export default function FontSizeTooltip({
  size,
  isOpen,
  onClose,
  onUpdate,
}: FontSizeTooltipProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    if (/^[0-9\b]+$/.test(val)) {
      onUpdate(parseInt(val));
    }
  };

  return (
    <SettingsTooltip
      open={isOpen}
      onClose={onClose}
      tooltipSx={{
        borderRadius: 100,
      }}
      title={
        <div>
          <Button
            size="small"
            variant="contained"
            sx={(theme) => ({
              minWidth: 0,
              minHeight: 0,
              padding: theme.spacing(1),
              borderRadius: 0,
              borderTopLeftRadius: theme.spacing(4),
              borderBottomLeftRadius: theme.spacing(4),
            })}
            onClick={() => {
              if (size <= 1) {
                return;
              } else {
                onUpdate(size - 1);
              }
            }}
          >
            <Remove sx={{ width: "12px" }} />
          </Button>
          <TextField
            value={size.toString()}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (["e", "E", "+", "-"].includes(e.key)) {
                e.preventDefault();
              }
            }}
            slotProps={{
              root: {
                sx: {
                  marginTop: "2px",
                },
              },
              input: {
                sx: {
                  borderRadius: 0,
                  backgroundColor: "white",
                },
              },
              htmlInput: {
                sx: (theme) => ({
                  width: `${size.toString().length || 1}ch`,
                  fontSize: "14px",
                  textAlign: "center",
                  padding: theme.spacing(1),
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
              borderRadius: 0,
              borderTopRightRadius: theme.spacing(4),
              borderBottomRightRadius: theme.spacing(4),
            })}
            onClick={() => {
              onUpdate(size + 1);
            }}
          >
            <Add sx={{ width: "12px" }} />
          </Button>
        </div>
      }
    >
      <FormatSize sx={ICON_STYLES} />
    </SettingsTooltip>
  );
}
