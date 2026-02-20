import {
  FormatAlignCenter,
  FormatAlignLeft,
  FormatAlignRight,
} from "@mui/icons-material";
import { Button, ButtonGroup } from "@mui/material";
import SettingsTooltip from "../SettingsTooltip";
import classNames from "classnames";

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
      sx={{
        tooltip: {
          padding: 0,
        },
      }}
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
            variant="contained"
            className={classNames({ toggled: alignment === "left" })}
            onClick={() => onUpdate("left")}
          >
            <FormatAlignLeft />
          </Button>
          <Button
            size="small"
            variant="contained"
            className={classNames({ toggled: alignment === "center" })}
            onClick={() => onUpdate("center")}
          >
            <FormatAlignCenter />
          </Button>
          <Button
            size="small"
            variant="contained"
            className={classNames({ toggled: alignment === "right" })}
            onClick={() => onUpdate("right")}
          >
            <FormatAlignRight />
          </Button>
        </ButtonGroup>
      }
    >
      {alignment === "left" ? (
        <FormatAlignLeft />
      ) : alignment === "center" ? (
        <FormatAlignCenter />
      ) : (
        <FormatAlignRight />
      )}
    </SettingsTooltip>
  );
}
