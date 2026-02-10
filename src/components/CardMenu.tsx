import { DoDisturb, Image, Replay, TextFields } from "@mui/icons-material";
import { IconButton, Paper } from "@mui/material";
import { useElementRegistry } from "./Card/Element/useElementRegistry";
import { useSnackbar } from "./useSnackbar";

export default function CardMenu() {
  const { registerElement, reset } = useElementRegistry();
  const showSnackbar = useSnackbar((state) => state.showSnackbar);

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
    </>
  );
}
