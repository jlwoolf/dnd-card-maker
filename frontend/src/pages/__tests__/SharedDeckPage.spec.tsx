import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SharedDeckPage from "../../pages/SharedDeckPage";

vi.mock("@src/services/api", () => ({
  sharedDeckApi: {
    get: vi.fn(),
  },
}));

vi.mock("@src/hooks/useExportCards", () => ({
  default: Object.assign(
    (selector?: (s: unknown) => unknown) => {
      const state = { cards: [], addCard: vi.fn() };
      return selector ? selector(state) : state;
    },
    {
      getState: () => ({ cards: [], addCard: vi.fn() }),
      setState: vi.fn(),
      subscribe: vi.fn(),
    },
  ),
}));

vi.mock("@src/hooks/useSnackbar", () => ({
  useSnackbar: (selector?: (s: unknown) => unknown) => {
    const state = { showSnackbar: vi.fn(), closeSnackbar: vi.fn(), open: false, message: "", severity: "info" };
    return selector ? selector(state) : state;
  },
}));

vi.mock("@src/services/ImageProcessor", () => ({
  ImageProcessor: {
    toDataUrl: vi.fn().mockResolvedValue("data:image/png;base64,converted"),
  },
}));

import { sharedDeckApi } from "@src/services/api";

const mkResponse = <T,>(data: T) => ({
  data,
  status: 200,
  statusText: "OK",
  headers: {},
  config: {} as never,
});

const mockSharedDeck = {
  id: "d1",
  title: "Shared Deck Title",
  cards: [
    {
      id: "c1",
      title: "Card 1",
      elements: [] as never[],
      theme: {
        fill: "#111",
        banner_fill: "#222",
        box_fill: "#333",
        stroke: "#444",
        banner_text: "#555",
        box_text: "#666",
      },
      img_url: "data:image/png;base64,img1",
      share_slug: null as string | null,
      share_mode: null as string | null,
    },
  ],
  mode: "view_only" as const,
  can_copy: false,
};

const renderWithSlug = (slug: string) => {
  return render(
    <MemoryRouter initialEntries={[`/share/deck/${slug}`]}>
      <Routes>
        <Route path="/share/deck/:shareSlug" element={<SharedDeckPage />} />
      </Routes>
    </MemoryRouter>,
  );
};

describe("SharedDeckPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading spinner while fetching", () => {
    vi.mocked(sharedDeckApi.get).mockReturnValueOnce(new Promise(() => {}) as never);

    renderWithSlug("deck-slug");

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("shows deck title after load", async () => {
    vi.mocked(sharedDeckApi.get).mockResolvedValueOnce(mkResponse(mockSharedDeck) as never);

    renderWithSlug("deck-slug");

    await waitFor(() => {
      expect(screen.getByText("Shared Deck Title")).toBeInTheDocument();
    });
  });

  it("shows error when slug is invalid", async () => {
    vi.mocked(sharedDeckApi.get).mockRejectedValueOnce(new Error("Not found"));

    renderWithSlug("bad-slug");

    await waitFor(() => {
      expect(screen.getByText(/this shared deck link may be invalid/i)).toBeInTheDocument();
    });
  });

  it("hides copy all button when can_copy is false", async () => {
    vi.mocked(sharedDeckApi.get).mockResolvedValueOnce(mkResponse(mockSharedDeck) as never);

    renderWithSlug("deck-slug");

    await waitFor(() => {
      expect(screen.getByText("Shared Deck Title")).toBeInTheDocument();
    });

    expect(screen.queryByText(/copy all to my deck/i)).not.toBeInTheDocument();
  });

  it("shows copy all button when can_copy is true", async () => {
    vi.mocked(sharedDeckApi.get).mockResolvedValueOnce(
      mkResponse({ ...mockSharedDeck, can_copy: true, mode: "view_and_copy" }) as never,
    );

    renderWithSlug("copy-deck");

    await waitFor(() => {
      expect(screen.getByText(/copy all to my deck/i)).toBeInTheDocument();
    });
  });

  it("shows card titles in the deck", async () => {
    vi.mocked(sharedDeckApi.get).mockResolvedValueOnce(mkResponse(mockSharedDeck) as never);

    renderWithSlug("deck-slug");

    await waitFor(() => {
      expect(screen.getByText("Card 1")).toBeInTheDocument();
    });
  });
});
