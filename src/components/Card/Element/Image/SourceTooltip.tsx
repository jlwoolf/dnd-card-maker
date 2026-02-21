import { useRef, type ChangeEvent } from "react";
import {
  Link as LinkIcon,
  Folder as FolderIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Divider,
} from "@mui/material";
import SettingsTooltip from "../SettingsTooltip";

interface SourceTooltipProps {
  /** Current image source URL or data URL */
  src: string;
  /** Whether the tooltip is open */
  isOpen: boolean;
  /** Callback to close the tooltip */
  onClose: () => void;
  /** Callback when the source value is updated */
  onUpdate: (val: string) => void;
}

/**
 * SourceTooltip allows users to provide an image source via URL or by uploading a local file.
 */
const SourceTooltip = ({
  src,
  isOpen,
  onClose,
  onUpdate,
}: SourceTooltipProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Triggers the hidden file input.
   */
  const handleFolderClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handles local file selection and generates a blob URL.
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
