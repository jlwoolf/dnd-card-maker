import { useState } from "react";
import { Box } from "@mui/material";
import { Card, Deck, DeckView, GlobalSnackbar } from "./components";
import { ExportContextProvider } from "./components/ExportModal";
import ExportModal from "./components/ExportModal/Component";

/**
 * The root application component that orchestrates the card editor,
 * deck management, and global overlays like snackbars and modals.
 */
function App() {
  const [isDeckViewOpen, setIsDeckViewOpen] = useState(false);

  return (
    <ExportContextProvider initialValue={false}>
      <Box
        display="flex"
        width="100vw"
        sx={{
          height: { xs: undefined, md: "100vh" },
        }}
        justifyContent="center"
        alignItems="center"
      >
        <GlobalSnackbar />
        <Card />
        <Deck onOpenDeckView={() => setIsDeckViewOpen(true)} />
        {isDeckViewOpen && (
          <DeckView onClose={() => setIsDeckViewOpen(false)} />
        )}
        <ExportModal />
      </Box>
    </ExportContextProvider>
  );
}

export default App;
