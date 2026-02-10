import z from "zod";
import { create } from "zustand";
// Assuming these schemas exist based on your imports
import { TextElementSchema } from "./Text";
import { ImageElementSchema } from "./Image";
import { v4 as uuid } from "uuid";

// --- Schema Definitions ---

export const ElementSchema = z
  .object({
    id: z.string(),
    style: z
      .object({
        grow: z.boolean().default(false),
        align: z.enum(["start", "center", "end"]).default("center"),
      })
      .default({
        grow: false,
        align: "center",
      }),
  })
  .and(
    z.discriminatedUnion("type", [
      z.object({
        type: z.literal("text"),
        value: TextElementSchema,
      }),
      z.object({
        type: z.literal("image"),
        value: ImageElementSchema,
      }),
    ]),
  );

export type Element = z.infer<typeof ElementSchema>;

// Helper to extract the inner 'value' type based on the discriminating 'type'
export type ElementValue<T extends Element["type"]> = Extract<
  Element,
  { type: T }
>["value"];

// --- Store Types ---

type ElementRegistry = {
  elements: Element[];
  cardId?: string;

  // Actions
  registerElement<T extends Element["type"]>(
    type: T,
    initialValue?: Partial<ElementValue<T>>,
  ): void;

  unregisterElement(id: string): void;

  moveElement(fromIndex: number, toIndex: number): void;

  // Generalized update function instead of attaching setters to objects
  updateElement<T extends Element["type"]>(
    id: string,
    value: Partial<ElementValue<T>>,
  ): void;

  updateStyle(id: string, value: Partial<Element["style"]>): void;

  getElement(id: string): Element | undefined;
  loadCard(elements: Element[], cardId: string): void;
  reset(withDefault?: boolean): void;
};

// --- Store Implementation ---

const DEFAULT_CARD: Element[] = [
  {
    id: uuid(),
    type: "text",
    value: {
      value: "Nine-Lives Familiar",
      alignment: "left",
      size: 24,
      bold: true,
      italic: false,
      variant: "banner",
      expand: false,
      width: 100,
    },
    style: {
      grow: false,
      align: "center",
    },
  },
  {
    id: uuid(),
    type: "image",
    value: {
      radius: 0,
      src: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fcdna.artstation.com%2Fp%2Fassets%2Fimages%2Fimages%2F077%2F858%2F690%2Flarge%2Fbram-sels-wotc-mtg-nine-lives-familiar-bram-sels.jpg%3F1720544283&f=1&nofb=1&ipt=9603a9d37b83c0432dd935b8f872136013e941ecd562c03ab77742fd0dd08550",
      width: 95,
    },
    style: {
      grow: false,
      align: "center",
    },
  },
  {
    id: uuid(),
    type: "text",
    value: {
      value: "Creature - Cat",
      alignment: "left",
      size: 18,
      bold: true,
      italic: false,
      variant: "banner",
      expand: false,
      width: 100,
    },
    style: {
      grow: false,
      align: "center",
    },
  },
  {
    id: uuid(),
    type: "text",
    value: {
      value: `This creature enters with eight revival counters on it if you cast it.
When this creature dies, if it had a revival counter on it, return it to the battlefield with one fewer revival counter on it at the beginning of the next end step.`,
      alignment: "left",
      size: 18,
      bold: false,
      italic: true,
      variant: "box",
      expand: true,
      width: 95,
    },
    style: {
      grow: true,
      align: "center",
    },
  },
];

export const useElementRegistry = create<ElementRegistry>((set, get) => ({
  elements: DEFAULT_CARD,

  registerElement: (type, initialValue = {}) => {
    // We generate the ID here
    const id = `${type}-${uuid()}`;

    let newElement: Element;

    // We can explicitly parse based on type to ensure validity
    if (type === "text") {
      newElement = ElementSchema.parse({
        id,
        type: "text",
        value: TextElementSchema.parse(initialValue),
      });
    } else if (type === "image") {
      newElement = ElementSchema.parse({
        id,
        type: "image",
        value: ImageElementSchema.parse(initialValue),
      });
    } else {
      throw new Error(`Unsupported element type: ${type}`);
    }

    set((state) => ({
      elements: [...state.elements, newElement],
    }));
  },

  unregisterElement: (id) => {
    set((state) => ({
      elements: state.elements.filter((element) => element.id !== id),
    }));
  },

  moveElement: (fromIndex, toIndex) => {
    set((state) => {
      // Validate indices to prevent runtime crashes
      if (
        fromIndex < 0 ||
        fromIndex >= state.elements.length ||
        toIndex < 0 ||
        toIndex >= state.elements.length
      ) {
        return state;
      }

      const newElements = [...state.elements];
      const [removed] = newElements.splice(fromIndex, 1);
      newElements.splice(toIndex, 0, removed);

      return { elements: newElements };
    });
  },

  updateElement: (id, value) => {
    set((state) => {
      const index = state.elements.findIndex((e) => e.id === id);

      // FIX: Use explicit -1 check.
      // The original `if (!index)` failed when index was 0.
      if (index === -1) return state;

      const currentElement = state.elements[index];

      // Create a new element with the merged value
      const updatedElement = {
        ...currentElement,
        value: {
          ...currentElement.value,
          ...value,
        },
      } as Element; // Cast needed due to TS discrimination limitations in generic updates

      const newElements = [...state.elements];
      newElements[index] = updatedElement;

      return { elements: newElements };
    });
  },
  updateStyle: (id, style) => {
    set((state) => {
      const index = state.elements.findIndex((e) => e.id === id);

      // FIX: Use explicit -1 check.
      // The original `if (!index)` failed when index was 0.
      if (index === -1) return state;

      const currentElement = state.elements[index];

      // Create a new element with the merged value
      const updatedElement = {
        ...currentElement,
        style: {
          ...currentElement.style,
          ...style,
        },
      } as Element; // Cast needed due to TS discrimination limitations in generic updates

      const newElements = [...state.elements];
      newElements[index] = updatedElement;

      return { elements: newElements };
    });
  },

  getElement: (id) => {
    return get().elements.find((element) => element.id === id);
  },

  loadCard: (elements, cardId) => set(() => ({ elements, cardId })),
  reset(withDefault = false) {
    set(() => ({
      elements: withDefault ? DEFAULT_CARD : [],
      cardId: undefined,
    }));
  },
}));
