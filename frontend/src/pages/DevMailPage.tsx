import { useCallback, useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { DeleteSweep, Refresh } from "@mui/icons-material";
import { devMailApi } from "@src/services/api";

interface MailSummary {
  id: string;
  to_email: string;
  subject: string;
  sent_at: string;
}

export default function DevMailPage() {
  const [emails, setEmails] = useState<MailSummary[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedBody, setExpandedBody] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await devMailApi.list();
      setEmails(res.data);
    } catch {
      setError("Failed to load emails. Is the dev mail feature enabled on the backend?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleToggle = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedBody(null);
      return;
    }
    setExpandedId(id);
    try {
      const res = await devMailApi.get(id);
      setExpandedBody(res.data.html_body);
    } catch {
      setExpandedBody("<p style='color:red'>Failed to load email body</p>");
    }
  };

  const handleClear = async () => {
    try {
      await devMailApi.clear();
      setEmails([]);
      setExpandedId(null);
      setExpandedBody(null);
    } catch {
      setError("Failed to clear emails");
    }
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", p: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Dev Mail</Typography>
        <Box display="flex" gap={1}>
          <IconButton onClick={fetchList} disabled={loading} aria-label="Refresh">
            <Refresh />
          </IconButton>
          <IconButton onClick={handleClear} disabled={loading || emails.length === 0} aria-label="Clear all">
            <DeleteSweep />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {loading && emails.length === 0 && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={32} />
        </Box>
      )}

      {!loading && emails.length === 0 && !error && (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
          No emails yet. Emails will appear here when the app sends them.
        </Typography>
      )}

      <List disablePadding>
        {emails.map((email) => (
          <Box key={email.id}>
            <ListItemButton
              onClick={() => handleToggle(email.id)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                bgcolor: expandedId === email.id ? "action.selected" : "transparent",
              }}
            >
              <ListItemText
                primary={email.subject}
                secondary={`To: ${email.to_email} · ${formatTime(email.sent_at)}`}
                primaryTypographyProps={{ fontWeight: expandedId === email.id ? 600 : 400 }}
              />
            </ListItemButton>
            {expandedId === email.id && expandedBody !== null && (
              <Box
                sx={{
                  mx: 2,
                  mb: 2,
                  p: 2,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  bgcolor: "background.paper",
                }}
              >
                <Box
                  dangerouslySetInnerHTML={{ __html: expandedBody }}
                  sx={{
                    "& img": { maxWidth: "100%" },
                    "& a": { color: "primary.main" },
                  }}
                />
              </Box>
            )}
          </Box>
        ))}
      </List>
    </Box>
  );
}
