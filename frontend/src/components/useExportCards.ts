import { jsPDF } from "jspdf";
import { v4 as uuid } from "uuid";
import z from "zod";
import { create } from "zustand";
import { ElementSchema, type Element } from "./Card";
import { PreviewThemeSchema, type PreviewTheme } from "./Card/Preview";

/**
 * Zod schema for a saved card in the deck.
 */
const CardSchema = z.object({
  /** Elements configuration for the card */
  elements: z.array(ElementSchema),
  /** PNG data URL of the card preview */
  imgUrl: z.string(),
  /** Unique card ID */
  id: z.string(),
  /** The theme applied to this card */
  theme: PreviewThemeSchema,
});

export type Card = z.infer<typeof CardSchema>;

interface ExportState {
  /** List of cards in the deck */
  cards: Card[];
  /** Progress of PDF generation (0 to 1) */
  pdfProgress: number;
  /** Adds a new card to the deck */
  addCard(elements: Element[], imgUrl: string, theme: PreviewTheme): void;
  /** Updates an existing card in the deck */
  updateCard(
    id: string,
    data: Partial<{ elements: Element[]; imgUrl: string; theme: PreviewTheme }>,
  ): void;
  /** Removes a card from the deck by ID */
  removeCard(id: string): void;
  /** Loads a deck from raw data (e.g., from a JSON file) */
  loadFile(data: unknown): void;
  /** Sets the entire cards array */
  setCards(cards: Card[]): void;
  /** Generates a PDF of specified cards (or the entire deck) and returns a blob URL */
  generatePdf(cardIds?: string[]): Promise<string | undefined>;
}

/**
 * useExportCards is a Zustand store that manages the deck of cards and provides export utilities.
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

    setTimeout(() => set({ pdfProgress: 0 }), 1000);

    return pdfUrl;
  },
}));

export default useExportCards;
