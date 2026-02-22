import { WidthFull } from "@mui/icons-material";
import SettingsTooltip from "./SettingsTooltip";
import SliderToolbarInput from "./SliderToolbarInput";

interface WidthTooltipProps {
  /** Current width percentage (50-100) */
  width: number;
  /** Whether the tooltip is currently open */
  isOpen: boolean;
  /** Callback to close the tooltip */
  onClose: () => void;
  /** Callback triggered when the width value is committed */
  onUpdate: (val: number) => void;
}

/**
 * WidthTooltip provides a slider interface for adjusting the horizontal 
 * span of an element (Text or Image) within the card container.
 */
const WidthTooltip = ({
  width,
  isOpen,
  onClose,
  onUpdate,
}: WidthTooltipProps) => {
  return (
    <SettingsTooltip
      open={isOpen}
      onClose={onClose}
      title={
        <SliderToolbarInput
          label="Width"
          value={width}
          onUpdate={onUpdate}
          min={50}
          max={100}
          step={5}
          suffix="%"
          marks
        />
      }
    >
      <WidthFull />
    </SettingsTooltip>
  );
};

export default WidthTooltip;
