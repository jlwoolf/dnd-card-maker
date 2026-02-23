import { useState } from "react";
import {
  DoDisturb,
  Image,
  Palette,
  Replay,
  TextFields,
} from "@mui/icons-material";
import { IconButton } from "@mui/material";
import ColorSettingsModal from "../ColorSettingsModal";
import Tooltip from "../Tooltip";
import { useSnackbar } from "../useSnackbar";
import { useActiveCardStore } from "@src/stores/useActiveCardStore";
import CardMenu from "./CardMenu";

interface BottomCardMenuProps {
  /** The element used to anchor the color settings modal popover */
  anchorEl: HTMLElement | null;
}

/**
 * BottomCardMenu provides the primary action suite for the card editor.
 * It allows users to insert new elements (Text/Image), configure the overall 
 * card theme colors, and perform reset or clear operations.
 */
export default function BottomCardMenu({ anchorEl }: BottomCardMenuProps) {
  const { registerElement, reset } = useActiveCardStore();
  const showSnackbar = useSnackbar((state) => state.showSnackbar);
  const [colorModalOpen, setColorModalOpen] = useState(false);

  /**
   * Resets the card elements and theme to the system default state.
   */
  const handleResetToDefault = () => {
    reset(true);
    showSnackbar("Reset to default card", "info");
  };

  /**
   * Removes all elements from the current card, resulting in a blank canvas.
   */
  const handleClearCard = () => {
    reset();
    showSnackbar("Card cleared", "warning");
  };

  return (
    <>
      <CardMenu role="toolbar" aria-label="Card element actions" data-testid="bottom-card-menu">
        <Tooltip title="Insert Text">
          <IconButton onClick={() => registerElement("text")} data-testid="add-text-btn" aria-label="Add text element">
            <TextFields />
          </IconButton>
        </Tooltip>
        <Tooltip title="Insert Image">
          <IconButton onClick={() => registerElement("image")} data-testid="add-image-btn" aria-label="Add image element">
            <Image />
          </IconButton>
        </Tooltip>
        <Tooltip title="Configure Colors">
          <IconButton onClick={() => setColorModalOpen(true)} data-testid="open-colors-btn" aria-label="Open color settings">
            <Palette />
          </IconButton>
        </Tooltip>
        <Tooltip title="Reset to Default">
          <IconButton onClick={handleResetToDefault} data-testid="reset-card-btn" aria-label="Reset card to default">
            <Replay />
          </IconButton>
        </Tooltip>
        <Tooltip title="Clear">
          <IconButton onClick={handleClearCard} data-testid="clear-card-btn" aria-label="Clear all elements">
            <DoDisturb />
          </IconButton>
        </Tooltip>
      </CardMenu>

      <ColorSettingsModal
        open={colorModalOpen}
        onClose={() => setColorModalOpen(false)}
        anchorEl={anchorEl}
      />
    </>
  );
}
