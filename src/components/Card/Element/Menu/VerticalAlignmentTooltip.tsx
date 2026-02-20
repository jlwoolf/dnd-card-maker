import {
  VerticalAlignBottom,
  VerticalAlignCenter,
  VerticalAlignTop,
} from "@mui/icons-material";
import { Button, ButtonGroup } from "@mui/material";
import SettingsTooltip from "../SettingsTooltip";
import classNames from "classnames";

type VerticalAlignment = "start" | "center" | "end";

interface VerticalAlignmentTooltipProps {
  alignment: VerticalAlignment;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (val: VerticalAlignment) => void;
}

export default function VerticalAlignmentTooltip({
  alignment,
  isOpen,
  onClose,
  onUpdate,
}: VerticalAlignmentTooltipProps) {
  return (
    <SettingsTooltip
      variant="menu"
      open={isOpen}
      sx={{
        tooltip: {
          padding: 0,
        },
      }}
      onClose={onClose}
      title={
        <ButtonGroup
          sx={(theme) => ({
            minHeight: 0,
            zIndex: 1,

            "& .MuiButtonBase-root": {
              padding: 0,
            },

            "& .MuiSvgIcon-root": {
              aspectRatio: "1/1",
              width: theme.spacing(2),
            },
          })}
        >
          <Button
            size="small"
            variant="contained"
            className={classNames({ toggled: alignment === "start" })}
            onClick={() => onUpdate("start")}
          >
            <VerticalAlignTop />
          </Button>
          <Button
            size="small"
            variant="contained"
            className={classNames({ toggled: alignment === "center" })}
            onClick={() => onUpdate("center")}
          >
            <VerticalAlignCenter />
          </Button>
          <Button
            size="small"
            variant="contained"
            className={classNames({ toggled: alignment === "end" })}
            onClick={() => onUpdate("end")}
          >
            <VerticalAlignBottom />
          </Button>
        </ButtonGroup>
      }
    >
      {alignment === "start" ? (
        <VerticalAlignTop />
      ) : alignment === "center" ? (
        <VerticalAlignCenter />
      ) : (
        <VerticalAlignBottom />
      )}
    </SettingsTooltip>
  );
}
