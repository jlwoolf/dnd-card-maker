/** Deck and shared-deck API endpoints. */

import api from "./client";
import type { Element } from "@src/schemas";
import type { SnakeTheme } from "./types";
import type {
  DeckResponse,
  DeckSummary,
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
    cards: Array<{ id?: string; elements: Element[]; img_url: string; theme: SnakeTheme }>;
  }) => api.put<DeckResponse>("/decks/autosave", data),
};

export const sharedDeckApi = {
  get: (slug: string) => api.get<SharedDeckData>(`/shared/decks/${slug}`),
};
