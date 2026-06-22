import { create } from "zustand";
import api from "../services/api";

interface AuthState {
  user: { id: string; email: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setUser: (user: { id: string; email: string }) => void;
}

function decodeTokenPayload(token: string): { sub: string; email: string; exp: number } | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    const payload = decodeTokenPayload(data.access_token);
    set({
      user: payload ? { id: payload.sub, email: payload.email } : null,
      isAuthenticated: true,
    });
  },

  register: async (email: string, password: string) => {
    await api.post("/auth/register", { email, password });
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      set({ isLoading: false });
      return;
    }

    const payload = decodeTokenPayload(token);
    if (payload && payload.exp * 1000 > Date.now()) {
      set({
        user: { id: payload.sub, email: payload.email },
        isAuthenticated: true,
        isLoading: false,
      });
      return;
    }

    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      set({ isLoading: false });
      return;
    }

    try {
      const { data } = await api.post("/auth/refresh", {
        refresh_token: refreshToken,
      });
      localStorage.setItem("access_token", data.access_token);
      const newPayload = decodeTokenPayload(data.access_token);
      set({
        user: newPayload ? { id: newPayload.sub, email: newPayload.email } : null,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      set({ isLoading: false });
    }
  },

  setUser: (user: { id: string; email: string }) => {
    set({ user });
  },
}));
