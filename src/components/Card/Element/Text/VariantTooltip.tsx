import { CheckBoxOutlineBlankOutlined } from "@mui/icons-material";
import {
  Tooltip,
  ClickAwayListener,
  Button,
  ButtonGroup,
} from "@mui/material";
import { BUTTON_STYLES, getToggleStyles, ICON_STYLES } from "../styles";
import usePopperRef from "../usePopperRef";
import BannerIcon from "./BannerIcon";

type Variant = "banner" | "box";

interface VariantTooltipProps {
  variant: Variant;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (val: Variant) => void;
}

export default function VariantTooltip({
  variant,
  isOpen,
  onClose,
  onUpdate,
}: VariantTooltipProps) {
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
                ...getToggleStyles(variant === "banner")(theme),
                px: 2, // Added horizontal padding for text readability
              })}
              onClick={() => onUpdate("banner")}
            >
              <BannerIcon sx={ICON_STYLES} />
            </Button>
            <Button
              size="small"
              color="primary"
              variant="contained"
              sx={(theme) => ({
                ...BUTTON_STYLES(theme),
                ...getToggleStyles(variant === "box")(theme),
                px: 2,
              })}
              onClick={() => onUpdate("box")}
            >
              <CheckBoxOutlineBlankOutlined sx={ICON_STYLES} />
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
      {/* The trigger icon changes based on selection */}
      {variant === "banner" ? (
        <BannerIcon sx={ICON_STYLES} />
      ) : (
        <CheckBoxOutlineBlankOutlined sx={ICON_STYLES} />
      )}
    </Tooltip>
  );
}
