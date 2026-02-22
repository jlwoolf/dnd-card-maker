import { useState } from "react";
import { Box } from "@mui/material";
import { Card, Deck, DeckView, GlobalSnackbar } from "./components";

function App() {
  const [isDeckViewOpen, setIsDeckViewOpen] = useState(false);

  return (
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
      {isDeckViewOpen && <DeckView onClose={() => setIsDeckViewOpen(false)} />}
    </Box>
  );
}

export default App;
