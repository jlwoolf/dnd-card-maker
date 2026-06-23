/** Deck and shared-deck API endpoints. */

import api from "./client";
import type { Element } from "@src/schemas";
import type { SnakeTheme } from "./types";
import type {
  DeckResponse,
  DeckSummary,
  LocalDeckResponse,
  SharedDeckData,
} from "./types";

export const deckApi = {
  list: () => api.get<DeckSummary[]>("/decks"),
  get: (id: string) => api.get<DeckResponse>(`/decks/${id}`),
  create: (data: { title: string; card_ids: string[] }) =>
    api.post<DeckResponse>("/decks", data),
  save: (data: {
    title: string;
    cards?: Array<{ id?: string; elements: Element[]; img_url: string; theme: SnakeTheme }>;
    deck_id?: string;
    card_ids?: string[];
  }) => api.post<DeckResponse>("/decks/save", data),
  uploadCards: (data: {
    cards: Array<{ id?: string; elements: Element[]; img_url: string; theme: SnakeTheme }>;
  }) => api.post<{ card_ids: string[] }>("/decks/save/cards", data),
  update: (id: string, data: { title?: string; card_ids?: string[] }) =>
    api.put<DeckResponse>(`/decks/${id}`, data),
  delete: (id: string) => api.delete(`/decks/${id}`),
  share: (id: string, mode: "view_only" | "view_and_copy") =>
    api.post<DeckResponse>(`/decks/${id}/share`, { mode }),
  unshare: (id: string) => api.delete(`/decks/${id}/share`),

  getAutosave: () => api.get<DeckResponse | null>("/decks/autosave"),
  saveAutosave: (data: {
    cards: Array<{ id?: string; elements: Element[]; img_url?: string; theme: SnakeTheme }>;
  }) => api.put<DeckResponse>("/decks/autosave", data),
};

/** Guest (unauthenticated) local-deck auto-save API. */
export const localDeckApi = {
  get: (deckId: string) => api.get<LocalDeckResponse>(`/decks/local/${deckId}`),
  save: (deckId: string, data: {
    cards: Array<{ elements: Element[]; img_url: string; theme: SnakeTheme }>;
    editing_cloud_deck_id?: string | null;
    editing_cloud_deck_title?: string | null;
  }) => api.put<LocalDeckResponse>(`/decks/local/${deckId}`, data),
};

export const sharedDeckApi = {
  get: (slug: string) => api.get<SharedDeckData>(`/shared/decks/${slug}`),
};
