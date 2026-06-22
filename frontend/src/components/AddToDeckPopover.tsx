import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Popover,
  Typography,
} from "@mui/material";
import { cardApi, deckApi } from "@src/services/api";

interface AddToDeckPopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  cardId: string;
  onClose: () => void;
}

export default function AddToDeckPopover({
  open,
  anchorEl,
  cardId,
  onClose,
}: AddToDeckPopoverProps) {
  const [allDecks, setAllDecks] = useState<Array<{ id: string; title: string; is_default: boolean }>>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const [decksRes, selRes] = await Promise.all([
        deckApi.list(),
        cardApi.getDecks(cardId),
      ]);
      const decks = decksRes.data.map((d) => ({
        id: d.id,
        title: d.title,
        is_default: d.is_default,
      }));
      const defFirst = decks.sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
      setAllDecks(defFirst);
      setSelectedIds(new Set(selRes.data.map((d) => d.deck_id)));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [open, cardId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleDeck = async (deckId: string) => {
    const next = new Set(selectedIds);
    if (next.has(deckId)) {
      next.delete(deckId);
    } else {
      next.add(deckId);
    }
    setSelectedIds(next);
    try {
      await cardApi.updateDecks(cardId, [...next]);
    } catch {
      // revert on failure
    }
  };

  const content = (
    <Box sx={{ p: 1.5, minWidth: 200, maxHeight: 300, overflow: "auto" }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Add to Deck
      </Typography>
      {loading && (
        <Box display="flex" justifyContent="center" py={2}>
          <CircularProgress size={20} />
        </Box>
      )}
      {!loading &&
        allDecks.map((deck) => (
          <FormControlLabel
            key={deck.id}
            control={
              <Checkbox
                size="small"
                checked={selectedIds.has(deck.id)}
                onChange={() => toggleDeck(deck.id)}
              />
            }
            label={
              <Typography variant="body2">
                {deck.title}
                {deck.is_default && (
                  <Typography component="span" variant="caption" color="text.secondary">
                    {" "}
                    (default)
                  </Typography>
                )}
              </Typography>
            }
            sx={{ display: "flex", ml: 0, mr: 0 }}
          />
        ))}
    </Box>
  );

  if (!anchorEl) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle>Add to Deck</DialogTitle>
        <DialogContent>
          {loading && (
            <Box display="flex" justifyContent="center" py={2}>
              <CircularProgress size={20} />
            </Box>
          )}
          {!loading &&
            allDecks.map((deck) => (
              <FormControlLabel
                key={deck.id}
                control={
                  <Checkbox
                    size="small"
                    checked={selectedIds.has(deck.id)}
                    onChange={() => toggleDeck(deck.id)}
                  />
                }
                label={
                  <Typography variant="body2">
                    {deck.title}
                    {deck.is_default && (
                      <Typography component="span" variant="caption" color="text.secondary">
                        {" "}
                        (default)
                      </Typography>
                    )}
                  </Typography>
                }
                sx={{ display: "flex", ml: 0, mr: 0 }}
              />
            ))}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "center", horizontal: "center" }}
      transformOrigin={{ vertical: "center", horizontal: "center" }}
    >
      {content}
    </Popover>
  );
}
