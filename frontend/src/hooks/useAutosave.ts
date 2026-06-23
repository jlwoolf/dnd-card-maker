import { useEffect, useRef } from "react";
import { v4 as uuid } from "uuid";
import useExportCards from "@src/stores/useExportCards";
import { useAuthStore } from "@src/stores/useAuthStore";
import { deckApi, localDeckApi } from "@src/services/api/decks";
import type { DeckCardEntry, LocalDeckResponse } from "@src/services/api/types";
import { getCardImageUrl } from "@src/utils/cardImageUrl";
import { themeFromSnake, themeToSnake } from "@src/utils/themeHelpers";

/** localStorage key holding the guest deck UUID (a few bytes, not the full deck). */
const LOCAL_DECK_ID_KEY = "dnd-autosave-id";
/** localStorage key for editing-context metadata (cloud deck ID / title). */
const CONTEXT_KEY = "dnd-autosave-context";
/** Milliseconds to wait after the last deck change before persisting. */
const DEBOUNCE_MS = 2500;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getLocalDeckId(): string {
  let id = localStorage.getItem(LOCAL_DECK_ID_KEY);
  if (!id) {
    id = uuid();
    localStorage.setItem(LOCAL_DECK_ID_KEY, id);
  }
  return id;
}

function loadEditingContext(): { editingCloudDeckId: string | null; editingCloudDeckTitle: string | null } | null {
  try {
    const raw = localStorage.getItem(CONTEXT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveEditingContext(ctx: { editingCloudDeckId: string | null; editingCloudDeckTitle: string | null }): void {
  localStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx));
}

/**
 * Fetch an image from a URL and convert it to a base64 data URL.
 * Used on logout to convert cloud-hosted card images to self-contained
 * base64 so they remain visible without an auth token.
 */
function imageUrlToBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

/* ------------------------------------------------------------------ */
/*  Hook                                                              */
/* ------------------------------------------------------------------ */

/**
 * ``useAutosave`` automatically persists the local deck (useExportCards)
 * so that the same cards are restored when the user returns.
 *
 * - **Authenticated users** → backend ``/api/decks/autosave``
 * - **Guest users**         → backend ``/api/decks/local/{id}`` (only
 *   the ID is stored in ``localStorage`` — avoids quota limits)
 *
 * Saving is **debounced** (2.5 s) to avoid excessive writes.
 * Editing-context (which cloud deck is being edited) is stored alongside
 * the cards in the same backend payload.
 */
export function useAutosave(): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  const cards = useExportCards((s) => s.cards);
  const setCards = useExportCards((s) => s.setCards);
  const editingCloudDeckId = useExportCards((s) => s.editingCloudDeckId);
  const editingCloudDeckTitle = useExportCards((s) => s.editingCloudDeckTitle);
  const setEditingCloudDeck = useExportCards((s) => s.setEditingCloudDeck);

  /** JSON snapshot of the last *persisted* cards — prevents saving unchanged data. */
  const lastPersistedRef = useRef<string>("[]");
  /** Whether the initial load has finished (prevents saving during bootstrap). */
  const readyRef = useRef(false);
  /** Debounce timer handle. */
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Tracks previous isAuthenticated to detect login/logout transitions. */
  const prevAuthRef = useRef(isAuthenticated);
  /** Prevents the load effect from re-running during the logout image-conversion flow. */
  const isLoggingOutRef = useRef(false);

  /* ---------------------------------------------------------------- */
  /*  Load autosave on mount (after auth check completes)              */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (isLoading) return;
    // Skip reload during logout — images are being converted
    if (isLoggingOutRef.current) return;

    // Only load on initial mount or when user logs in (guest → authenticated)
    const wasAuthenticated = prevAuthRef.current;
    const isLogin = !wasAuthenticated && isAuthenticated;
    const isFirstLoad = !readyRef.current;

    if (!isFirstLoad && !isLogin) {
      return;
    }

    const load = async () => {
      if (isAuthenticated) {
        // ── Authenticated: pull from backend ──────────────────────
        try {
          const res = await deckApi.getAutosave();
          const serverCards = res.data?.cards;
          if (serverCards && serverCards.length > 0) {
            const loaded = serverCards.map((c: DeckCardEntry) => ({
              id: c.id,
              elements: c.elements,
              imgUrl: c.img_url ?? "",
              theme: themeFromSnake(c.theme),
              cloudCardId: c.id,
              thumbnailUrl: undefined as string | undefined,
            }));
            setCards(loaded as Parameters<typeof setCards>[0]);
            lastPersistedRef.current = JSON.stringify(loaded);
          } else {
            // No backend autosave — try migrating guest local-deck data
            try {
              const localId = localStorage.getItem(LOCAL_DECK_ID_KEY);
              if (localId) {
                const localRes = await localDeckApi.get(localId);
                const localCards = localRes.data.cards;
                if (localCards && localCards.length > 0) {
                  const loaded = localCards.map(
                    (c: LocalDeckResponse["cards"][number]) => ({
                      id: uuid(),
                      elements: c.elements,
                      imgUrl: c.img_url ?? "",
                      theme: themeFromSnake(c.theme),
                    }),
                  );
                  setCards(loaded as Parameters<typeof setCards>[0]);
                  lastPersistedRef.current = JSON.stringify(loaded);
                  setEditingCloudDeck(
                    localRes.data.editing_cloud_deck_id ?? null,
                    localRes.data.editing_cloud_deck_title ?? null,
                  );
                }
              }
            } catch {
              /* no guest data to migrate */
            }
          }
        } catch {
          /* network / server error — keep current (empty) deck */
        }

        // Restore editing context from localStorage
        const ctx = loadEditingContext();
        if (ctx) {
          setEditingCloudDeck(ctx.editingCloudDeckId, ctx.editingCloudDeckTitle);
        }
      } else {
        // ── Guest: pull from backend local deck ───────────────────
        const localId = localStorage.getItem(LOCAL_DECK_ID_KEY);
        if (localId) {
          try {
            const res = await localDeckApi.get(localId);
            const localCards = res.data.cards;
            if (localCards && localCards.length > 0) {
              const loaded = localCards.map(
                (c: LocalDeckResponse["cards"][number]) => ({
                  id: uuid(),
                  elements: c.elements,
                  imgUrl: c.img_url ?? "",
                  theme: themeFromSnake(c.theme),
                }),
              );
              setCards(loaded as Parameters<typeof setCards>[0]);
              lastPersistedRef.current = JSON.stringify(loaded);
            }
            setEditingCloudDeck(
              res.data.editing_cloud_deck_id ?? null,
              res.data.editing_cloud_deck_title ?? null,
            );
          } catch {
            /* 404 or network error — start fresh */
          }
        }
        // Fallback: restore editing context from localStorage
        const ctx = loadEditingContext();
        if (ctx) {
          setEditingCloudDeck(ctx.editingCloudDeckId, ctx.editingCloudDeckTitle);
        }
      }

      readyRef.current = true;
    };

    load();
    prevAuthRef.current = isAuthenticated;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated]);

  /* ---------------------------------------------------------------- */
  /*  Logout: convert cloud images to base64 before clearing tokens   */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (isLoading) return;

    const wasAuthenticated = prevAuthRef.current;
    const isLogout = wasAuthenticated && !isAuthenticated;

    if (!isLogout) return;

    isLoggingOutRef.current = true;

    const convertAndFinish = async () => {
      const state = useExportCards.getState();
      const currentCards = [...state.cards];
      let changed = false;

      // Convert cloud-hosted images to base64 for cards that lack a local image
      for (const card of currentCards) {
        if (card.cloudCardId && !card.imgUrl) {
          try {
            const imageUrl = getCardImageUrl(card.cloudCardId, 0.6);
            card.imgUrl = await imageUrlToBase64(imageUrl);
            card.cloudCardId = undefined;
            changed = true;
          } catch {
            // Image fetch failed — clear the cloud reference
            card.cloudCardId = undefined;
            changed = true;
          }
        }
      }

      if (changed) {
        useExportCards.setState({ cards: currentCards });
        lastPersistedRef.current = JSON.stringify(currentCards);
      }

      // Persist the converted deck to the guest local-deck backend
      try {
        const deckId = getLocalDeckId();
        const cardData = currentCards.map((card) => ({
          elements: card.elements,
          img_url: card.imgUrl,
          theme: themeToSnake(card.theme),
        }));
        await localDeckApi.save(deckId, {
          cards: cardData,
          editing_cloud_deck_id: state.editingCloudDeckId,
          editing_cloud_deck_title: state.editingCloudDeckTitle,
        });
        saveEditingContext({
          editingCloudDeckId: state.editingCloudDeckId,
          editingCloudDeckTitle: state.editingCloudDeckTitle,
        });
      } catch {
        /* network error — deck will be available locally until next save */
      }

      // Now it's safe to clear tokens
      useAuthStore.getState().completeLogout();
      isLoggingOutRef.current = false;
      prevAuthRef.current = false;
    };

    convertAndFinish();
  }, [isAuthenticated, isLoading]);

  /* ---------------------------------------------------------------- */
  /*  Persist on changes (debounced)                                  */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (!readyRef.current) return;

    const currentSnapshot = JSON.stringify(cards);

    // No change since last persist — skip
    if (currentSnapshot === lastPersistedRef.current) return;

    // Debounce: clear any pending save and start a new timer
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const snapshot = JSON.stringify(cards);

      // Persist editing context to localStorage (lightweight, works for both auth/guest)
      saveEditingContext({ editingCloudDeckId, editingCloudDeckTitle });

      if (isAuthenticated) {
        // ── Authenticated: save to /api/decks/autosave ────────────
        const cardData = cards.map((card) => {
          const item: {
            id?: string;
            elements: typeof card.elements;
            img_url?: string;
            theme: ReturnType<typeof themeToSnake>;
          } = {
            id: card.cloudCardId || undefined,
            elements: card.elements,
            theme: themeToSnake(card.theme),
          };
          if (card.imgUrl) item.img_url = card.imgUrl;
          return item;
        });
        deckApi
          .saveAutosave({ cards: cardData })
          .then(() => {
            lastPersistedRef.current = snapshot;
          })
          .catch(() => {
            /* network error — try again next change */
          });
      } else {
        // ── Guest: save to /api/decks/local/{id} ──────────────────
        const deckId = getLocalDeckId();
        const cardData = cards.map((card) => ({
          elements: card.elements,
          img_url: card.imgUrl,
          theme: themeToSnake(card.theme),
        }));
        localDeckApi
          .save(deckId, {
            cards: cardData,
            editing_cloud_deck_id: editingCloudDeckId,
            editing_cloud_deck_title: editingCloudDeckTitle,
          })
          .then(() => {
            lastPersistedRef.current = snapshot;
          })
          .catch(() => {
            /* network error — try again next change */
          });
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [cards, isAuthenticated, editingCloudDeckId, editingCloudDeckTitle]);
}
