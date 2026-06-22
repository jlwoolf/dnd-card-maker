import { describe, it, expect, beforeEach } from "vitest";
import useExportCards from "../../hooks/useExportCards";

describe("useExportCards", () => {
  beforeEach(() => {
    useExportCards.setState({ cards: [], pdfProgress: 0 });
  });

  it("starts with an empty deck", () => {
    expect(useExportCards.getState().cards).toEqual([]);
    expect(useExportCards.getState().pdfProgress).toBe(0);
  });

  it("addCard appends a new card to the deck", () => {
    const { addCard } = useExportCards.getState();
    addCard(
      [
        {
          id: "el-1",
          type: "text",
          value: {
            variant: "banner",
            expand: false,
            width: 100,
            value: [{ type: "paragraph", children: [{ text: "Test" }] }],
          },
          style: { grow: false, align: "center" },
        },
      ],
      "data:image/png;base64,abc",
      {
        fill: "#111",
        bannerFill: "#222",
        boxFill: "#333",
        stroke: "#444",
        bannerText: "#555",
        boxText: "#666",
      },
    );

    const { cards } = useExportCards.getState();
    expect(cards).toHaveLength(1);
    expect(cards[0].imgUrl).toBe("data:image/png;base64,abc");
    expect(cards[0].elements).toHaveLength(1);
    expect(cards[0].id).toBeTruthy();
    expect(cards[0].theme.fill).toBe("#111");
  });

  it("addCard accepts an optional cloudCardId", () => {
    const { addCard } = useExportCards.getState();
    addCard([], "data:img;base64,test", {
      fill: "#aaa",
      bannerFill: "#bbb",
      boxFill: "#ccc",
      stroke: "#ddd",
      bannerText: "#eee",
      boxText: "#fff",
    }, "cloud-123");
    expect(useExportCards.getState().cards[0].cloudCardId).toBe("cloud-123");
  });

  it("removeCard removes the card by id", () => {
    const { addCard, removeCard } = useExportCards.getState();
    addCard([], "img1", {
      fill: "#111",
      bannerFill: "#222",
      boxFill: "#333",
      stroke: "#444",
      bannerText: "#555",
      boxText: "#666",
    });
    addCard([], "img2", {
      fill: "#aaa",
      bannerFill: "#bbb",
      boxFill: "#ccc",
      stroke: "#ddd",
      bannerText: "#eee",
      boxText: "#fff",
    });
    const idToRemove = useExportCards.getState().cards[0].id;

    removeCard(idToRemove);
    const { cards } = useExportCards.getState();
    expect(cards).toHaveLength(1);
    expect(cards[0].imgUrl).toBe("img2");
  });

  it("removeCard is a no-op for nonexistent id", () => {
    const { addCard, removeCard } = useExportCards.getState();
    addCard([], "img", {
      fill: "#111",
      bannerFill: "#222",
      boxFill: "#333",
      stroke: "#444",
      bannerText: "#555",
      boxText: "#666",
    });
    removeCard("nonexistent");
    expect(useExportCards.getState().cards).toHaveLength(1);
  });

  it("updateCard modifies an existing card", () => {
    const { addCard, updateCard } = useExportCards.getState();
    addCard([], "original", {
      fill: "#111",
      bannerFill: "#222",
      boxFill: "#333",
      stroke: "#444",
      bannerText: "#555",
      boxText: "#666",
    });
    const id = useExportCards.getState().cards[0].id;

    updateCard(id, { imgUrl: "updated" });
    expect(useExportCards.getState().cards[0].imgUrl).toBe("updated");
  });

  it("updateCard ignores nonexistent id without error", () => {
    const { updateCard } = useExportCards.getState();
    updateCard("nonexistent", { imgUrl: "updated" });
    expect(useExportCards.getState().cards).toEqual([]);
  });

  it("setCards replaces the entire deck", () => {
    const card = {
      id: "c1",
      elements: [],
      imgUrl: "img",
      theme: {
        fill: "#aaa",
        bannerFill: "#bbb",
        boxFill: "#ccc",
        stroke: "#ddd",
        bannerText: "#eee",
        boxText: "#fff",
      },
    };
    useExportCards.getState().setCards([card]);
    expect(useExportCards.getState().cards).toEqual([card]);
  });

  it("setCardCloudId sets cloud id on a local card", () => {
    const { addCard, setCardCloudId } = useExportCards.getState();
    addCard([], "img", {
      fill: "#111",
      bannerFill: "#222",
      boxFill: "#333",
      stroke: "#444",
      bannerText: "#555",
      boxText: "#666",
    });
    const id = useExportCards.getState().cards[0].id;
    setCardCloudId(id, "cloud-456");
    expect(useExportCards.getState().cards[0].cloudCardId).toBe("cloud-456");
  });

  it("loadFile validates and loads valid card data", () => {
    const validDeck = [
      {
        id: "valid-card",
        elements: [
          {
            id: "e1",
            type: "text",
            value: {
              variant: "banner",
              expand: false,
              width: 100,
              value: [{ type: "paragraph", children: [{ text: "Hi" }] }],
            },
            style: { grow: false, align: "center" },
          },
        ],
        imgUrl: "data:img",
        theme: {
          fill: "#111",
          bannerFill: "#222",
          boxFill: "#333",
          stroke: "#444",
          bannerText: "#555",
          boxText: "#666",
        },
      },
    ];
    const result = useExportCards.getState().loadFile(validDeck);
    expect(result).toBe(true);
    expect(useExportCards.getState().cards).toHaveLength(1);
  });

  it("loadFile rejects invalid data and returns false", () => {
    const result = useExportCards.getState().loadFile({ not: "a deck" });
    expect(result).toBe(false);
    expect(useExportCards.getState().cards).toEqual([]);
  });

  it("loadFile rejects an empty array silently (valid but no-op)", () => {
    const result = useExportCards.getState().loadFile([]);
    expect(result).toBe(true);
    expect(useExportCards.getState().cards).toEqual([]);
  });
});
