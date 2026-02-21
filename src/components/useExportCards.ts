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

interface ExportState {
  cards: Card[];
  pdfProgress: number; // 0 to 1
  addCard(elements: Element[], imgUrl: string, theme: PreviewTheme): void;
  updateCard(
    id: string,
    data: Partial<{ elements: Element[]; imgUrl: string; theme: PreviewTheme }>,
  ): void;
  removeCard(id: string): void;
  loadFile(data: unknown): void;
  generatePdf(): Promise<string | undefined>;
}

const useExportCards = create<ExportState>((set, get) => ({
  cards: [],
  pdfProgress: 0, // Initialize progress at 0

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

  loadFile(unknownData) {
    const { success, data } = z.array(CardSchema).safeParse(unknownData);
    if (success) set({ cards: data });
  },

  generatePdf: async () => {
    const { cards } = get();
    if (cards.length === 0) return;

    // Reset progress at the start
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

    for (let index = 0; index < cards.length; index++) {
      const card = cards[index];

      if (card.imgUrl) {
        if (index > 0 && index % CARDS_PER_PAGE === 0) {
          doc.addPage();
          // Yield to UI thread so the progress bar actually animates
          await new Promise((resolve) => setTimeout(resolve, 0));
        }

        const positionOnPage = index % CARDS_PER_PAGE;
        const colIndex = positionOnPage % COLS;
        const rowIndex = Math.floor(positionOnPage / COLS);

        const x = MARGIN_X + colIndex * CARD_W;
        const y = MARGIN_Y + rowIndex * CARD_H;

        doc.addImage(card.imgUrl, "PNG", x, y, CARD_W, CARD_H);
      }

      // Update progress: (current index + 1) / total
      set({ pdfProgress: (index + 1) / cards.length });
    }

    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Optional: Reset progress after a short delay so the user sees "100%"
    setTimeout(() => set({ pdfProgress: 0 }), 1000);

    return pdfUrl;
  },
}));

export default useExportCards;
