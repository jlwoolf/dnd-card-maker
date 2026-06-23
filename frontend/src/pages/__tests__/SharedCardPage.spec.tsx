import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SharedCardPage from "../../pages/SharedCardPage";

vi.mock("@src/services/api", () => ({
  sharedApi: {
    get: vi.fn(),
  },
}));

vi.mock("@src/stores/useExportCards", () => ({
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

vi.mock("@src/stores/useSnackbar", () => ({
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

import { sharedApi } from "@src/services/api";

const mkResponse = <T,>(data: T) => ({
  data,
  status: 200,
  statusText: "OK",
  headers: {},
  config: {} as never,
});

const mockSharedCard = {
  id: "s1",
  title: "Shared Card Title",
  elements: [] as never[],
  img_url: "data:image/png;base64,img",
  theme: {
    fill: "#111",
    banner_fill: "#222",
    box_fill: "#333",
    stroke: "#444",
    banner_text: "#555",
    box_text: "#666",
  },
  mode: "view_only" as const,
  can_copy: false,
};

const renderWithSlug = (slug: string) => {
  return render(
    <MemoryRouter initialEntries={[`/share/${slug}`]}>
      <Routes>
        <Route path="/share/:shareSlug" element={<SharedCardPage />} />
      </Routes>
    </MemoryRouter>,
  );
};

describe("SharedCardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading spinner while fetching", () => {
    vi.mocked(sharedApi.get).mockReturnValueOnce(new Promise(() => {}) as never);

    renderWithSlug("abc123");

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("shows card title and mode after load", async () => {
    vi.mocked(sharedApi.get).mockResolvedValueOnce(mkResponse(mockSharedCard) as never);

    renderWithSlug("abc123");

    await waitFor(() => {
      expect(screen.getByText("Shared Card Title")).toBeInTheDocument();
    });
  });

  it("shows error when slug is invalid", async () => {
    vi.mocked(sharedApi.get).mockRejectedValueOnce(new Error("Not found"));

    renderWithSlug("bad-slug");

    await waitFor(() => {
      expect(screen.getByText(/this shared card link may be invalid/i)).toBeInTheDocument();
    });
  });

  it("hides copy button when can_copy is false", async () => {
    vi.mocked(sharedApi.get).mockResolvedValueOnce(mkResponse(mockSharedCard) as never);

    renderWithSlug("abc123");

    await waitFor(() => {
      expect(screen.getByText("Shared Card Title")).toBeInTheDocument();
    });

    expect(screen.queryByText(/copy to my deck/i)).not.toBeInTheDocument();
  });

  it("shows copy button when can_copy is true", async () => {
    vi.mocked(sharedApi.get).mockResolvedValueOnce(
      mkResponse({ ...mockSharedCard, can_copy: true, mode: "view_and_copy" }) as never,
    );

    renderWithSlug("copy-slug");

    await waitFor(() => {
      expect(screen.getByText(/copy to my deck/i)).toBeInTheDocument();
    });
  });
});
