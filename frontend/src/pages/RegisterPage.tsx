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

export default function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

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
      await register(email, password);
      setSuccess(true);
    } catch (err: unknown) {
      setError(extractApiError(err, "Registration failed"));
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
