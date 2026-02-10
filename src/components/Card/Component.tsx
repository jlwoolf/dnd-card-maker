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
        flexDirection: { xs: 'column', md: 'row' },
        gap: theme.spacing(1),
        alignItems: { xs: 'center', md: 'flex-start' } // Optional: centers cards when stacked
      })}
    >
      <EditCard />
      <PreviewCard />
    </Box>
  );
}