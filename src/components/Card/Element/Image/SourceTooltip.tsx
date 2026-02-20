import { useRef, type ChangeEvent } from "react";
import { Link as LinkIcon, Folder as FolderIcon } from "@mui/icons-material";
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Divider,
  type PopperProps,
} from "@mui/material";
import { Image as ImageIcon } from "@mui/icons-material";
import SettingsTooltip from "../SettingsTooltip";

interface SourceTooltipProps {
  src: string;
  isOpen: boolean;
  onClose: (popperRef?: PopperProps["popperRef"]) => void;
  onUpdate: (val: string) => void;
}

const SourceTooltip = ({
  src,
  isOpen,
  onClose,
  onUpdate,
}: SourceTooltipProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger the hidden file input click
  const handleFolderClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create a local URL for the file to display immediately
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
          {/* Hidden File Input */}
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
                // Left side: Link Icon
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkIcon sx={{ fontSize: 16 }} />
                  </InputAdornment>
                ),
                // Right side: Divider | Folder Icon
                endAdornment: (
                  <InputAdornment position="end" sx={{ marginLeft: 1 }}>
                    <Divider
                      orientation="vertical"
                      variant="middle"
                      flexItem
                      sx={{
                        height: 16,
                        mx: 1, // Margin for spacing around the pipe
                      }}
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
                sx: {
                  minWidth: 200,
                },
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
