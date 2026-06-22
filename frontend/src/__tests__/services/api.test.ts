import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";

vi.mock("axios", () => {
  const mockAxios = {
    create: vi.fn(() => mockAxios),
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return { default: mockAxios };
});

import { cardApi, deckApi } from "../../services/api";

describe("cardApi", () => {
  const mockCard = {
    id: "card-1",
    user_id: "user-1",
    title: "Test Card",
    elements: [],
    img_url: "data:image/png;base64,abc",
    theme: {
      fill: "#111",
      banner_fill: "#222",
      box_fill: "#333",
      stroke: "#444",
      banner_text: "#555",
      box_text: "#666",
    },
    share_slug: null,
    share_mode: null,
    share_at: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cardApi.list calls GET /cards", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: [mockCard] });
    const res = await cardApi.list();
    expect(res.data).toEqual([mockCard]);
  });

  it("cardApi.get calls GET /cards/:id", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockCard });
    const res = await cardApi.get("card-1");
    expect(res.data.id).toBe("card-1");
  });

  it("cardApi.create calls POST /cards", async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({ data: mockCard });
    const res = await cardApi.create({
      elements: [],
      img_url: "data:img",
      theme: {
        fill: "#111",
        banner_fill: "#222",
        box_fill: "#333",
        stroke: "#444",
        banner_text: "#555",
        box_text: "#666",
      },
    });
    expect(res.data.title).toBe("Test Card");
  });

  it("cardApi.update calls PUT /cards/:id", async () => {
    vi.mocked(axios.put).mockResolvedValueOnce({ data: { ...mockCard, title: "Updated" } });
    const res = await cardApi.update("card-1", { title: "Updated" });
    expect(res.data.title).toBe("Updated");
  });

  it("cardApi.delete calls DELETE /cards/:id", async () => {
    vi.mocked(axios.delete).mockResolvedValueOnce({});
    await cardApi.delete("card-1");
    expect(axios.delete).toHaveBeenCalled();
  });

  it("cardApi.toggleSave calls POST /cards/:id/toggle-save", async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({ data: { message: "saved", saved: true } });
    const res = await cardApi.toggleSave("card-1", "save");
    expect(res.data.saved).toBe(true);
  });

  it("cardApi.share calls POST /cards/:id/share", async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { ...mockCard, share_slug: "abc123", share_mode: "view_and_copy" },
    });
    const res = await cardApi.share("card-1", "view_and_copy");
    expect(res.data.share_slug).toBe("abc123");
  });

  it("cardApi.unshare calls DELETE /cards/:id/share", async () => {
    vi.mocked(axios.delete).mockResolvedValueOnce({});
    await cardApi.unshare("card-1");
    expect(axios.delete).toHaveBeenCalled();
  });

  it("cardApi.getDecks calls GET /cards/:id/decks", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: [{ deck_id: "d1", title: "My Deck", is_default: false }],
    });
    const res = await cardApi.getDecks("card-1");
    expect(res.data).toHaveLength(1);
  });
});

describe("deckApi", () => {
  const mockDeck = {
    id: "deck-1",
    user_id: "user-1",
    title: "My Deck",
    is_default: false,
    cards: [],
    share_slug: null,
    share_mode: null,
    share_at: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deckApi.list calls GET /decks", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: [mockDeck] });
    const res = await deckApi.list();
    expect(res.data).toEqual([mockDeck]);
  });

  it("deckApi.create calls POST /decks", async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({ data: mockDeck });
    const res = await deckApi.create({ title: "New Deck", card_ids: [] });
    expect(res.data.title).toBe("My Deck");
  });

  it("deckApi.save calls POST /decks/save", async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({ data: mockDeck });
    const res = await deckApi.save({ title: "Saved Deck", cards: [] });
    expect(res.data.id).toBe("deck-1");
  });

  it("deckApi.share calls POST /decks/:id/share", async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { ...mockDeck, share_slug: "slug123", share_mode: "view_only" },
    });
    const res = await deckApi.share("deck-1", "view_only");
    expect(res.data.share_slug).toBe("slug123");
  });
});
