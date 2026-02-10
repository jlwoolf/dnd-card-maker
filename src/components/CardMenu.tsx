import { DoDisturb, Image, Replay, TextFields } from "@mui/icons-material";
import { IconButton, Paper } from "@mui/material";
import { useElementRegistry } from "./Card/Element/useElementRegistry";
export default function CardMenu() {
  const { registerElement, reset } = useElementRegistry();

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
        <IconButton onClick={() => reset(true)}>
          <Replay />
        </IconButton>
        <IconButton onClick={() => reset()}>
          <DoDisturb />
        </IconButton>
      </Paper>
    </>
  );
}
