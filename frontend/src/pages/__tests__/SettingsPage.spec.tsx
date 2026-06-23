import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SettingsPage from "../../pages/SettingsPage";

const mockLogout = vi.fn();
const mockSetUser = vi.fn();
const mockShowSnackbar = vi.fn();

vi.mock("@src/stores/useAuthStore", () => ({
  useAuthStore: (selector?: (s: unknown) => unknown) => {
    const state = { user: { id: "u1", email: "test@example.com" }, isAuthenticated: true, logout: mockLogout, setUser: mockSetUser };
    return selector ? selector(state) : state;
  },
}));

vi.mock("@src/stores/useSnackbar", () => ({
  useSnackbar: (selector?: (s: unknown) => unknown) => {
    const state = { showSnackbar: mockShowSnackbar, closeSnackbar: vi.fn(), open: false, message: "", severity: "info" as const };
    return selector ? selector(state) : state;
  },
}));

vi.mock("@src/services/api", () => ({
  userApi: {
    changePassword: vi.fn(),
    updateEmail: vi.fn().mockResolvedValue({ data: { message: "Updated" } }),
    deleteAccount: vi.fn(),
  },
}));

import { userApi } from "@src/services/api";

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderPage() {
    return render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    );
  }

  it("renders settings heading", () => {
    renderPage();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("shows user email", () => {
    renderPage();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("opens delete confirmation dialog", async () => {
    renderPage();

    const passwordInputs = screen.getAllByLabelText(/current password/i);
    fireEvent.change(passwordInputs[2], { target: { value: "pass123" } });

    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));

    await waitFor(() => {
      expect(screen.getByText(/permanently delete your account/i)).toBeInTheDocument();
    });
  });

  it("successfully sends update email request", async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/new email/i), { target: { value: "new@example.com" } });

    const passwordInputs = screen.getAllByLabelText(/current password/i);
    fireEvent.change(passwordInputs[1], { target: { value: "pass123" } });

    fireEvent.click(screen.getByRole("button", { name: /update email/i }));

    await waitFor(() => {
      expect(userApi.updateEmail).toHaveBeenCalledWith("new@example.com", "pass123");
    });
  });
});
