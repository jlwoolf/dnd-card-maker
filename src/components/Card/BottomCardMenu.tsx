import {
  DoDisturb,
  Image,
  Palette,
  Replay,
  TextFields,
} from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { useElementRegistry } from "./Element/useElementRegistry";
import { useSnackbar } from "../useSnackbar";
import { useState } from "react";
import ColorSettingsModal from "../ColorSettingsModal";
import CardMenu from "./CardMenu";
import Tooltip from "../Tooltip";

export default function BottomCardMenu({
  anchorEl,
}: {
  anchorEl: HTMLElement | null;
}) {
  const { registerElement, reset } = useElementRegistry();
  const showSnackbar = useSnackbar((state) => state.showSnackbar);
  const [colorModalOpen, setColorModalOpen] = useState(false);

  return (
    <>
      <CardMenu>
        <Tooltip title="Insert Text">
          <IconButton onClick={() => registerElement("text")}>
            <TextFields />
          </IconButton>
        </Tooltip>
        <Tooltip title="Insert Image">
          <IconButton onClick={() => registerElement("image")}>
            <Image />
          </IconButton>
        </Tooltip>
        <Tooltip title="Configure Colors">
          <IconButton onClick={() => setColorModalOpen(true)}>
            <Palette />
          </IconButton>
        </Tooltip>
        <Tooltip title="Reset to Default">
          <IconButton
            onClick={() => {
              reset(true);
              showSnackbar("Reset to default card", "info");
            }}
          >
            <Replay />
          </IconButton>
        </Tooltip>
        <Tooltip title="Clear">
          <IconButton
            onClick={() => {
              reset();
              showSnackbar("Card cleared", "warning");
            }}
          >
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
