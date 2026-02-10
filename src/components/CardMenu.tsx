import { DoDisturb, Image, Palette, Replay, TextFields } from "@mui/icons-material";
import { IconButton, Paper } from "@mui/material";
import { useElementRegistry } from "./Card/Element/useElementRegistry";
import { useSnackbar } from "./useSnackbar";
import { useState } from "react";
import ColorSettingsModal from "./ColorSettingsModal";

export default function CardMenu({ anchorEl }: { anchorEl: HTMLElement | null }) {
  const { registerElement, reset } = useElementRegistry();
  const showSnackbar = useSnackbar((state) => state.showSnackbar);
  const [colorModalOpen, setColorModalOpen] = useState(false);

  return (
    <>
      <Paper
        sx={(theme) => ({
          width: "100%",
          borderTopLeftRadius: "0px",
          borderTopRightRadius: "0px",
          backgroundColor: theme.palette.grey[300],
        })}
        className="card-menu"
      >
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
      </Paper>
      <ColorSettingsModal 
        open={colorModalOpen} 
        onClose={() => setColorModalOpen(false)} 
        anchorEl={anchorEl}
      />
    </>
  );
}
