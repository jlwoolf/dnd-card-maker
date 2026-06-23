import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ResetPasswordPage from "../../pages/ResetPasswordPage";

vi.mock("@src/services/api", () => ({
  default: {
    post: vi.fn(),
  },
}));

import api from "@src/services/api";

const renderWithToken = (token: string) => {
  return render(
    <MemoryRouter initialEntries={[`/reset-password/${token}`]}>
      <Routes>
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      </Routes>
    </MemoryRouter>,
  );
};

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders password and confirm password fields", () => {
    renderWithToken("test-token");
    expect(screen.getAllByLabelText(/new password/i)[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText(/confirm new password/i)[0]).toBeInTheDocument();
  });

  it("renders a reset password button", () => {
    renderWithToken("test-token");
    expect(screen.getByRole("button", { name: /reset password/i })).toBeInTheDocument();
  });

  it("shows error when password is too short", async () => {
    renderWithToken("test-token");

    fireEvent.change(screen.getAllByLabelText(/new password/i)[0], { target: { value: "short" } });
    fireEvent.change(screen.getAllByLabelText(/confirm new password/i)[0], { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it("shows error when passwords do not match", async () => {
    renderWithToken("test-token");

    fireEvent.change(screen.getAllByLabelText(/new password/i)[0], { target: { value: "password123" } });
    fireEvent.change(screen.getAllByLabelText(/confirm new password/i)[0], { target: { value: "different12" } });
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it("calls reset API with token on success", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { message: "Password reset" } });

    renderWithToken("my-token-123");

    fireEvent.change(screen.getAllByLabelText(/new password/i)[0], { target: { value: "newpassword123" } });
    fireEvent.change(screen.getAllByLabelText(/confirm new password/i)[0], { target: { value: "newpassword123" } });
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/reset-password/my-token-123", {
        password: "newpassword123",
      });
    });
  });

  it("shows success message after reset", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { message: "Password reset successfully." } });

    renderWithToken("tok");

    fireEvent.change(screen.getAllByLabelText(/new password/i)[0], { target: { value: "newpassword123" } });
    fireEvent.change(screen.getAllByLabelText(/confirm new password/i)[0], { target: { value: "newpassword123" } });
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/password reset successfully/i)).toBeInTheDocument();
    });
  });

  it("shows error on API failure", async () => {
    vi.mocked(api.post).mockRejectedValueOnce({
      response: { data: { detail: "Token expired" } },
    });

    renderWithToken("expired-token");

    fireEvent.change(screen.getAllByLabelText(/new password/i)[0], { target: { value: "newpassword123" } });
    fireEvent.change(screen.getAllByLabelText(/confirm new password/i)[0], { target: { value: "newpassword123" } });
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText("Token expired")).toBeInTheDocument();
    });
  });
});
