import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../services/api", () => ({
  default: {
    post: vi.fn(),
  },
}));

import api from "../../services/api";
import { useAuthStore } from "../../stores/useAuthStore";

function makeToken(payload: Record<string, unknown>): string {
  const enc = (s: string) => btoa(s).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `header.${enc(JSON.stringify(payload))}.signature`;
}

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: true,
    });
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("starts unauthenticated and loading", () => {
    const { isAuthenticated, isLoading, user } = useAuthStore.getState();
    expect(isAuthenticated).toBe(false);
    expect(isLoading).toBe(true);
    expect(user).toBeNull();
  });

  it("login sets tokens and user state on success", async () => {
    const mockToken = makeToken({ sub: "user-1", email: "test@example.com", exp: 2000000000 });
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { access_token: mockToken, refresh_token: "refresh-token" },
    });

    await useAuthStore.getState().login("test@example.com", "password");

    expect(localStorage.getItem("access_token")).toBe(mockToken);
    expect(localStorage.getItem("refresh_token")).toBe("refresh-token");
    const { isAuthenticated, user } = useAuthStore.getState();
    expect(isAuthenticated).toBe(true);
    expect(user).toEqual({ id: "user-1", email: "test@example.com" });
  });

  it("register calls the API and does not set authentication", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { message: "success" } });

    await useAuthStore.getState().register("new@example.com", "password123");

    expect(api.post).toHaveBeenCalledWith("/auth/register", {
      email: "new@example.com",
      password: "password123",
      turnstile_token: "",
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("logout clears tokens and resets auth state", () => {
    useAuthStore.setState({
      user: { id: "u1", email: "x@y.com" },
      isAuthenticated: true,
    });
    localStorage.setItem("access_token", "some-token");
    localStorage.setItem("refresh_token", "some-refresh");

    // Step 1: logout signals auth change but keeps tokens
    useAuthStore.getState().logout();

    const { isAuthenticated: afterLogout, user: userAfterLogout } = useAuthStore.getState();
    expect(afterLogout).toBe(false);
    expect(userAfterLogout).toBeNull();
    // Tokens persist so autosave can convert images before clearing
    expect(localStorage.getItem("access_token")).toBe("some-token");
    expect(localStorage.getItem("refresh_token")).toBe("some-refresh");

    // Step 2: completeLogout clears tokens
    useAuthStore.getState().completeLogout();
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("refresh_token")).toBeNull();
  });

  it("checkAuth sets loading=false when no token exists", async () => {
    await useAuthStore.getState().checkAuth();
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it("checkAuth restores user from a valid stored token", async () => {
    const validToken = makeToken({ sub: "u2", email: "restored@example.com", exp: 2000000000 });
    localStorage.setItem("access_token", validToken);

    await useAuthStore.getState().checkAuth();

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toEqual({
      id: "u2",
      email: "restored@example.com",
    });
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it("checkAuth quietly fails on expired token with no refresh", async () => {
    const expiredToken = makeToken({ sub: "u3", email: "old@example.com", exp: 1000 });
    localStorage.setItem("access_token", expiredToken);

    await useAuthStore.getState().checkAuth();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it("checkAuth attempts token refresh when access is expired", async () => {
    const expiredToken = makeToken({ sub: "u4", email: "refresh@example.com", exp: 1000 });
    const newToken = makeToken({ sub: "u4", email: "refresh@example.com", exp: 2000000000 });
    localStorage.setItem("access_token", expiredToken);
    localStorage.setItem("refresh_token", "old-refresh");

    vi.mocked(api.post).mockResolvedValueOnce({
      data: { access_token: newToken },
    });

    await useAuthStore.getState().checkAuth();

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(localStorage.getItem("access_token")).toBe(newToken);
  });

  it("checkAuth clears tokens when refresh also fails", async () => {
    const expiredToken = makeToken({ sub: "u5", email: "bad@example.com", exp: 1000 });
    localStorage.setItem("access_token", expiredToken);
    localStorage.setItem("refresh_token", "bad-refresh");

    vi.mocked(api.post).mockRejectedValueOnce(new Error("Network error"));

    await useAuthStore.getState().checkAuth();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("refresh_token")).toBeNull();
  });
});
