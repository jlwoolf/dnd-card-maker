import { Link as RouterLink } from "react-router-dom";
import {
  AppBar,
  Button,
  Toolbar,
  Typography,
} from "@mui/material";
import { Z_INDEX } from "@src/theme/constants";
import { useAuthStore } from "@src/stores/useAuthStore";

interface NavBarProps {
  onOpenCloudDeck: () => void;
  onOpenDecks: () => void;
}

/** Top navigation bar with app title, auth-dependent controls, and overlay toggles.

  Extracted from ``App.tsx`` (previously a nested function inside ``AppContent``)
  so it can be independently tested and styled.
*/
export default function NavBar({ onOpenCloudDeck, onOpenDecks }: NavBarProps) {
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{ bgcolor: "#48534b", minHeight: 48, zIndex: Z_INDEX.toolbar }}
    >
      <Toolbar variant="dense" sx={{ minHeight: 48, px: 2 }}>
        <Typography
          variant="subtitle1"
          component={RouterLink}
          to="/"
          sx={{ flexGrow: 1, textDecoration: "none", color: "inherit", fontWeight: 600 }}
        >
          DnD Card Maker
        </Typography>
        {isAuthenticated ? (
          <>
            <Button
              color="inherit"
              size="small"
              onClick={onOpenCloudDeck}
              sx={{ textTransform: "none", mr: 1 }}
            >
              My Cards
            </Button>
            <Button
              color="inherit"
              size="small"
              onClick={onOpenDecks}
              sx={{ textTransform: "none", mr: 1 }}
            >
              Decks
            </Button>
            <Typography variant="caption" sx={{ mr: 1, opacity: 0.8 }}>
              {user?.email}
            </Typography>
            <Button
              color="inherit"
              size="small"
              onClick={logout}
              sx={{ textTransform: "none" }}
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button
              color="inherit"
              size="small"
              component={RouterLink}
              to="/login"
              sx={{ textTransform: "none" }}
            >
              Login
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
