import { Height } from "@mui/icons-material";
import NumericToolbarInput from "../NumericToolbarInput";
import SettingsTooltip from "../SettingsTooltip";

interface LineHeightTooltipProps {
  /** Current line height percentage */
  lineHeight: number | undefined;
  /** Whether the tooltip is currently open */
  isOpen: boolean;
  /** Callback to close the tooltip */
  onClose: () => void;
  /** Callback triggered when the line height is updated */
  onUpdate: (val: number | undefined) => void;
}

/**
 * LineHeightTooltip provides an interactive interface for adjusting text 
 * line spacing (leading). It leverages NumericToolbarInput for consistent 
 * behavioral logic and styling.
 */
export default function LineHeightTooltip({
  lineHeight,
  isOpen,
  onClose,
  onUpdate,
}: LineHeightTooltipProps) {
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
        <NumericToolbarInput 
          value={lineHeight} 
          onUpdate={onUpdate} 
          min={10} 
          step={10} 
        />
      }
    >
      <Height />
    </SettingsTooltip>
  );
}
