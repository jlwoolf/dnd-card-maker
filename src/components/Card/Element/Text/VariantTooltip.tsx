import { CheckBoxOutlineBlankOutlined } from "@mui/icons-material";
import { Button, ButtonGroup } from "@mui/material";
import BannerIcon from "./BannerIcon";
import SettingsTooltip from "../SettingsTooltip";
import classNames from "classnames";

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
            onClick={() => onUpdate("banner")}
          >
            <BannerIcon />
          </Button>
          <Button
            size="small"
            className={classNames({ toggled: variant === "box" })}
            variant="contained"
            onClick={() => onUpdate("box")}
          >
            <CheckBoxOutlineBlankOutlined />
          </Button>
        </ButtonGroup>
      }
    >
      {/* The trigger icon changes based on selection */}
      {variant === "banner" ? <BannerIcon /> : <CheckBoxOutlineBlankOutlined />}
    </SettingsTooltip>
  );
}
