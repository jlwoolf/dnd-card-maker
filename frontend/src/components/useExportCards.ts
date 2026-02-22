import { jsPDF } from "jspdf";
import { v4 as uuid } from "uuid";
import z from "zod";
import { create } from "zustand";
import {
  CardSchema,
  type Card,
  type Element,
  type PreviewTheme,
} from "@src/schemas";

interface ExportState {
  /** List of cards in the deck */
  cards: Card[];
  /** Progress of PDF generation (0 to 1) */
  pdfProgress: number;
  /**
   * Adds a new card to the deck.
   * 
   * @param elements - The element configuration.
   * @param imgUrl - The generated preview image URL.
   * @param theme - The theme applied to the card.
   */
  addCard(elements: Element[], imgUrl: string, theme: PreviewTheme): void;
  /**
   * Updates an existing card in the deck.
   * 
   * @param id - The ID of the card to update.
   * @param data - The partial data to update.
   */
  updateCard(
    id: string,
    data: Partial<{ elements: Element[]; imgUrl: string; theme: PreviewTheme }>,
  ): void;
  /**
   * Removes a card from the deck.
   * 
   * @param id - The ID of the card to remove.
   */
  removeCard(id: string): void;
  /**
   * Validates and loads a deck from a JSON data source.
   * 
   * @param data - The raw data to parse.
   */
  loadFile(data: unknown): void;
  /** Sets the entire cards array */
  setCards(cards: Card[]): void;
  /**
   * Generates a PDF from the specified cards.
   * 
   * @param cardIds - Optional array of card IDs to export. If omitted, exports the whole deck.
   * @returns A promise resolving to a blob URL of the generated PDF.
   */
  generatePdf(cardIds?: string[]): Promise<string | undefined>;
}

/**
 * useExportCards is a Zustand store that manages the saved deck of cards and 
 * provides sophisticated export utilities, including PDF generation.
 */
const useExportCards = create<ExportState>((set, get) => ({
  cards: [],
  pdfProgress: 0,

  addCard(elements, imgUrl, theme) {
    set((state) => ({
      cards: [...state.cards, { elements, imgUrl, id: uuid(), theme }],
    }));
  },

  removeCard(id) {
    set((state) => ({ cards: state.cards.filter((card) => card.id !== id) }));
  },

  updateCard(id, data) {
    set((state) => {
      const cardIndex = state.cards.findIndex((card) => card.id === id);
      if (cardIndex === -1) return {};

      const newCards = [...state.cards];
      newCards[cardIndex] = { ...newCards[cardIndex], ...data, id };

      return { cards: newCards };
    });
  },

  setCards(cards) {
    set({ cards });
  },

  loadFile(unknownData) {
    const { success, data } = z.array(CardSchema).safeParse(unknownData);
    if (success) set({ cards: data });
  },

  generatePdf: async (cardIds) => {
    const allCards = get().cards;
    const cardsToExport = cardIds 
      ? allCards.filter(card => cardIds.includes(card.id))
      : allCards;

    if (cardsToExport.length === 0) return;

    set({ pdfProgress: 0 });

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "in",
      format: "letter",
    });

    const CARD_W = 2.5;
    const CARD_H = 3.5;
    const MARGIN_X = 0.5;
    const MARGIN_Y = 0.75;
    const COLS = 4;
    const CARDS_PER_PAGE = 8;

    for (let index = 0; index < cardsToExport.length; index++) {
      const card = cardsToExport[index];

      if (card.imgUrl) {
        if (index > 0 && index % CARDS_PER_PAGE === 0) {
          doc.addPage();
          // Yield execution to allow progress updates in the UI
          await new Promise((resolve) => setTimeout(resolve, 0));
        }

        const positionOnPage = index % CARDS_PER_PAGE;
        const colIndex = positionOnPage % COLS;
        const rowIndex = Math.floor(positionOnPage / COLS);

        const x = MARGIN_X + colIndex * CARD_W;
        const y = MARGIN_Y + rowIndex * CARD_H;

        doc.addImage(card.imgUrl, "PNG", x, y, CARD_W, CARD_H);
      }

      set({ pdfProgress: (index + 1) / cardsToExport.length });
    }

    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Keep progress at 100% for a brief moment before resetting
    setTimeout(() => set({ pdfProgress: 0 }), 1000);

    return pdfUrl;
  },
}));

export default useExportCards;
