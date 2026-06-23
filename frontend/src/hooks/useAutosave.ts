import { useEffect, useRef } from "react";
import z from "zod";
import useExportCards from "@src/stores/useExportCards";
import { useAuthStore } from "@src/stores/useAuthStore";
import { deckApi } from "@src/services/api/decks";
import type { DeckCardEntry } from "@src/services/api/types";
import { CardSchema } from "@src/schemas";
import { themeFromSnake, themeToSnake } from "@src/utils/themeHelpers";

/** localStorage key for guest autosave deck data. */
const AUTOSAVE_KEY = "dnd-autosave-deck";
/** localStorage key for editing-context metadata (cloud deck ID / title). */
const AUTOSAVE_CONTEXT_KEY = "dnd-autosave-context";
/** Milliseconds to wait after the last deck change before persisting. */
const DEBOUNCE_MS = 2500;

interface AutosaveContext {
  editingCloudDeckId: string | null;
  editingCloudDeckTitle: string | null;
}

/* ------------------------------------------------------------------ */
/*  localStorage helpers                                              */
/* ------------------------------------------------------------------ */

function loadGuestCards(): z.infer<typeof CardSchema>[] | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    const result = z.array(CardSchema).safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

function saveGuestCards(cards: z.infer<typeof CardSchema>[]): void {
  localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(cards));
}

function loadContext(): AutosaveContext | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_CONTEXT_KEY);
    return raw ? (JSON.parse(raw) as AutosaveContext) : null;
  } catch {
    return null;
  }
}

function saveContext(ctx: AutosaveContext): void {
  localStorage.setItem(AUTOSAVE_CONTEXT_KEY, JSON.stringify(ctx));
}

/* ------------------------------------------------------------------ */
/*  Hook                                                              */
/* ------------------------------------------------------------------ */

/**
 * ``useAutosave`` automatically persists the local deck (useExportCards)
 * so that the same cards are restored when the user returns.
 *
 * - **Authenticated users** → backend ``/api/decks/autosave``
 * - **Guest users**         → ``localStorage``
 *
 * Saving is **debounced** (2.5 s) to avoid excessive writes.
 * Editing-context (which cloud deck is being edited) is stored in
 * ``localStorage`` and restored alongside the cards.
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
  const lastPersistedRef = useRef<string>("");
  /** Whether the initial load has finished (prevents saving during bootstrap). */
  const readyRef = useRef(false);
  /** Debounce timer handle. */
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------------------------------------------------------------- */
  /*  Load autosave on mount (after auth check completes)              */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (isLoading) return;

    const load = async () => {
      if (isAuthenticated) {
        // ── Authenticated: pull from backend ──────────────────────
        try {
          const res = await deckApi.getAutosave();
          const serverCards = res.data?.cards;
          if (serverCards && serverCards.length > 0) {
            const loaded = serverCards.map(
              (c: DeckCardEntry) => ({
                id: c.id,
                elements: c.elements,
                imgUrl: c.img_url ?? "",
                theme: themeFromSnake(c.theme),
                cloudCardId: c.id,
                thumbnailUrl: undefined as string | undefined,
              }),
            );
            setCards(loaded as Parameters<typeof setCards>[0]);
            lastPersistedRef.current = JSON.stringify(loaded);
          } else {
            // No backend autosave — try migrating guest data
            const guestCards = loadGuestCards();
            if (guestCards && guestCards.length > 0) {
              setCards(guestCards);
              lastPersistedRef.current = JSON.stringify(guestCards);
              // The change watcher below will persist to backend on next tick.
            }
          }
        } catch {
          /* network / server error — keep current (empty) deck */
        }

        // ── Restore editing context ───────────────────────────────
        const ctx = loadContext();
        if (ctx) {
          setEditingCloudDeck(ctx.editingCloudDeckId, ctx.editingCloudDeckTitle);
        }
      } else {
        // ── Guest: pull from localStorage ─────────────────────────
        const guestCards = loadGuestCards();
        if (guestCards) {
          setCards(guestCards);
          lastPersistedRef.current = JSON.stringify(guestCards);
        }
        const ctx = loadContext();
        if (ctx) {
          setEditingCloudDeck(ctx.editingCloudDeckId, ctx.editingCloudDeckTitle);
        }
      }

      readyRef.current = true;
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated]);

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

      // ── Always persist editing context ─────────────────────────
      saveContext({ editingCloudDeckId, editingCloudDeckTitle });

      // ── Persist cards ──────────────────────────────────────────
      if (isAuthenticated) {
        const cardData = cards.map((card) => ({
          id: card.cloudCardId || undefined,
          elements: card.elements,
          img_url: card.imgUrl,
          theme: themeToSnake(card.theme),
        }));
        deckApi
          .saveAutosave({ cards: cardData })
          .then(() => {
            lastPersistedRef.current = snapshot;
          })
          .catch(() => {
            /* network error — try again next change */
          });
      } else {
        saveGuestCards(cards);
        lastPersistedRef.current = snapshot;
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [cards, isAuthenticated, editingCloudDeckId, editingCloudDeckTitle]);
}
