import { RoundedCorner } from "@mui/icons-material";
import SettingsTooltip from "../SettingsTooltip";
import SliderToolbarInput from "../SliderToolbarInput";

interface RadiusTooltipProps {
  /** Current radius value in pixels */
  radius: number;
  /** Whether the tooltip is currently open */
  isOpen: boolean;
  /** Callback to close the tooltip */
  onClose: () => void;
  /** Callback triggered when the radius value is committed */
  onUpdate: (val: number) => void;
}

/**
 * RadiusTooltip provides a specialized slider interface for adjusting 
 * the border-radius of image elements.
 */
const RadiusTooltip = ({
  radius,
  isOpen,
  onClose,
  onUpdate,
}: RadiusTooltipProps) => {
  return (
    <SettingsTooltip
      open={isOpen}
      onClose={onClose}
      title={
        <SliderToolbarInput
          label="Radius"
          value={radius}
          onUpdate={onUpdate}
          min={0}
          max={10}
          suffix="px"
          marks
        />
      }
    >
      <RoundedCorner />
    </SettingsTooltip>
  );
};

export default RadiusTooltip;
