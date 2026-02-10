import { Box } from "@mui/material";
import { Card, Deck } from "./components"; // Your existing Card

function App() {
  return (
    <Box
      display="flex"
      width="100vw"
      height="100vh"
      justifyContent="center"
      alignItems="center"
    >
      <Card />
      <Deck />
    </Box>
  );
}

export default App;
