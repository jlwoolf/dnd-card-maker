import {
  VerticalAlignBottom,
  VerticalAlignCenter,
  VerticalAlignTop,
} from "@mui/icons-material";
import { Tooltip, ClickAwayListener, Button, ButtonGroup } from "@mui/material";
import { BUTTON_STYLES, getToggleStyles, ICON_STYLES } from "../styles";

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
    <Tooltip
      open={isOpen}
      title={
        <ClickAwayListener onClickAway={onClose}>
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
                ...getToggleStyles(alignment === "start")(theme),
              })}
              onClick={() => onUpdate("start")}
            >
              <VerticalAlignTop sx={ICON_STYLES} />
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
              <VerticalAlignCenter sx={ICON_STYLES} />
            </Button>
            <Button
              size="small"
              color="primary"
              variant="contained"
              sx={(theme) => ({
                ...BUTTON_STYLES(theme),
                ...getToggleStyles(alignment === "end")(theme),
              })}
              onClick={() => onUpdate("end")}
            >
              <VerticalAlignBottom sx={ICON_STYLES} />
            </Button>
          </ButtonGroup>
        </ClickAwayListener>
      }
      arrow
      slotProps={{
        tooltip: {
          sx: (theme) => ({
            backgroundColor: theme.palette.primary.main,
            padding: 0,
            borderRadius: theme.spacing(4),
            display: "flex",
            justifyContent: "center",
          }),
        },
        arrow: {
          sx: (theme) => ({
            color: theme.palette.primary.main,
          }),
        },
        popper: {
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [0, -8],
              },
            },
          ],
        },
      }}
    >
      {alignment === "start" ? (
        <VerticalAlignTop sx={ICON_STYLES} />
      ) : alignment === "center" ? (
        <VerticalAlignCenter sx={ICON_STYLES} />
      ) : (
        <VerticalAlignBottom sx={ICON_STYLES} />
      )}
    </Tooltip>
  );
}
