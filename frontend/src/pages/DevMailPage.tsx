import { useCallback, useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { ArrowBack, DeleteSweep, Refresh } from "@mui/icons-material";
import { devMailApi, type MailSummary } from "@src/services/api";

const SIDEBAR_WIDTH = 320;

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString();
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const today = new Date().toLocaleDateString();
    return date === today ? time : `${date} ${time}`;
  } catch {
    return iso;
  }
}

export default function DevMailPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [emails, setEmails] = useState<MailSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedBody, setSelectedBody] = useState<string | null>(null);
  const [bodyLoading, setBodyLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await devMailApi.list();
      setEmails(res.data);
    } catch {
      setError("Failed to load emails.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
    const interval = setInterval(fetchList, 5000);
    return () => clearInterval(interval);
  }, [fetchList]);

  const handleSelect = async (id: string) => {
    if (selectedId === id) return;
    setSelectedId(id);
    setBodyLoading(true);
    setSelectedBody(null);
    try {
      const res = await devMailApi.get(id);
      setSelectedBody(res.data.html_body);
    } catch {
      setSelectedBody("<p style='color:red'>Failed to load email body</p>");
    } finally {
      setBodyLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedId(null);
    setSelectedBody(null);
  };

  const handleClear = async () => {
    try {
      await devMailApi.clear();
      setEmails([]);
      setSelectedId(null);
      setSelectedBody(null);
    } catch {
      setError("Failed to clear emails");
    }
  };

  const selectedEmail = emails.find((e) => e.id === selectedId);

  const emailList = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar
        variant="dense"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          borderBottom: 1,
          borderColor: "divider",
          minHeight: 48,
          px: 2,
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          Dev Mail
        </Typography>
        <Box display="flex" gap={0.5}>
          <IconButton size="small" onClick={fetchList} disabled={loading} aria-label="Refresh">
            <Refresh fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={handleClear}
            disabled={loading || emails.length === 0}
            aria-label="Clear all"
          >
            <DeleteSweep fontSize="small" />
          </IconButton>
        </Box>
      </Toolbar>

      {error && (
        <Typography color="error" variant="body2" sx={{ p: 2 }}>
          {error}
        </Typography>
      )}

      {loading && emails.length === 0 && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={24} />
        </Box>
      )}

      {!loading && emails.length === 0 && !error && (
        <Typography color="text.secondary" variant="body2" sx={{ p: 2, textAlign: "center" }}>
          No emails yet.
        </Typography>
      )}

      <Box sx={{ flex: 1, overflow: "auto" }}>
        <List disablePadding>
          {emails.map((email) => (
            <ListItemButton
              key={email.id}
              selected={selectedId === email.id}
              onClick={() => handleSelect(email.id)}
              sx={{ borderBottom: 1, borderColor: "divider" }}
            >
              <ListItemText
                primary={email.subject}
                secondary={`To: ${email.to_email}`}
                secondaryTypographyProps={{
                  noWrap: true,
                  variant: "caption",
                }}
                slotProps={{
                  primary: {
                    noWrap: true,
                    variant: "body2",
                    fontWeight: selectedId === email.id ? 600 : 400,
                  },
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ ml: 1, flexShrink: 0, alignSelf: "flex-start", mt: 0.5 }}
              >
                {formatTime(email.sent_at)}
              </Typography>
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Box>
  );

  const emailDetail = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "auto",
      }}
    >
      <Toolbar
        variant="dense"
        sx={{
          display: "flex",
          borderBottom: 1,
          borderColor: "divider",
          minHeight: 48,
          px: 2,
          gap: 1,
        }}
      >
        <IconButton size="small" onClick={handleBack} aria-label="Back to list">
          <ArrowBack fontSize="small" />
        </IconButton>
        <Typography variant="subtitle1" noWrap>
          {selectedEmail?.subject || "Email"}
        </Typography>
      </Toolbar>

      <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
        {selectedEmail && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedEmail.subject}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              To: {selectedEmail.to_email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sent: {formatTime(selectedEmail.sent_at)}
            </Typography>
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        {bodyLoading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={24} />
          </Box>
        )}

        {selectedBody && (
          <Box
            dangerouslySetInnerHTML={{ __html: selectedBody }}
            sx={{
              "& img": { maxWidth: "100%" },
              "& a": { color: "primary.main" },
              lineHeight: 1.7,
            }}
          />
        )}
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Box sx={{ height: "calc(100vh - 48px)", overflow: "hidden" }}>
        {selectedId ? emailDetail : emailList}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        height: "calc(100vh - 48px)",
        overflow: "hidden",
      }}
    >
      <Drawer
        variant="permanent"
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: SIDEBAR_WIDTH,
            boxSizing: "border-box",
            position: "static",
            height: "100%",
          },
        }}
      >
        {emailList}
      </Drawer>

      <Box
        component="main"
        sx={{
          flex: 1,
          overflow: "auto",
          bgcolor: "background.default",
        }}
      >
        {!selectedId && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <Typography color="text.secondary">
              Select an email from the list to view it.
            </Typography>
          </Box>
        )}

        {selectedId && (
          <Box sx={{ maxWidth: 780, mx: "auto", p: 3 }}>
            {selectedEmail && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedEmail.subject}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  To: {selectedEmail.to_email}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sent: {formatTime(selectedEmail.sent_at)}
                </Typography>
              </Box>
            )}

            <Divider sx={{ mb: 2 }} />

            {bodyLoading && (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress size={24} />
              </Box>
            )}

            {selectedBody && (
              <Box
                dangerouslySetInnerHTML={{ __html: selectedBody }}
                sx={{
                  "& img": { maxWidth: "100%" },
                  "& a": { color: "primary.main" },
                  lineHeight: 1.7,
                }}
              />
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
