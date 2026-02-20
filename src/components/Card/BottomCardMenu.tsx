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
        <IconButton onClick={() => registerElement("text")}>
          <TextFields />
        </IconButton>
        <IconButton onClick={() => registerElement("image")}>
          <Image />
        </IconButton>
        <IconButton onClick={() => setColorModalOpen(true)}>
          <Palette />
        </IconButton>
        <IconButton
          onClick={() => {
            reset(true);
            showSnackbar("Reset to default card", "info");
          }}
        >
          <Replay />
        </IconButton>
        <IconButton
          onClick={() => {
            reset();
            showSnackbar("Card cleared", "warning");
          }}
        >
          <DoDisturb />
        </IconButton>
      </CardMenu>
      <ColorSettingsModal
        open={colorModalOpen}
        onClose={() => setColorModalOpen(false)}
        anchorEl={anchorEl}
      />
    </>
  );
}
