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
  Toolbar,
  Typography,
} from "@mui/material";
import { Card, Deck, DeckView, GlobalSnackbar } from "./components";
import { ExportContextProvider } from "./components/ExportModal";
import ExportModal from "./components/ExportModal/Component";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SharedCardPage from "./pages/SharedCardPage";
import VerifyPage from "./pages/VerifyPage";
import DevMailPage from "./pages/DevMailPage";
import { useAuthStore } from "./stores/useAuthStore";

function EditorPage() {
  const [isDeckViewOpen, setIsDeckViewOpen] = useState(false);

  return (
    <Box
      data-testid="app-root"
      display="flex"
      width="100vw"
      sx={{
        height: { xs: undefined, md: "calc(100vh - 48px)" },
        overflow: "hidden",
      }}
      justifyContent="center"
      alignItems="center"
    >
      <Card />
      <Deck onOpenDeckView={() => setIsDeckViewOpen(true)} />
      {isDeckViewOpen && (
        <DeckView onClose={() => setIsDeckViewOpen(false)} />
      )}
    </Box>
  );
}

function NavBar() {
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
      <NavBar />
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
      </Routes>
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
