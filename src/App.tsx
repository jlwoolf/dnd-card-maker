import { Box } from "@mui/material";
import { Card, Deck, GlobalSnackbar } from "./components";

function App() {
  return (
    <Box
      display="flex"
      width="100vw"
      height="100vh"
      justifyContent="center"
      alignItems="center"
    >
      <GlobalSnackbar />
      <Card />
      <Deck />
    </Box>
  );
}

export default App;
