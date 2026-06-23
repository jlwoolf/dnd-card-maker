import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import {
  Box,
  CircularProgress,
  CssBaseline,
} from "@mui/material";
import { Card, Deck, DeckView, GlobalSnackbar } from "./components";
import CloudDeckView from "./components/Cloud/CloudDeckView";
import CloudDeckListView from "./components/Cloud/CloudDeckListView";
import ErrorBoundary from "./components/ErrorBoundary";
import NavBar from "./components/NavBar";
import SaveDeckDialog from "./components/SaveDeckDialog";
import { ExportContextProvider } from "./components/ExportModal";
import ExportModal from "./components/ExportModal/Component";
import { useResponsiveZoom } from "./hooks/useResponsiveZoom";
import { useAutosave } from "./hooks/useAutosave";
import AdminPage from "./pages/AdminPage";
import DevMailPage from "./pages/DevMailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SettingsPage from "./pages/SettingsPage";
import SharedCardPage from "./pages/SharedCardPage";
import SharedDeckPage from "./pages/SharedDeckPage";
import VerifyPage from "./pages/VerifyPage";
import { useAuthStore } from "./stores/useAuthStore";
import { CONTENT_MIN_HEIGHT } from "./theme/constants";

function EditorPage() {
  const [isDeckViewOpen, setIsDeckViewOpen] = useState(false);
  const { isColumn } = useResponsiveZoom();

  return (
    <Box
      data-testid="app-root"
      display="flex"
      width="100%"
      sx={{
        height: { xs: undefined, md: isColumn ? undefined : CONTENT_MIN_HEIGHT },
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

function GuestRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppContent() {
  const { checkAuth, isLoading } = useAuthStore();
  const [isCloudDeckOpen, setIsCloudDeckOpen] = useState(false);
  const [isDeckListOpen, setIsDeckListOpen] = useState(false);
  const [isSaveDeckOpen, setIsSaveDeckOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useAutosave();

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
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/verify/:token" element={<GuestRoute><VerifyPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password/:token" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
        <Route path="/share/:shareSlug" element={<SharedCardPage />} />
        <Route path="/share/deck/:shareSlug" element={<SharedDeckPage />} />
        {!import.meta.env.PROD && (
          <Route path="/mail" element={<DevMailPage />} />
        )}
        {!import.meta.env.PROD && (
          <Route path="/admin" element={<AdminPage />} />
        )}
        <Route path="*" element={<NotFoundPage />} />
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
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </BrowserRouter>
  );
}
