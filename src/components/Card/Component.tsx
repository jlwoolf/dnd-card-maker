import { Box } from "@mui/material";
import { PreviewCard } from "./Preview";
import EditCard from "./EditCard";

export default function Card() {
  return (
    <Box
      width="100%"
      display="flex"
      justifyContent="center"
      sx={(theme) => ({ gap: theme.spacing(1) })}
    >
      <EditCard />
      <PreviewCard />
    </Box>
  );
}