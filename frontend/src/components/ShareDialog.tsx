import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useState } from "react";

type ShareMode = "view_only" | "view_and_copy";

interface ShareDialogProps {
  /** Whether the dialog is visible. */
  open: boolean;
  /** Called when the dialog is dismissed. */
  onClose: () => void;
  /** Entity label used in title and button text (e.g. "Card" or "Deck"). */
  entityType: "card" | "deck";
  /** The shareable URL, or empty string when no share exists yet. */
  shareUrl: string;
  /** The currently active share mode. */
  shareMode: ShareMode;
  /** Whether the entity already has an active share link. */
  hasExistingShare: boolean;
  /** Called when the user picks a different share mode. */
  onShareModeChange: (mode: ShareMode) => void;
  /** Called to create or update the share link. */
  onShare: () => void;
  /** Called to remove the share link entirely. */
  onUnshare: () => void;
  /** Called after the share URL is copied to the clipboard. */
  onCopyLink: () => void;
}

/** Shared dialog for creating, updating, and removing share links.

  Replaces 3 separate inline share dialog definitions in CloudDeckView,
  CloudDeckListView, and CloudDeckPreview that shared the same structure
  but diverged in 7 subtle ways.
*/
export default function ShareDialog({
  open,
  onClose,
  entityType,
  shareUrl,
  shareMode,
  hasExistingShare,
  onShareModeChange,
  onShare,
  onUnshare,
  onCopyLink,
}: ShareDialogProps) {
  const [copyFeedback, setCopyFeedback] = useState(false);

  const title = hasExistingShare
    ? "Manage Share"
    : `Share ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`;

  const actionLabel = hasExistingShare
    ? "Update"
    : "Create Link";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
    onCopyLink();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {hasExistingShare && shareUrl && (
          <TextField
            value={shareUrl}
            slotProps={{ input: { readOnly: true } }}
            label="Share Link"
            fullWidth
            size="small"
            sx={{ mt: 1, mb: 2 }}
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
        )}

        <ToggleButtonGroup
          value={shareMode}
          exclusive
          onChange={(_, value) => value && onShareModeChange(value)}
          size="small"
          fullWidth
          sx={{ mb: 2 }}
        >
          <ToggleButton value="view_only">View Only</ToggleButton>
          <ToggleButton value="view_and_copy">View &amp; Copy</ToggleButton>
        </ToggleButtonGroup>

        {hasExistingShare && shareUrl && (
          <Button
            variant="outlined"
            size="small"
            fullWidth
            onClick={handleCopy}
            startIcon={<ContentCopyIcon />}
            sx={{ mb: 1 }}
          >
            {copyFeedback ? "Copied!" : "Copy Link"}
          </Button>
        )}

        <Button
          variant="contained"
          onClick={onShare}
          fullWidth
          sx={{ mb: hasExistingShare ? 1 : 0 }}
        >
          {actionLabel}
        </Button>

        {hasExistingShare && (
          <Button
            variant="outlined"
            color="error"
            onClick={onUnshare}
            fullWidth
          >
            Remove
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
