import { useRef, type ChangeEvent } from "react";
import { Link as LinkIcon, Folder as FolderIcon } from "@mui/icons-material"; // Imported FolderIcon
import {
  Box,
  ClickAwayListener,
  TextField,
  Tooltip,
  InputAdornment,
  IconButton, // Imported IconButton
  Divider, // Imported Divider
  type PopperProps,
} from "@mui/material";
import { Image as ImageIcon } from "@mui/icons-material";
import { ICON_STYLES } from "../styles";
import usePopperRef from "../usePopperRef";

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
  const popperRef = usePopperRef();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    onClose();
  };

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
    <Tooltip
      open={isOpen}
      arrow
      slotProps={{
        popper: {
          popperRef,
          modifiers: [{ name: "offset", options: { offset: [0, -8] } }],
        },
        tooltip: {
          sx: (theme) => ({
            backgroundColor: theme.palette.primary.main,
            padding: 0,
          }),
        },
        arrow: { sx: (theme) => ({ color: theme.palette.primary.main }) },
      }}
      title={
        <ClickAwayListener onClickAway={handleClose}>
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
                      <LinkIcon sx={{ color: "white", fontSize: 16 }} />
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
                          borderColor: "rgba(255,255,255,0.5)",
                          height: 16,
                          mx: 1, // Margin for spacing around the pipe
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={handleFolderClick}
                        sx={{ padding: 0 }}
                      >
                        <FolderIcon sx={{ color: "white", fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    color: "white",
                    minWidth: 200,
                    "&:before": {
                      borderBottomColor: "white",
                    },
                    "&:hover:not(.Mui-disabled):before": {
                      borderBottomColor: "white",
                    },
                    "&:after": {
                      borderBottomColor: "white",
                    },
                  },
                },
              }}
            />
          </Box>
        </ClickAwayListener>
      }
    >
      <ImageIcon sx={ICON_STYLES} />
    </Tooltip>
  );
};

export default SourceTooltip;
