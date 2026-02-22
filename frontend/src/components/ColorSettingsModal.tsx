import { Close, Restore } from "@mui/icons-material";
import {
  Box,
  Button,
  IconButton,
  Popover,
  Stack,
  Typography,
} from "@mui/material";
import { usePreviewTheme } from "./Card/Preview";
import { ColorPicker } from "./ColorPicker";
import { DEFAULT_THEME } from "@src/schemas";

interface ColorSettingsModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Anchor element for the popover */
  anchorEl: HTMLElement | null;
}

/**
 * ColorSettingsModal provides a comprehensive panel to adjust the thematic colors of the card.
 * Users can customize background fills, stroke/border colors, and specific styles for 
 * banner and box text elements.
 */
export default function ColorSettingsModal({
  open,
  onClose,
  anchorEl,
}: ColorSettingsModalProps) {
  const { fill, stroke, bannerFill, boxFill, boxText, bannerText, setTheme } =
    usePreviewTheme();

  /**
   * Resets all theme colors to their default values.
   */
  const handleReset = () => {
    setTheme(DEFAULT_THEME);
  };

  return (
    <Popover
      open={open}
      onClose={onClose}
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "center",
      }}
      transformOrigin={{
        vertical: "bottom",
        horizontal: "center",
      }}
      hideBackdrop
      slotProps={{
        paper: {
          sx: {
            width: anchorEl?.clientWidth,
            height: anchorEl?.clientHeight,
            padding: 0,
            boxShadow: 8,
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            pointerEvents: "auto",
          },
        },
        root: {
          sx: { pointerEvents: "none", zIndex: 1000 },
        },
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        paddingY={1}
        paddingX={2}
      >
        <Typography variant="h6">Card Colors</Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </Box>
      <Stack spacing={2} sx={{ overflowY: "auto", flexGrow: 1, padding: 2 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Background Fill
          </Typography>
          <ColorPicker
            value={fill}
            onChange={(color) => setTheme({ fill: color })}
          />
        </Box>
        <Box>
          <Typography variant="h5" gutterBottom>
            Stroke / Border
          </Typography>
          <ColorPicker
            value={stroke}
            onChange={(color) => setTheme({ stroke: color })}
          />
        </Box>
        <Box>
          <Typography variant="h5" gutterBottom>
            Banner
          </Typography>
          <Typography variant="caption" gutterBottom>
            Background
          </Typography>
          <ColorPicker
            value={bannerFill}
            onChange={(color) => setTheme({ bannerFill: color })}
          />
          <Typography variant="caption" gutterBottom>
            Text
          </Typography>
          <ColorPicker
            value={bannerText}
            onChange={(color) => setTheme({ bannerText: color })}
          />
        </Box>
        <Box>
          <Typography variant="h5" gutterBottom>
            Box
          </Typography>
          <Typography variant="caption" gutterBottom>
            Background
          </Typography>
          <ColorPicker
            value={boxFill}
            onChange={(color) => setTheme({ boxFill: color })}
          />
          <Typography variant="caption" gutterBottom>
            Text
          </Typography>
          <ColorPicker
            value={boxText}
            onChange={(color) => setTheme({ boxText: color })}
          />
        </Box>

        <Button
          variant="outlined"
          startIcon={<Restore />}
          onClick={handleReset}
          fullWidth
          sx={{ mt: "auto", pt: 1 }}
        >
          Reset Defaults
        </Button>
      </Stack>
    </Popover>
  );
}
