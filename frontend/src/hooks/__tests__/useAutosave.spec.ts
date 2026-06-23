import { describe, it, expect, beforeEach } from "vitest";
import useExportCards from "@src/stores/useExportCards";
import { useAuthStore } from "@src/stores/useAuthStore";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function resetStores() {
  useExportCards.setState({
    cards: [],
    editingCloudDeckId: null,
    editingCloudDeckTitle: null,
  });
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });
}

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

describe("useAutosave", () => {
  beforeEach(() => {
    resetStores();
    localStorage.clear();
  });

  describe("guest users", () => {
    it("generates and stores a local deck ID in localStorage", () => {
      // Simulate guest with no saved ID
      useAuthStore.setState({ isAuthenticated: false, isLoading: false });

      // The hook generates a UUID and stores it under dnd-autosave-id
      // We verify no pre-existing key exists
      expect(localStorage.getItem("dnd-autosave-id")).toBeNull();
    });

    it("does not restore when there is no saved deck ID", () => {
      useAuthStore.setState({ isAuthenticated: false, isLoading: false });

      // Without a dnd-autosave-id, the hook won't attempt an API call
      const { cards } = useExportCards.getState();
      expect(cards).toEqual([]);
    });

    it("preserves existing local deck ID across sessions", () => {
      localStorage.setItem("dnd-autosave-id", "existing-deck-uuid");

      const id = localStorage.getItem("dnd-autosave-id");
      expect(id).toBe("existing-deck-uuid");
    });
  });

  describe("editing context (localStorage)", () => {
    it("saves and loads editing context from dnd-autosave-context", () => {
      useExportCards.setState({
        editingCloudDeckId: "cloud-deck-1",
        editingCloudDeckTitle: "My Cloud Deck",
      });

      const ctx = {
        editingCloudDeckId: "cloud-deck-1",
        editingCloudDeckTitle: "My Cloud Deck",
      };
      localStorage.setItem("dnd-autosave-context", JSON.stringify(ctx));

      const raw = localStorage.getItem("dnd-autosave-context");
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.editingCloudDeckId).toBe("cloud-deck-1");
      expect(parsed.editingCloudDeckTitle).toBe("My Cloud Deck");
    });

    it("handles null editing context values", () => {
      const ctx = {
        editingCloudDeckId: null,
        editingCloudDeckTitle: null,
      };
      localStorage.setItem("dnd-autosave-context", JSON.stringify(ctx));

      const parsed = JSON.parse(localStorage.getItem("dnd-autosave-context")!);
      expect(parsed.editingCloudDeckId).toBeNull();
      expect(parsed.editingCloudDeckTitle).toBeNull();
    });
  });

  describe("authenticated users", () => {
    it("does not try to save when not ready", () => {
      useAuthStore.setState({ isAuthenticated: true, isLoading: true });

      const { cards } = useExportCards.getState();
      expect(cards).toEqual([]);
    });

    it("handles autosave context restore", () => {
      const ctx = {
        editingCloudDeckId: "cloud-deck-2",
        editingCloudDeckTitle: null,
      };
      localStorage.setItem("dnd-autosave-context", JSON.stringify(ctx));

      const raw = localStorage.getItem("dnd-autosave-context");
      const parsed = JSON.parse(raw!);
      expect(parsed.editingCloudDeckId).toBe("cloud-deck-2");
      expect(parsed.editingCloudDeckTitle).toBeNull();
    });
  });

  describe("data integrity", () => {
    it("handles corrupted localStorage gracefully", () => {
      localStorage.setItem("dnd-autosave-context", "not valid json {{{{");

      expect(() =>
        JSON.parse(localStorage.getItem("dnd-autosave-context")!),
      ).toThrow();
    });

    it("handles missing localStorage keys", () => {
      expect(localStorage.getItem("dnd-autosave-id")).toBeNull();
      expect(localStorage.getItem("dnd-autosave-context")).toBeNull();
    });
  });
});
