import { useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Alert,
  Button,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import AuthPageLayout from "@src/components/AuthPageLayout";
import api from "@src/services/api";
import { extractApiError } from "@src/utils/apiErrors";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
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
      await api.post(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
    } catch (err: unknown) {
      setError(extractApiError(err, "Reset failed"));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthPageLayout>
        <Alert severity="success" sx={{ mb: 2 }}>
          Password reset successfully!
        </Alert>
        <Button variant="contained" component={RouterLink} to="/login">
          Go to Login
        </Button>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout onSubmit={handleSubmit}>
      <Typography variant="h5" gutterBottom>
        Set New Password
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        label="New Password"
        type="password"
        fullWidth
        margin="normal"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoFocus
        helperText="At least 8 characters"
      />
      <TextField
        label="Confirm New Password"
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
        {loading ? "Resetting..." : "Reset Password"}
      </Button>

      <Link component={RouterLink} to="/login" variant="body2">
        Back to Login
      </Link>
    </AuthPageLayout>
  );
}
