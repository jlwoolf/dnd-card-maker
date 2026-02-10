import { create } from "zustand";
import { ElementSchema, type Element } from "./Card";
import z from "zod";
import { v4 as uuid } from "uuid";
import { PreviewThemeSchema, type PreviewTheme } from "./Card/Preview";
import { jsPDF } from "jspdf"; 

const CardSchema = z.object({
  elements: z.array(ElementSchema),
  imgUrl: z.string(),
  id: z.string(),
  theme: PreviewThemeSchema,
});

export type Card = z.infer<typeof CardSchema>;

const useExportCards = create<{
  cards: Card[];
  addCard(elements: Element[], imgUrl: string, theme: PreviewTheme): void;
  updateCard(
    id: string,
    data: Partial<{ elements: Element[]; imgUrl: string; theme: PreviewTheme }>,
  ): void;
  removeCard(id: string): void;
  loadFile(data: unknown): void;
  generatePdf(): Promise<string | undefined>;
}>((set, get) => ({
  cards: [],
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
      if (cardIndex === -1) {
        return {};
      }

      const currentCard = state.cards[cardIndex];
      const newCard = {
        ...currentCard,
        ...data,
        id,
      };

      const newCards = [...state.cards];
      newCards[cardIndex] = newCard;

      return { cards: newCards };
    });
  },
  loadFile(unknownData) {
    const { success, data } = z.array(CardSchema).safeParse(unknownData);
    if (success) {
      set(() => ({ cards: data }));
    }
  },

  generatePdf: async () => {
    const { cards } = get();
    if (cards.length === 0) return;

    // Setup PDF: Landscape, Inches, Letter (11x8.5)
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "in",
      format: "letter",
    });

    const CARD_W = 2.5;
    const CARD_H = 3.5;
    // Centering calculations:
    // Page Width 11" - (4 cols * 2.5") = 1" remaining / 2 = 0.5" margin
    const MARGIN_X = 0.5; 
    // Page Height 8.5" - (2 rows * 3.5") = 1.5" remaining / 2 = 0.75" margin
    const MARGIN_Y = 0.75; 
    
    const COLS = 4;
    const CARDS_PER_PAGE = 8;

    cards.forEach((card, index) => {
      // Safety check: ensure we actually have data
      if (!card.imgUrl) return;

      // Add a new page if we exceed the limit per page
      if (index > 0 && index % CARDS_PER_PAGE === 0) {
        doc.addPage();
      }

      // Calculate grid position
      const positionOnPage = index % CARDS_PER_PAGE;
      const colIndex = positionOnPage % COLS;
      const rowIndex = Math.floor(positionOnPage / COLS);

      const x = MARGIN_X + colIndex * CARD_W;
      const y = MARGIN_Y + rowIndex * CARD_H;

      // DIRECT INJECTION: Pass the Data URL string directly.
      // We explicitly tell jsPDF this is a "PNG".
      doc.addImage(card.imgUrl, "PNG", x, y, CARD_W, CARD_H);
    });

    return doc.output("dataurlstring");
  },
}));

export default useExportCards;