import { useEffect, useRef, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import AuthPageLayout from "@src/components/AuthPageLayout";
import { useAuthStore } from "@src/stores/useAuthStore";
import { extractApiError } from "@src/utils/apiErrors";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: {
        sitekey: string;
        callback?: (token: string) => void;
        "error-callback"?: (errorCode: string) => void;
        "expired-callback"?: () => void;
        "timeout-callback"?: () => void;
      }) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
    __onTurnstileLoad?: () => void;
  }
}

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

export default function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [turnstileError, setTurnstileError] = useState("");
  const turnstileContainerId = useRef(`cf-turnstile-${crypto.randomUUID()}`);
  const turnstileTokenRef = useRef<string>("");
  const turnstileWidgetId = useRef<string>("");

  useEffect(() => {
    window.__onTurnstileLoad = () => {
      if (!window.turnstile) return;
      turnstileWidgetId.current = window.turnstile.render(`#${turnstileContainerId.current}`, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => {
          turnstileTokenRef.current = token;
          setTurnstileError("");
        },
        "error-callback": (errorCode: string) => {
          turnstileTokenRef.current = "";
          setTurnstileError(`CAPTCHA error (${errorCode}). Please refresh the page and try again.`);
        },
        "expired-callback": () => {
          turnstileTokenRef.current = "";
        },
        "timeout-callback": () => {
          turnstileTokenRef.current = "";
        },
      });
    };

    if (window.turnstile) {
      window.__onTurnstileLoad();
    }

    return () => {
      delete window.__onTurnstileLoad;
      try {
        if (turnstileWidgetId.current && window.turnstile) {
          window.turnstile.remove(turnstileWidgetId.current);
        }
      } catch { /* widget already removed from DOM */ }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await register(email, password, turnstileTokenRef.current);
      setSuccess(true);
    } catch (err: unknown) {
      setError(extractApiError(err, "Registration failed"));
      if (turnstileWidgetId.current && window.turnstile) {
        window.turnstile.reset(turnstileWidgetId.current);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthPageLayout>
        <Alert severity="success" sx={{ mb: 2 }}>
          Registration successful! Check your email to verify your account.
        </Alert>
        <Button variant="contained" onClick={() => navigate("/login")}>
          Go to Login
        </Button>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout onSubmit={handleSubmit} dataTestId="register-form">
      <Typography variant="h5" gutterBottom>
        Create Account
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {turnstileError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {turnstileError}
        </Alert>
      )}

      <TextField
        label="Email"
        type="email"
        fullWidth
        margin="normal"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoFocus
      />
      <TextField
        label="Password"
        type="password"
        fullWidth
        margin="normal"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        helperText="At least 8 characters"
      />
      <TextField
        label="Confirm Password"
        type="password"
        fullWidth
        margin="normal"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      <Box id={turnstileContainerId.current} sx={{ mt: 2, display: "flex", justifyContent: "center" }} />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
        sx={{ mt: 2, mb: 2 }}
      >
        {loading ? "Creating account..." : "Register"}
      </Button>

      <Link component={RouterLink} to="/login" variant="body2">
        Already have an account? Login
      </Link>
    </AuthPageLayout>
  );
}
