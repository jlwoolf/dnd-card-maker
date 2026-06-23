import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SaveDeckDialog from "../SaveDeckDialog";
import useExportCards from "@src/stores/useExportCards";
import { useSnackbar } from "@src/stores/useSnackbar";
import { deckApi } from "@src/services/api";

vi.mock("@src/utils/cardImageUrl", () => ({
  getCardPreviewSrc: vi.fn(() => "data:image/png;base64,stub"),
}));

vi.mock("@src/utils/themeHelpers", () => ({
  themeToSnake: vi.fn(() => ({
    fill: "#111", banner_fill: "#222", box_fill: "#333",
    stroke: "#444", banner_text: "#555", box_text: "#666",
  })),
}));

vi.mock("@src/services/api", () => ({
  deckApi: {
    save: vi.fn(),
    uploadCards: vi.fn(),
  },
}));

const TEST_THEME = {
  fill: "#111", bannerFill: "#222", boxFill: "#333",
  stroke: "#444", bannerText: "#555", boxText: "#666",
};

function setupStore(opts: {
  cards?: Array<{ id: string; elements: unknown[]; imgUrl: string; theme: typeof TEST_THEME }>;
  editingCloudDeckId?: string | null;
  editingCloudDeckTitle?: string | null;
} = {}) {
  if (opts.cards) {
    useExportCards.getState().setCards(opts.cards as never);
  }
  if (opts.editingCloudDeckId !== undefined || opts.editingCloudDeckTitle !== undefined) {
    useExportCards.getState().setEditingCloudDeck(
      opts.editingCloudDeckId ?? null,
      opts.editingCloudDeckTitle ?? null,
    );
  }
}

function mockSaveResponse(id = "deck-1") {
  vi.mocked(deckApi.save).mockResolvedValue({
    data: { id, cards: [], title: "Deck", is_default: false, share_slug: null, share_mode: null },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}

/** Render the dialog with the open-transition that triggers the sync logic. */
function renderOpen(props: Parameters<typeof setupStore>[0] & { onClose?: () => void }) {
  setupStore(props);
  const { rerender } = render(
    <SaveDeckDialog open={false} onClose={props.onClose ?? vi.fn()} />,
  );
  rerender(
    <SaveDeckDialog open={true} onClose={props.onClose ?? vi.fn()} />,
  );
  return { rerender };
}

describe("SaveDeckDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useExportCards.setState({ cards: [], editingCloudDeckId: null, editingCloudDeckTitle: null });
    useSnackbar.getState().closeSnackbar();
  });

  describe("button visibility", () => {
    it("shows Save disabled when no cloud deck is loaded", async () => {
      renderOpen({
        cards: [{ id: "1", elements: [], imgUrl: "data:;", theme: TEST_THEME }],
      });

      const saveBtn = screen.getByText("Save");
      expect(saveBtn).toBeDisabled();
      expect(screen.getByText("Save As")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("enables Save when a cloud deck is being edited", async () => {
      renderOpen({
        cards: [{ id: "1", elements: [], imgUrl: "data:;", theme: TEST_THEME }],
        editingCloudDeckId: "deck-123",
        editingCloudDeckTitle: "My Deck",
      });

      await waitFor(() => {
        expect(screen.getByText("Save")).not.toBeDisabled();
      });
    });

    it("pre-fills title from editing cloud deck", async () => {
      renderOpen({
        cards: [{ id: "1", elements: [], imgUrl: "data:;", theme: TEST_THEME }],
        editingCloudDeckId: "deck-123",
        editingCloudDeckTitle: "Dragon Deck",
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue("Dragon Deck")).toBeInTheDocument();
      });
    });
  });

  describe("save behaviour", () => {
    it("calls deckApi.save with deck_id when Save is clicked", async () => {
      mockSaveResponse("deck-123");

      renderOpen({
        cards: [{ id: "1", elements: [], imgUrl: "data:;", theme: TEST_THEME }],
        editingCloudDeckId: "deck-123",
        editingCloudDeckTitle: "Deck",
      });

      await waitFor(() => expect(screen.getByText("Save")).not.toBeDisabled());
      fireEvent.click(screen.getByText("Save"));

      await waitFor(() => {
        expect(deckApi.save).toHaveBeenCalledWith(
          expect.objectContaining({ deck_id: "deck-123" }),
        );
      });
    });

    it("calls deckApi.save without deck_id when Save As is clicked", async () => {
      mockSaveResponse("new-deck");

      renderOpen({
        cards: [{ id: "1", elements: [], imgUrl: "data:;", theme: TEST_THEME }],
      });

      await waitFor(() => expect(screen.getByText("Save As")).not.toBeDisabled());
      fireEvent.click(screen.getByText("Save As"));

      await waitFor(() => {
        expect(deckApi.save).toHaveBeenCalledWith(
          expect.objectContaining({ deck_id: undefined }),
        );
      });
    });

    it("sets editing cloud deck after successful Save As", async () => {
      mockSaveResponse("new-deck");

      renderOpen({
        cards: [{ id: "1", elements: [], imgUrl: "data:;", theme: TEST_THEME }],
      });

      await waitFor(() => expect(screen.getByText("Save As")).not.toBeDisabled());
      fireEvent.click(screen.getByText("Save As"));

      await waitFor(() => {
        expect(useExportCards.getState().editingCloudDeckId).toBe("new-deck");
      });
    });
  });
});
