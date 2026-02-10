import { CheckBoxOutlineBlankOutlined } from "@mui/icons-material";
import { Button, ButtonGroup } from "@mui/material";
import { BUTTON_STYLES, getToggleStyles, ICON_STYLES } from "../styles";
import BannerIcon from "./BannerIcon";
import SettingsTooltip from "../SettingsTooltip";

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
      }
    >
      {/* The trigger icon changes based on selection */}
      {variant === "banner" ? (
        <BannerIcon sx={ICON_STYLES} />
      ) : (
        <CheckBoxOutlineBlankOutlined sx={ICON_STYLES} />
      )}
    </SettingsTooltip>
  );
}