import axios from "axios";
import type { Element } from "@src/schemas";

const API_BASE = import.meta.env.BASE_URL + "api";

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.removeItem("access_token");
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        localStorage.setItem("access_token", data.access_token);
        processQueue(null, data.access_token);
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;

/** Theme colours as received from the API (snake_case keys). */
export interface SnakeTheme {
  fill: string;
  banner_fill: string;
  box_fill: string;
  stroke: string;
  banner_text: string;
  box_text: string;
}

export interface CloudCardSummary {
  id: string;
  title: string | null;
  img_url: string;
  saved: boolean;
  created_at: string;
  updated_at: string;
  share_slug: string | null;
  share_mode: string | null;
}

export interface CloudCard {
  id: string;
  user_id: string;
  title: string | null;
  elements: Element[];
  img_url: string;
  theme: SnakeTheme;
  share_slug: string | null;
  share_mode: string | null;
  share_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SharedCard {
  id: string;
  title: string | null;
  elements: Element[];
  img_url: string;
  theme: SnakeTheme;
  mode: string | null;
  can_copy: boolean;
}

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

export interface DeckSummary {
  id: string;
  title: string;
  is_default: boolean;
  card_count: number;
  first_card_id: string | null;
  share_slug: string | null;
  share_mode: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeckCardEntry {
  id: string;
  title: string | null;
  saved: boolean;
  elements: Element[];
  theme: SnakeTheme;
  img_url: string;
  share_slug: string | null;
  share_mode: string | null;
}

export interface SharedDeckCardEntry {
  id: string;
  title: string | null;
  elements: Element[];
  theme: SnakeTheme;
  img_url: string;
  share_slug: string | null;
  share_mode: string | null;
}

export interface SharedDeckData {
  id: string;
  title: string;
  cards: SharedDeckCardEntry[];
  mode: string | null;
  can_copy: boolean;
}

export interface DeckResponse {
  id: string;
  title: string;
  is_default: boolean;
  cards: DeckCardEntry[];
  share_slug: string | null;
  share_mode: string | null;
}

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
};

export const sharedDeckApi = {
  get: (slug: string) => api.get<SharedDeckData>(`/shared/decks/${slug}`),
};

export const sharedApi = {
  get: (slug: string) => api.get<SharedCard>(`/shared/${slug}`),
};

export interface MailSummary {
  id: string;
  to_email: string;
  subject: string;
  sent_at: string;
}

export interface MailFull extends MailSummary {
  html_body: string;
}

export const devMailApi = {
  list: () => api.get<MailSummary[]>("/dev/mail"),
  get: (id: string) => api.get<MailFull>(`/dev/mail/${id}`),
  clear: () => api.delete("/dev/mail"),
};

export interface AdminTableRows {
  rows: Record<string, unknown>[];
  total: number;
  offset: number;
  limit: number;
}

export const userApi = {
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<{ message: string }>("/users/me/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    }),
  updateEmail: (newEmail: string, password: string) =>
    api.put<{ message: string }>("/users/me/email", {
      new_email: newEmail,
      password,
    }),
  deleteAccount: (password: string) =>
    api.delete<{ message: string }>("/users/me", {
      data: { password },
    }),
};

export const adminApi = {
  getTables: () => api.get<{ tables: string[] }>("/admin/tables"),
  getRows: (table: string, offset: number, limit: number) =>
    api.get<AdminTableRows>("/admin/" + table, { params: { offset, limit } }),
  getCard: (id: string) => api.get<CloudCard>(`/admin/cards/${id}`),
  getDeck: (id: string) => api.get<DeckResponse>(`/admin/decks/${id}`),
};
