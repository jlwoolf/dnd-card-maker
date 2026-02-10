import {
  FormatAlignCenter,
  FormatAlignLeft,
  FormatAlignRight,
} from "@mui/icons-material";
import { Tooltip, ClickAwayListener, Button, ButtonGroup } from "@mui/material";
import { BUTTON_STYLES, getToggleStyles, ICON_STYLES } from "../styles";
import usePopperRef from "../usePopperRef";

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
  const popperRef = usePopperRef();

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
          popperRef,
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
      {alignment === "left" ? (
        <FormatAlignLeft sx={ICON_STYLES} />
      ) : alignment === "center" ? (
        <FormatAlignCenter sx={ICON_STYLES} />
      ) : (
        <FormatAlignRight sx={ICON_STYLES} />
      )}
    </Tooltip>
  );
}
