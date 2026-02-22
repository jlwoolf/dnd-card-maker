import { CheckBoxOutlineBlankOutlined } from "@mui/icons-material";
import { Button, ButtonGroup } from "@mui/material";
import classNames from "classnames";
import SettingsTooltip from "../SettingsTooltip";
import BannerIcon from "./BannerIcon";

type Variant = "banner" | "box";

interface VariantTooltipProps {
  /** Current text container variant */
  variant: Variant;
  /** Whether the tooltip is open */
  isOpen: boolean;
  /** Callback to close the tooltip */
  onClose: () => void;
  /** Callback when the variant is updated */
  onUpdate: (val: Variant) => void;
}

/**
 * VariantTooltip provides options for choosing the background style of a text element (Banner or Box).
 */
export default function VariantTooltip({
  variant,
  isOpen,
  onClose,
  onUpdate,
}: VariantTooltipProps) {
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
            className={classNames({ toggled: variant === "banner" })}
            variant="contained"
            onMouseDown={(e) => {
              e.preventDefault();
              onUpdate("banner");
            }}
          >
            <BannerIcon />
          </Button>
          <Button
            size="small"
            className={classNames({ toggled: variant === "box" })}
            variant="contained"
            onMouseDown={(e) => {
              e.preventDefault();
              onUpdate("box");
            }}
          >
            <CheckBoxOutlineBlankOutlined />
          </Button>
        </ButtonGroup>
      }
    >
      {variant === "banner" ? <BannerIcon /> : <CheckBoxOutlineBlankOutlined />}
    </SettingsTooltip>
  );
}
