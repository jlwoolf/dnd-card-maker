/** Card API endpoints. */

import api from "./client";
import type { SnakeTheme } from "./types";
import type { Element } from "@src/schemas";
import type { CloudCard, CloudCardSummary } from "./types";

export const cardApi = {
  list: () => api.get<CloudCardSummary[]>("/cards"),
  get: (id: string) => api.get<CloudCard>(`/cards/${id}`),
  create: (data: {
    title?: string | null;
    elements: Element[];
    img_url: string;
    theme: SnakeTheme;
  }) => api.post<CloudCard>("/cards", data),
  update: (
    id: string,
    data: Partial<{
      title: string | null;
      elements: Element[];
      img_url: string;
      theme: SnakeTheme;
    }>,
  ) => api.put<CloudCard>(`/cards/${id}`, data),
  delete: (id: string) => api.delete(`/cards/${id}`),
  share: (id: string, mode: "view_only" | "view_and_copy") =>
    api.post<CloudCard>(`/cards/${id}/share`, { mode }),
  unshare: (id: string) => api.delete(`/cards/${id}/share`),
  toggleSave: (id: string, action?: "save" | "unsave") =>
    api.post<{ message: string; saved: boolean }>(`/cards/${id}/toggle-save`, undefined, {
      params: action ? { action } : undefined,
    }),
  getDecks: (id: string) =>
    api.get<Array<{ deck_id: string; title: string; is_default: boolean }>>(
      `/cards/${id}/decks`,
    ),
  updateDecks: (id: string, deck_ids: string[]) =>
    api.put(`/cards/${id}/decks`, { deck_ids }),
};
