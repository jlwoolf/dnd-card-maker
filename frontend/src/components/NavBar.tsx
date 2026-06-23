import { memo, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import { Z_INDEX } from "@src/theme/constants";
import { useAuthStore } from "@src/stores/useAuthStore";

interface NavBarProps {
  onOpenCloudDeck: () => void;
  onOpenDecks: () => void;
}

function NavBar({ onOpenCloudDeck, onOpenDecks }: NavBarProps) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleAvatarClick = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSettings = () => {
    handleClose();
    navigate("/settings");
  };

  const handleLogout = () => {
    handleClose();
    logout();
    navigate("/");
  };

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
            <IconButton onClick={handleAvatarClick} size="small" sx={{ p: 0 }}>
              <Avatar
                sx={{ width: 32, height: 32, bgcolor: "#6b8e73", fontSize: "0.875rem" }}
              >
                {user?.email?.charAt(0).toUpperCase() ?? "?"}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              slotProps={{ paper: { sx: { mt: 0.75 } } }}
            >
              <MenuItem onClick={handleSettings}>
                <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
                Settings
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </>
        ) : (
          <>
            <Button
              color="inherit"
              size="small"
              component={RouterLink}
              to="/register"
              sx={{ textTransform: "none", mr: 1 }}
            >
              Sign up
            </Button>
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

export default memo(NavBar);
