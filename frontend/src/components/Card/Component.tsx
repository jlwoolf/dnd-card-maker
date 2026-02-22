import { Box } from "@mui/material";
import CardButtons from "./CardButtons";
import EditCard from "./EditCard";
import { ElementRefProvider } from "./ElementRefContext";
import { PreviewCard } from "./Preview";

/**
 * Main Card component that orchestrates the editor and preview views.
 * Wraps children in an ElementRefProvider to share DOM references for image generation.
 */
export default function Card() {
  return (
    <ElementRefProvider>
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
          marginTop: { xs: theme.spacing(-4), md: "unset" },
        })}
      >
        <EditCard />
        <PreviewCard />
      </Box>
      <CardButtons />
    </ElementRefProvider>
  );
}
