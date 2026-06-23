import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ForgotPasswordPage from "../../pages/ForgotPasswordPage";

vi.mock("@src/services/api", () => ({
  default: {
    post: vi.fn(),
  },
}));

import api from "@src/services/api";

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderPage() {
    return render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );
  }

  it("renders email field and submit button", () => {
    renderPage();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
  });

  it("calls forgot-password API on submit", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { message: "Success" } });

    renderPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/forgot-password", {
        email: "test@example.com",
      });
    });
  });

  it("shows success message after submission", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

    renderPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/if the email is registered/i)).toBeInTheDocument();
    });
  });

  it("shows error message on failure", async () => {
    vi.mocked(api.post).mockRejectedValueOnce({
      response: { data: { detail: "Too many requests" } },
    });

    renderPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText("Too many requests")).toBeInTheDocument();
    });
  });
});
