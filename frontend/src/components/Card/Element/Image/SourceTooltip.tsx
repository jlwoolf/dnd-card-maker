import { type ChangeEvent, useRef } from "react";
import {
  Folder as FolderIcon,
  Image as ImageIcon,
  Link as LinkIcon,
} from "@mui/icons-material";
import {
  Box,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";
import SettingsTooltip from "../SettingsTooltip";

interface SourceTooltipProps {
  /** Current image source URL or data URL */
  src: string;
  /** Whether the tooltip is currently open */
  isOpen: boolean;
  /** Callback to close the tooltip */
  onClose: () => void;
  /** Callback triggered when the source value is updated */
  onUpdate: (val: string) => void;
}

/**
 * SourceTooltip provides a dual-input interface for updating an image source.
 * It supports both manual URL entry and local file uploads via the browser's 
 * file picker.
 */
const SourceTooltip = ({
  src,
  isOpen,
  onClose,
  onUpdate,
}: SourceTooltipProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Triggers the click event on the hidden file input element.
   */
  const handleFolderClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Processes the selected local file and converts it into a transient 
   * object URL for immediate preview.
   * 
   * @param event - The input change event.
   */
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      onUpdate(objectUrl);
    }
  };

  return (
    <SettingsTooltip
      open={isOpen}
      onClose={onClose}
      title={
        <Box p={1} display="flex" alignItems="center">
          <input
            type="file"
            hidden
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
          />

          <TextField
            size="small"
            placeholder="https://..."
            variant="standard"
            value={src}
            onChange={(e) => onUpdate(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkIcon sx={{ fontSize: 16 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end" sx={{ marginLeft: 1 }}>
                    <Divider
                      orientation="vertical"
                      variant="middle"
                      flexItem
                      sx={{ height: 16, mx: 1 }}
                    />
                    <IconButton
                      size="small"
                      onClick={handleFolderClick}
                      sx={{ padding: 0 }}
                    >
                      <FolderIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ),
                sx: { minWidth: 200 },
              },
            }}
          />
        </Box>
      }
    >
      <ImageIcon />
    </SettingsTooltip>
  );
};

export default SourceTooltip;
