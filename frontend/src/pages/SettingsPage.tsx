import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import AuthPageLayout from "@src/components/AuthPageLayout";
import { userApi } from "@src/services/api";
import { useAuthStore } from "@src/stores/useAuthStore";
import { useSnackbar } from "@src/stores/useSnackbar";
import { extractApiError } from "@src/utils/apiErrors";

export default function SettingsPage() {
  const { user, isAuthenticated, logout, setUser } = useAuthStore();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setPasswordLoading(true);
    try {
      await userApi.changePassword(currentPassword, newPassword);
      showSnackbar("Password changed. Please log in again.", "success");
      logout();
      navigate("/login");
    } catch (err: unknown) {
      setPasswordError(extractApiError(err, "Failed to change password"));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");

    if (newEmail === user?.email) {
      setEmailError("New email is the same as your current email");
      return;
    }

    setEmailLoading(true);
    try {
      const { data } = await userApi.updateEmail(newEmail, emailPassword);
      setUser({ id: user!.id, email: newEmail });
      setNewEmail("");
      setEmailPassword("");
      showSnackbar(data.message, "success");
    } catch (err: unknown) {
      setEmailError(extractApiError(err, "Failed to update email"));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteDialogOpen(false);
    setDeleteError("");

    setDeleteLoading(true);
    try {
      await userApi.deleteAccount(deletePassword);
      showSnackbar("Account deleted", "success");
      logout();
      navigate("/");
    } catch (err: unknown) {
      setDeleteError(extractApiError(err, "Failed to delete account"));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      <Typography variant="h5" gutterBottom>
        Settings
      </Typography>

      {user && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {user.email}
        </Typography>
      )}

      <Divider sx={{ mb: 2 }} />

      {/* Change Password */}
      <Box component="form" onSubmit={handleChangePassword}>
        <Typography variant="subtitle1" gutterBottom>
          Change Password
        </Typography>

        {passwordError && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {passwordError}
          </Alert>
        )}

        <TextField
          label="Current password"
          type="password"
          fullWidth
          margin="dense"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <TextField
          label="New password"
          type="password"
          fullWidth
          margin="dense"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          inputProps={{ minLength: 8 }}
        />
        <TextField
          label="Confirm new password"
          type="password"
          fullWidth
          margin="dense"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          inputProps={{ minLength: 8 }}
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={passwordLoading}
          sx={{ mt: 1, mb: 2 }}
        >
          {passwordLoading ? "Changing..." : "Change Password"}
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Update Email */}
      <Box component="form" onSubmit={handleUpdateEmail}>
        <Typography variant="subtitle1" gutterBottom>
          Update Email
        </Typography>

        {emailError && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {emailError}
          </Alert>
        )}

        <TextField
          label="New email"
          type="email"
          fullWidth
          margin="dense"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          required
        />
        <TextField
          label="Current password"
          type="password"
          fullWidth
          margin="dense"
          value={emailPassword}
          onChange={(e) => setEmailPassword(e.target.value)}
          required
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={emailLoading}
          sx={{ mt: 1, mb: 2 }}
        >
          {emailLoading ? "Updating..." : "Update Email"}
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Delete Account */}
      <Typography variant="subtitle1" gutterBottom color="error">
        Delete Account
      </Typography>

      {deleteError && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {deleteError}
        </Alert>
      )}

      <TextField
        label="Current password"
        type="password"
        fullWidth
        margin="dense"
        value={deletePassword}
        onChange={(e) => setDeletePassword(e.target.value)}
        required
      />
      <Button
        variant="outlined"
        color="error"
        fullWidth
        disabled={deleteLoading || !deletePassword}
        onClick={() => setDeleteDialogOpen(true)}
        sx={{ mt: 1, mb: 2 }}
      >
        {deleteLoading ? "Deleting..." : "Delete Account"}
      </Button>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete your account and all associated cards and
            decks. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteAccount} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </AuthPageLayout>
  );
}
