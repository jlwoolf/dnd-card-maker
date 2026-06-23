/** Admin, dev-mail, and user-settings API endpoints. */

import api from "./client";
import type { CloudCard, DeckResponse, AdminTableRows, MailFull, MailSummary } from "./types";

export const devMailApi = {
  list: () => api.get<MailSummary[]>("/dev/mail"),
  get: (id: string) => api.get<MailFull>(`/dev/mail/${id}`),
  clear: () => api.delete("/dev/mail"),
};

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
