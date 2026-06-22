import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Link as RouterLink,
  Route,
  Routes,
} from "react-router-dom";
import {
  AppBar,
  Box,
  Button,
  CircularProgress,
  CssBaseline,
  Toolbar,
  Typography,
} from "@mui/material";
import { Card, Deck, DeckView, GlobalSnackbar } from "./components";
import CloudDeckView from "./components/CloudDeckView";
import CloudDeckListView from "./components/CloudDeckListView";
import SaveDeckDialog from "./components/SaveDeckDialog";
import { ExportContextProvider } from "./components/ExportModal";
import ExportModal from "./components/ExportModal/Component";
import { useResponsiveZoom } from "./hooks/useResponsiveZoom";
import AdminPage from "./pages/AdminPage";
import DevMailPage from "./pages/DevMailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SharedCardPage from "./pages/SharedCardPage";
import VerifyPage from "./pages/VerifyPage";
import { useAuthStore } from "./stores/useAuthStore";

function EditorPage() {
  const [isDeckViewOpen, setIsDeckViewOpen] = useState(false);
  const { isColumn } = useResponsiveZoom();

  return (
    <Box
      data-testid="app-root"
      display="flex"
      width="100%"
      sx={{
        height: { xs: undefined, md: isColumn ? undefined : "calc(100vh - 48px)" },
        overflow: { xs: "auto", md: isColumn ? "auto" : "hidden" },
        py: { xs: 1, md: 2.5 },
      }}
      justifyContent="center"
      alignItems={isColumn ? "flex-start" : "center"}
    >
      <Card />
      <Deck onOpenDeckView={() => setIsDeckViewOpen(true)} />
      {isDeckViewOpen && (
        <DeckView onClose={() => setIsDeckViewOpen(false)} />
      )}
    </Box>
  );
}

function NavBar({ onOpenCloudDeck, onOpenDecks }: { onOpenCloudDeck: () => void; onOpenDecks: () => void }) {
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: "#48534b", minHeight: 48, zIndex: 1100 }}>
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

function AppContent() {
  const { checkAuth, isLoading } = useAuthStore();
  const [isCloudDeckOpen, setIsCloudDeckOpen] = useState(false);
  const [isDeckListOpen, setIsDeckListOpen] = useState(false);
  const [isSaveDeckOpen, setIsSaveDeckOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ExportContextProvider initialValue={false}>
      <CssBaseline />
      <NavBar
        onOpenCloudDeck={() => setIsCloudDeckOpen(true)}
        onOpenDecks={() => setIsDeckListOpen(true)}
      />
      <Routes>
        <Route path="/" element={<EditorPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify/:token" element={<VerifyPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/share/:shareSlug" element={<SharedCardPage />} />
        {!import.meta.env.PROD && (
          <Route path="/mail" element={<DevMailPage />} />
        )}
        {!import.meta.env.PROD && (
          <Route path="/admin" element={<AdminPage />} />
        )}
      </Routes>
      {isCloudDeckOpen && (
        <CloudDeckView onClose={() => setIsCloudDeckOpen(false)} />
      )}
      {isDeckListOpen && (
        <CloudDeckListView onClose={() => setIsDeckListOpen(false)} />
      )}
      <SaveDeckDialog
        open={isSaveDeckOpen}
        onClose={() => setIsSaveDeckOpen(false)}
      />
      <GlobalSnackbar />
      <ExportModal />
    </ExportContextProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppContent />
    </BrowserRouter>
  );
}
