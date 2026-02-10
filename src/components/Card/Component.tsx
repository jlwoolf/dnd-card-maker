import { Box } from "@mui/material";
import { PreviewCard } from "./Preview";
import EditCard from "./EditCard";

export default function Card() {
  return (
    <Box
      width="100%"
      display="flex"
      justifyContent="center"
      sx={(theme) => ({
        flexDirection: { xs: "column", md: "row" },
        gap: theme.spacing(1),
        alignItems: { xs: "center", md: "flex-start" },
        scale: { xs: 0.8, md: 1 },
        transformOrigin: "center center",
        marginTop: { xs: theme.spacing(-8), md: 'unset' },
      })}
    >
      <EditCard />
      <PreviewCard />
    </Box>
  );
}
