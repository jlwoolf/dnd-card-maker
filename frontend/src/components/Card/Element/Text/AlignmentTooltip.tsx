import {
  FormatAlignCenter,
  FormatAlignLeft,
  FormatAlignRight,
} from "@mui/icons-material";
import { Button, ButtonGroup } from "@mui/material";
import classNames from "classnames";
import SettingsTooltip from "../SettingsTooltip";

type Alignment = "left" | "center" | "right";

interface AlignmentTooltipProps {
  /** Current horizontal text alignment */
  alignment: Alignment;
  /** Whether the tooltip is currently open */
  isOpen: boolean;
  /** Callback to close the tooltip */
  onClose: () => void;
  /** Callback triggered when a new alignment is selected */
  onUpdate: (val: Alignment) => void;
}

/**
 * AlignmentTooltip provides a button group for selecting the horizontal 
 * alignment of rich-text content (Left, Center, Right).
 */
export default function AlignmentTooltip({
  alignment,
  isOpen,
  onClose,
  onUpdate,
}: AlignmentTooltipProps) {
  return (
    <SettingsTooltip
      variant="toolbar"
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
            onMouseDown={(e) => {
              e.preventDefault();
              onUpdate("left");
            }}
          >
            <FormatAlignLeft />
          </Button>
          <Button
            size="small"
            variant="contained"
            className={classNames({ toggled: alignment === "center" })}
            onMouseDown={(e) => {
              e.preventDefault();
              onUpdate("center");
            }}
          >
            <FormatAlignCenter />
          </Button>
          <Button
            size="small"
            variant="contained"
            className={classNames({ toggled: alignment === "right" })}
            onMouseDown={(e) => {
              e.preventDefault();
              onUpdate("right");
            }}
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
