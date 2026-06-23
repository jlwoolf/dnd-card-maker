import { useCallback, useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
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
import { ArrowBack, Preview } from "@mui/icons-material";
import { adminApi, type DeckResponse } from "@src/services/api";

const SIDEBAR_WIDTH = 240;
const PAGE_SIZE = 100;

const SKIP_COLUMNS = new Set([
  "html_body",
  "elements",
  "theme",
  "img_url",
  "password_hash",
  "verify_token",
  "reset_token",
  "reset_expires",
]);

function formatValue(val: unknown): string {
  if (val === null) return "null";
  if (val === undefined) return "";
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "number") return String(val);
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function getDisplayColumns(rows: Record<string, unknown>[]): string[] {
  if (rows.length === 0) return [];
  return Object.keys(rows[0]).filter((k) => !SKIP_COLUMNS.has(k));
}

export default function AdminPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewImgUrl, setPreviewImgUrl] = useState<string | null>(null);
  const [deckCards, setDeckCards] = useState<DeckResponse["cards"] | null>(null);

  const parentRef = useRef<HTMLDivElement>(null);
  const fetchingRef = useRef(false);

  // Fetch tables on mount
  useEffect(() => {
    adminApi
      .getTables()
      .then((res) => setTables(res.data.tables))
      .catch(() => setError("Failed to load tables"));
  }, []);

  // Reset and load rows when table changes
  const loadTable = useCallback(async (table: string) => {
    setSelectedTable(table);
    setRows([]);
    setTotal(0);
    setError("");
    setLoading(true);
    fetchingRef.current = false;
    if (parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
    try {
      const res = await adminApi.getRows(table, 0, PAGE_SIZE);
      setRows(res.data.rows);
      setTotal(res.data.total);
    } catch {
      setError("Failed to load rows");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!selectedTable || fetchingRef.current || loadingMore) return;
    setLoadingMore(true);
    fetchingRef.current = true;
    try {
      const res = await adminApi.getRows(selectedTable, rows.length, PAGE_SIZE);
      setRows((prev) => {
        // Avoid duplicate appends if state changed during fetch
        if (prev.length >= res.data.total) return prev;
        return [...prev, ...res.data.rows];
      });
      setTotal(res.data.total);
    } catch {
      // silently fail on load-more
    } finally {
      setLoadingMore(false);
      fetchingRef.current = false;
    }
  }, [selectedTable, rows.length, loadingMore]);

  // Scroll handler for infinite scroll
  const handleScroll = useCallback(() => {
    if (!parentRef.current || fetchingRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    if (scrollHeight - scrollTop - clientHeight < 400 && rows.length < total) {
      loadMore();
    }
  }, [loadMore, rows.length, total]);

  const hasMore = rows.length < total;

  const virtualizer = useVirtualizer({
    count: rows.length + (hasMore ? 1 : 0),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 10,
  });

  const displayColumns = rows.length > 0 ? getDisplayColumns(rows) : [];

  const handlePreviewCard = (row: Record<string, unknown>) => {
    const title =
      (typeof row.title === "string" && row.title) ||
      (typeof row.id === "string" && row.id) ||
      "Card";
    setPreviewTitle(title);
    setPreviewImgUrl(typeof row.img_url === "string" ? row.img_url : null);
    setDeckCards(null);
    setPreviewOpen(true);
  };

  const handlePreviewDeck = async (row: Record<string, unknown>) => {
    const id = typeof row.id === "string" ? row.id : "";
    if (!id) return;
    const title = (typeof row.title === "string" && row.title) || id;
    setPreviewTitle(title);
    setPreviewImgUrl(null);
    setDeckCards(null);
    setPreviewOpen(true);
    try {
      const res = await adminApi.getDeck(id);
      setDeckCards(res.data.cards);
    } catch {
      setDeckCards([]);
    }
  };

  const handleBack = () => {
    setSelectedTable(null);
    setRows([]);
    setTotal(0);
  };

  const showCardPreview = selectedTable === "cards";
  const showDeckPreview = selectedTable === "decks";

  const tableList = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar
        variant="dense"
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          minHeight: 48,
          px: 2,
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          Tables
        </Typography>
      </Toolbar>

      {error && !selectedTable && (
        <Typography color="error" variant="body2" sx={{ p: 2 }}>
          {error}
        </Typography>
      )}

      <Box sx={{ flex: 1, overflow: "auto" }}>
        <List disablePadding>
          {tables.map((table) => (
            <ListItemButton
              key={table}
              selected={selectedTable === table}
              onClick={() => loadTable(table)}
              sx={{ borderBottom: 1, borderColor: "divider" }}
            >
              <ListItemText
                primary={table.replace(/_/g, " ")}
                primaryTypographyProps={{
                  variant: "body2",
                  fontWeight: selectedTable === table ? 600 : 400,
                  textTransform: "capitalize",
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Box>
  );

  const mainContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
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
        <IconButton size="small" onClick={handleBack} aria-label="Back to table list">
          <ArrowBack fontSize="small" />
        </IconButton>
        <Typography variant="subtitle1" sx={{ textTransform: "capitalize" }}>
          {selectedTable?.replace(/_/g, " ")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
          {total.toLocaleString()} rows
        </Typography>
      </Toolbar>

      {error && (
        <Typography color="error" variant="body2" sx={{ p: 2 }}>
          {error}
        </Typography>
      )}

      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={24} />
        </Box>
      )}

      {!loading && rows.length === 0 && !error && (
        <Typography
          color="text.secondary"
          variant="body2"
          sx={{ p: 2, textAlign: "center" }}
        >
          No rows in this table.
        </Typography>
      )}

      {!loading && rows.length > 0 && (
        <Box
          ref={parentRef}
          onScroll={handleScroll}
          sx={{
            flex: 1,
            overflow: "auto",
            bgcolor: "background.paper",
          }}
        >
          <Box
            sx={{
              height: virtualizer.getTotalSize(),
              position: "relative",
              width: "100%",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const isLoader = virtualItem.index >= rows.length;
              if (isLoader) {
                return (
                  <Box
                    key="loader"
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualItem.start}px)`,
                      height: 52,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {hasMore ? (
                      <CircularProgress size={20} />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        End of data
                      </Typography>
                    )}
                  </Box>
                );
              }

              const row = rows[virtualItem.index];
              return (
                <Box
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualItem.start}px)`,
                    borderBottom: 1,
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    px: 2,
                    minHeight: 52,
                    py: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      gap: 1.5,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    {displayColumns.map((col) => {
                      const val = formatValue(row[col]);
                      return (
                        <Typography
                          key={col}
                          variant="caption"
                          sx={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: 200,
                          }}
                        >
                          <Box component="span" sx={{ color: "text.secondary" }}>
                            {col.replace(/_/g, " ")}:
                          </Box>{" "}
                          {val}
                        </Typography>
                      );
                    })}
                  </Box>

                  {showCardPreview && (
                    <IconButton
                      size="small"
                      onClick={() => handlePreviewCard(row)}
                      aria-label="Preview card"
                      sx={{ flexShrink: 0, ml: 1 }}
                    >
                      <Preview fontSize="small" />
                    </IconButton>
                  )}

                  {showDeckPreview && (
                    <IconButton
                      size="small"
                      onClick={() => handlePreviewDeck(row)}
                      aria-label="Preview deck"
                      sx={{ flexShrink: 0, ml: 1 }}
                    >
                      <Preview fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );

  const previewDialog = (
    <Dialog
      open={previewOpen}
      onClose={() => setPreviewOpen(false)}
      maxWidth={deckCards ? "md" : "sm"}
      fullWidth
    >
      <DialogTitle>{previewTitle}</DialogTitle>
      <DialogContent>
        {previewImgUrl && (
          <Box
            component="img"
            src={previewImgUrl}
            alt={previewTitle}
            sx={{
              width: "100%",
              maxWidth: 300,
              display: "block",
              mx: "auto",
              borderRadius: 1,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
          />
        )}

        {deckCards === null && !previewImgUrl && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={24} />
          </Box>
        )}

        {deckCards && deckCards.length === 0 && (
          <Typography color="text.secondary" textAlign="center">
            No cards in this deck.
          </Typography>
        )}

        {deckCards && deckCards.length > 0 && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 2,
              maxHeight: 500,
              overflow: "auto",
            }}
          >
            {deckCards.map((card) => (
              <Box
                key={card.id}
                sx={{
                  borderRadius: 1,
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                }}
              >
                <Box
                  component="img"
                  src={card.img_url}
                  alt={card.title || card.id}
                  sx={{
                    width: "100%",
                    display: "block",
                    aspectRatio: "5/7",
                    objectFit: "cover",
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{ display: "block", textAlign: "center", p: 0.5 }}
                >
                  {card.title || card.id.slice(0, 8)}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );

  if (isMobile) {
    return (
      <>
        <Box sx={{ height: "calc(100vh - 48px)", overflow: "hidden" }}>
          {selectedTable ? mainContent : tableList}
        </Box>
        {previewDialog}
      </>
    );
  }

  return (
    <>
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
          {tableList}
        </Drawer>

        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: "hidden",
            bgcolor: "background.default",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {!selectedTable && (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="100%"
            >
              <Typography color="text.secondary">
                Select a table from the sidebar to view its rows.
              </Typography>
            </Box>
          )}

          {selectedTable && mainContent}
        </Box>
      </Box>
      {previewDialog}
    </>
  );
}
