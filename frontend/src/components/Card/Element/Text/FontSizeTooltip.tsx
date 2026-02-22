import { FormatSize } from "@mui/icons-material";
import NumericToolbarInput from "../NumericToolbarInput";
import SettingsTooltip from "../SettingsTooltip";

interface FontSizeTooltipProps {
  /** Current font size in pixels */
  size: number | undefined;
  /** Whether the tooltip is currently open */
  isOpen: boolean;
  /** Callback to close the tooltip */
  onClose: () => void;
  /** Callback triggered when the font size is updated */
  onUpdate: (val: number | undefined) => void;
}

/**
 * FontSizeTooltip provides an interactive interface for adjusting text font size.
 * It leverages NumericToolbarInput for consistent behavioral logic and styling.
 */
export default function FontSizeTooltip({
  size,
  isOpen,
  onClose,
  onUpdate,
}: FontSizeTooltipProps) {
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
          value={size} 
          onUpdate={onUpdate} 
          min={1} 
        />
      }
    >
      <FormatSize />
    </SettingsTooltip>
  );
}
