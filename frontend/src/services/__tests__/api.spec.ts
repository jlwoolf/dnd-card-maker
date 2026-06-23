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

import { cardApi, deckApi, sharedApi, sharedDeckApi, devMailApi, userApi, adminApi } from "../api";

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

  it("cardApi.updateDecks calls PUT /cards/:id/decks", async () => {
    vi.mocked(axios.put).mockResolvedValueOnce({ data: { decks: [] } });
    await cardApi.updateDecks("card-1", ["d1", "d2"]);
    expect(axios.put).toHaveBeenCalledWith("/cards/card-1/decks", { deck_ids: ["d1", "d2"] });
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

  it("deckApi.get calls GET /decks/:id", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockDeck });
    const res = await deckApi.get("deck-1");
    expect(res.data.id).toBe("deck-1");
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

  it("deckApi.uploadCards calls POST /decks/save/cards", async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({ data: { card_ids: ["c1", "c2"] } });
    const res = await deckApi.uploadCards({
      cards: [{ elements: [], img_url: "data:img", theme: { fill: "#111", banner_fill: "#222", box_fill: "#333", stroke: "#444", banner_text: "#555", box_text: "#666" } }],
    });
    expect(res.data.card_ids).toEqual(["c1", "c2"]);
  });

  it("deckApi.update calls PUT /decks/:id", async () => {
    vi.mocked(axios.put).mockResolvedValueOnce({ data: { ...mockDeck, title: "Updated Deck" } });
    const res = await deckApi.update("deck-1", { title: "Updated Deck" });
    expect(res.data.title).toBe("Updated Deck");
  });

  it("deckApi.delete calls DELETE /decks/:id", async () => {
    vi.mocked(axios.delete).mockResolvedValueOnce({});
    await deckApi.delete("deck-1");
    expect(axios.delete).toHaveBeenCalled();
  });

  it("deckApi.share calls POST /decks/:id/share", async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { ...mockDeck, share_slug: "slug123", share_mode: "view_only" },
    });
    const res = await deckApi.share("deck-1", "view_only");
    expect(res.data.share_slug).toBe("slug123");
  });

  it("deckApi.unshare calls DELETE /decks/:id/share", async () => {
    vi.mocked(axios.delete).mockResolvedValueOnce({});
    await deckApi.unshare("deck-1");
    expect(axios.delete).toHaveBeenCalled();
  });
});

describe("sharedApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sharedApi.get calls GET /shared/:slug", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: {
        id: "s1",
        title: "Shared Card",
        elements: [],
        img_url: "data:img",
        theme: { fill: "#111", banner_fill: "#222", box_fill: "#333", stroke: "#444", banner_text: "#555", box_text: "#666" },
        mode: "view_only",
        can_copy: false,
      },
    });
    const res = await sharedApi.get("abc123");
    expect(res.data.title).toBe("Shared Card");
    expect(res.data.can_copy).toBe(false);
  });
});

describe("sharedDeckApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sharedDeckApi.get calls GET /shared/decks/:slug", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { id: "d1", title: "Shared Deck", cards: [], mode: "view_only", can_copy: true },
    });
    const res = await sharedDeckApi.get("xyz789");
    expect(res.data.title).toBe("Shared Deck");
    expect(res.data.can_copy).toBe(true);
  });
});

describe("devMailApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devMailApi.list calls GET /dev/mail", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: [] });
    const res = await devMailApi.list();
    expect(res.data).toEqual([]);
  });

  it("devMailApi.get calls GET /dev/mail/:id", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { id: "m1", to_email: "a@b.com", subject: "Test", sent_at: "2024-01-01", html_body: "<p>hi</p>" },
    });
    const res = await devMailApi.get("m1");
    expect(res.data.subject).toBe("Test");
  });

  it("devMailApi.clear calls DELETE /dev/mail", async () => {
    vi.mocked(axios.delete).mockResolvedValueOnce({});
    await devMailApi.clear();
    expect(axios.delete).toHaveBeenCalled();
  });
});

describe("userApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("userApi.changePassword calls POST /users/me/change-password", async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({ data: { message: "Password changed" } });
    const res = await userApi.changePassword("old", "new");
    expect(res.data.message).toBe("Password changed");
    expect(axios.post).toHaveBeenCalledWith("/users/me/change-password", {
      current_password: "old",
      new_password: "new",
    });
  });

  it("userApi.updateEmail calls PUT /users/me/email", async () => {
    vi.mocked(axios.put).mockResolvedValueOnce({ data: { message: "Email updated" } });
    const res = await userApi.updateEmail("new@example.com", "password");
    expect(res.data.message).toBe("Email updated");
    expect(axios.put).toHaveBeenCalledWith("/users/me/email", {
      new_email: "new@example.com",
      password: "password",
    });
  });

  it("userApi.deleteAccount calls DELETE /users/me", async () => {
    vi.mocked(axios.delete).mockResolvedValueOnce({ data: { message: "Account deleted" } });
    const res = await userApi.deleteAccount("password");
    expect(res.data.message).toBe("Account deleted");
  });
});

describe("adminApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adminApi.getTables calls GET /admin/tables", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: { tables: ["users", "cards"] } });
    const res = await adminApi.getTables();
    expect(res.data.tables).toEqual(["users", "cards"]);
  });

  it("adminApi.getRows calls GET /admin/:table with params", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { rows: [], total: 0, offset: 0, limit: 50 },
    });
    const res = await adminApi.getRows("cards", 0, 50);
    expect(res.data.total).toBe(0);
    expect(axios.get).toHaveBeenCalledWith("/admin/cards", { params: { offset: 0, limit: 50 } });
  });

  it("adminApi.getCard calls GET /admin/cards/:id", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { id: "c1", title: "Card 1" },
    });
    const res = await adminApi.getCard("c1");
    expect(res.data.title).toBe("Card 1");
  });

  it("adminApi.getDeck calls GET /admin/decks/:id", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { id: "d1", title: "Deck 1" },
    });
    const res = await adminApi.getDeck("d1");
    expect(res.data.title).toBe("Deck 1");
  });
});
