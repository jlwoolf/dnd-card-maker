import { create } from "zustand";
import { ElementSchema, type Element } from "./Card";
import z from "zod";
import { v4 as uuid } from "uuid";

const CardSchema = z.object({
  elements: z.array(ElementSchema),
  imgUrl: z.string(),
  id: z.string(),
});

const useExportCards = create<{
  cards: { elements: Element[]; imgUrl: string; id: string }[];
  addCard(elements: Element[], imgUrl: string): void;
  updateCard(
    id: string,
    data: Partial<{ elements: Element[]; imgUrl: string }>,
  ): void;
  removeCard(id: string): void;
  loadFile(data: unknown): void;
}>((set) => ({
  cards: [],
  addCard(elements, imgUrl) {
    set((state) => ({
      cards: [...state.cards, { elements, imgUrl, id: uuid() }],
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
}));

export default useExportCards;
