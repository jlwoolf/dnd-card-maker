import { Box } from "@mui/material";
import { useResponsiveZoom } from "@src/hooks/useResponsiveZoom";
import CardButtons from "./CardButtons";
import EditCard from "./EditCard";
import { ElementRefProvider } from "./ElementRefContext";
import { PreviewCard } from "./Preview";

/**
 * The main Card orchestrator component. 
 * It coordinates the layout between the interactive editor (EditCard) and the 
 * high-fidelity preview (PreviewCard). It also wraps everything in an ElementRefProvider 
 * to share DOM references required for image capture and portal-based menu positioning.
 */
export default function Card() {
  const { zoom, isColumn } = useResponsiveZoom();

  return (
    <ElementRefProvider>
      <Box
        component="main"
        role="main"
        aria-label="Card Editor"
        data-testid="card-editor-container"
        width="100%"
        display="flex"
        justifyContent="center"
        sx={(theme) => ({
          flexDirection: isColumn ? "column" : { xs: "column", md: "row" },
          gap: theme.spacing(1),
          alignItems: isColumn ? "center" : { xs: "center", md: "flex-start" },
          zoom,
        })}
      >
        <EditCard />
        <PreviewCard />
      </Box>
      <CardButtons />
    </ElementRefProvider>
  );
}
