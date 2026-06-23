import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminPage from "../../pages/AdminPage";

vi.mock("@src/services/api", () => ({
  adminApi: {
    getTables: vi.fn(),
    getRows: vi.fn(),
    getCard: vi.fn(),
    getDeck: vi.fn(),
  },
}));

import { adminApi } from "@src/services/api";

const mkResponse = <T,>(data: T) => ({
  data,
  status: 200,
  statusText: "OK",
  headers: {},
  config: {} as never,
});

describe("AdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderPage() {
    return render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>,
    );
  }

  it("renders table list after fetch", async () => {
    vi.mocked(adminApi.getTables).mockResolvedValueOnce(
      mkResponse({ tables: ["users", "cards", "decks"] }) as never,
    );

    renderPage();

    const usersItem = await screen.findByText("users");
    expect(usersItem).toBeInTheDocument();
    expect(screen.getByText("cards")).toBeInTheDocument();
    expect(screen.getByText("decks")).toBeInTheDocument();
  });

  it("shows error when fetching tables fails", async () => {
    vi.mocked(adminApi.getTables).mockRejectedValueOnce(new Error("Access denied"));

    renderPage();

    const errorText = await screen.findByText(/failed to load tables/i);
    expect(errorText).toBeInTheDocument();
  });

  it("shows prompt to select table initially", async () => {
    vi.mocked(adminApi.getTables).mockResolvedValueOnce(
      mkResponse({ tables: ["users"] }) as never,
    );

    renderPage();

    await screen.findByText("users");

    const selectPrompt = screen.getByText(/select a table/i);
    expect(selectPrompt).toBeInTheDocument();
  });
});
