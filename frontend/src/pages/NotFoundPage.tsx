import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import { DESIGN_TOKENS } from "@src/theme/constants";

export default function NotFoundPage() {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight={DESIGN_TOKENS.contentMinHeight}
      flexDirection="column"
      gap={2}
    >
      <Typography variant="h2" color="text.secondary">
        404
      </Typography>
      <Typography variant="h5">Page Not Found</Typography>
      <Button component={RouterLink} to="/" variant="contained">
        Go Home
      </Button>
    </Box>
  );
}
