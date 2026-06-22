import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import AuthPageLayout from "@src/components/AuthPageLayout";
import { useAuthStore } from "@src/stores/useAuthStore";
import { extractApiError } from "@src/utils/apiErrors";

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: unknown) {
      setError(extractApiError(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout onSubmit={handleSubmit} dataTestId="login-form">
      <Typography variant="h5" gutterBottom>
        Login
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
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
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
        sx={{ mt: 2, mb: 2 }}
      >
        {loading ? "Logging in..." : "Login"}
      </Button>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Link component={RouterLink} to="/register" variant="body2">
          Create account
        </Link>
        <Link component={RouterLink} to="/forgot-password" variant="body2">
          Forgot password?
        </Link>
      </div>
    </AuthPageLayout>
  );
}
