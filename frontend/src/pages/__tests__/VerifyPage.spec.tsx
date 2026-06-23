import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import VerifyPage from "../../pages/VerifyPage";

vi.mock("@src/services/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

import api from "@src/services/api";

const renderWithToken = (token: string) => {
  return render(
    <MemoryRouter initialEntries={[`/verify/${token}`]}>
      <Routes>
        <Route path="/verify/:token" element={<VerifyPage />} />
      </Routes>
    </MemoryRouter>,
  );
};

describe("VerifyPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading spinner initially", () => {
    vi.mocked(api.get).mockReturnValueOnce(new Promise(() => {}));

    renderWithToken("some-token");

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("shows success state on successful verification", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { message: "Email verified successfully." },
    });

    renderWithToken("good-token");

    await waitFor(() => {
      expect(screen.getByText(/email verified successfully/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/go to login/i)).toBeInTheDocument();
  });

  it("shows error state on verification failure", async () => {
    vi.mocked(api.get).mockRejectedValueOnce({
      response: { data: { detail: "Invalid token" } },
    });

    renderWithToken("bad-token");

    await waitFor(() => {
      expect(screen.getByText("Invalid token")).toBeInTheDocument();
    });
  });

  it("shows fallback error when no detail in response", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error("Network error"));

    renderWithToken("bad-token");

    await waitFor(() => {
      expect(screen.getByText("Verification failed")).toBeInTheDocument();
    });
  });
});
