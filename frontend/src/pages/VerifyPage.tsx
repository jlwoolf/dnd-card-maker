import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Alert,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import AuthPageLayout from "@src/components/AuthPageLayout";
import api from "@src/services/api";

export default function VerifyPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    api
      .get(`/auth/verify/${token}`)
      .then((res) => {
        setStatus("success");
        setMessage(res.data.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.detail || "Verification failed");
      });
  }, [token]);

  return (
    <AuthPageLayout>
      {status === "loading" && <CircularProgress />}
      {status === "success" && (
        <>
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
          </Alert>
          <Button variant="contained" component={RouterLink} to="/login">
            Go to Login
          </Button>
        </>
      )}
      {status === "error" && (
        <>
          <Alert severity="error" sx={{ mb: 2 }}>
            {message}
          </Alert>
          <Typography variant="body2" color="text.secondary">
            The link may have expired or already been used.
          </Typography>
        </>
      )}
    </AuthPageLayout>
  );
}
