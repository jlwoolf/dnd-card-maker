import {
  FormatAlignCenter,
  FormatAlignLeft,
  FormatAlignRight,
} from "@mui/icons-material";
import { Button, ButtonGroup } from "@mui/material";
import { BUTTON_STYLES, getToggleStyles, ICON_STYLES } from "../styles";
import SettingsTooltip from "../SettingsTooltip";

type Alignment = "left" | "center" | "right";

interface FontSizeTooltipProps {
  alignment: Alignment;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (val: Alignment) => void;
}

export default function AlignmentTooltip({
  alignment,
  isOpen,
  onClose,
  onUpdate,
}: FontSizeTooltipProps) {
  return (
    <SettingsTooltip
      open={isOpen}
      onClose={onClose}
      title={
        <ButtonGroup
          sx={{
            minHeight: 0,
            zIndex: 1,
          }}
        >
          <Button
            size="small"
            color="primary"
            variant="contained"
            sx={(theme) => ({
              ...BUTTON_STYLES(theme),
              ...getToggleStyles(alignment === "left")(theme),
            })}
            onClick={() => onUpdate("left")}
          >
            <FormatAlignLeft sx={ICON_STYLES} />
          </Button>
          <Button
            size="small"
            color="primary"
            variant="contained"
            sx={(theme) => ({
              ...BUTTON_STYLES(theme),
              ...getToggleStyles(alignment === "center")(theme),
            })}
            onClick={() => onUpdate("center")}
          >
            <FormatAlignCenter sx={ICON_STYLES} />
          </Button>
          <Button
            size="small"
            color="primary"
            variant="contained"
            sx={(theme) => ({
              ...BUTTON_STYLES(theme),
              ...getToggleStyles(alignment === "right")(theme),
            })}
            onClick={() => onUpdate("right")}
          >
            <FormatAlignRight sx={ICON_STYLES} />
          </Button>
        </ButtonGroup>
      }
    >
      {alignment === "left" ? (
        <FormatAlignLeft sx={ICON_STYLES} />
      ) : alignment === "center" ? (
        <FormatAlignCenter sx={ICON_STYLES} />
      ) : (
        <FormatAlignRight sx={ICON_STYLES} />
      )}
    </SettingsTooltip>
  );
}