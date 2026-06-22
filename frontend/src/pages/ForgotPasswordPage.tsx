import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err: unknown) {
      setError(extractApiError(err, "Request failed"));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthPageLayout>
        <Alert severity="success" sx={{ mb: 2 }}>
          If the email is registered, a reset link has been sent.
        </Alert>
        <Link component={RouterLink} to="/login">
          Back to Login
        </Link>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout onSubmit={handleSubmit}>
      <Typography variant="h5" gutterBottom>
        Reset Password
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

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
        sx={{ mt: 2, mb: 2 }}
      >
        {loading ? "Sending..." : "Send Reset Link"}
      </Button>

      <Link component={RouterLink} to="/login" variant="body2">
        Back to Login
      </Link>
    </AuthPageLayout>
  );
}
